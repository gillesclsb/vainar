import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import Avatar from "../components/Avatar";
import { api } from "../api/api";

export default function Friends({ user, onBack }) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [results, setResults] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(null);

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  const socket = useMemo(() => io("http://localhost:3000", {
    auth: { token: localStorage.getItem("vainaarToken") },
    transports: ["websocket", "polling"],
    reconnection: true
  }), []);

  async function loadFriends() {
    try {
      const data = await api.getFriends();
      setFriends(data.friends);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadFriends();

    socket.on("friend:request", loadFriends);
    socket.on("friend:accepted", loadFriends);
    socket.on("presence:update", loadFriends);
    socket.on("dm:new", message => {
      if (activeFriend && (message.senderId === activeFriend.id || message.receiverId === activeFriend.id)) {
        setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
      }
    });

    socket.on("call:incoming", payload => setIncomingCall(payload));
    socket.on("call:answered", async payload => {
      if (peerRef.current) await peerRef.current.setRemoteDescription(payload.answer);
      setCallState(current => current ? { ...current, status: "connected" } : current);
    });
    socket.on("call:ice", async payload => {
      try {
        if (peerRef.current && payload.candidate) {
          await peerRef.current.addIceCandidate(payload.candidate);
        }
      } catch {}
    });
    socket.on("call:rejected", endCallLocal);
    socket.on("call:ended", endCallLocal);

    return () => {
      socket.disconnect();
      stopMedia();
    };
  }, [socket, activeFriend]);

  async function search(event) {
    const query = event.target.value;
    if (query.length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await api.searchUsers(query);
      setResults(data.users);
    } catch (e) {
      setError(e.message);
    }
  }

  async function addFriend(id) {
    try {
      await api.sendFriendRequest(id);
      setResults(current => current.map(item => item.id === id ? { ...item, friendship: "pending", requestDirection: "outgoing" } : item));
      loadFriends();
    } catch (e) {
      setError(e.message);
    }
  }

  async function respond(requestId, action) {
    await api.respondFriendRequest(requestId, action);
    loadFriends();
  }

  async function openChat(friend) {
    setActiveFriend(friend);
    const data = await api.getDirectMessages(friend.id);
    setMessages(data.messages);
  }

  async function sendMessage(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") || "").trim();
    if (!body || !activeFriend) return;
    try {
      await api.sendDirectMessage(activeFriend.id, body);
      event.currentTarget.reset();
    } catch (e) {
      setError(e.message);
    }
  }

  function createPeer(targetUserId) {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peer.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("call:ice", { targetUserId, candidate: event.candidate });
      }
    };

    peer.ontrack = event => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
    };

    peerRef.current = peer;
    return peer;
  }

  async function getMedia(mode) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === "video"
    });
    streamRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;
    return stream;
  }

  async function startCall(mode) {
    if (!activeFriend) return;
    try {
      const peer = createPeer(activeFriend.id);
      const stream = await getMedia(mode);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      setCallState({ target: activeFriend, mode, status: "calling" });
      window.dispatchEvent(new Event("vainaar:call-start"));
      socket.emit("call:offer", {
        targetUserId: activeFriend.id,
        mode,
        offer
      });
    } catch (e) {
      setError("Camera of microfoon kon niet worden geopend.");
      endCallLocal();
    }
  }

  async function acceptCall() {
    const call = incomingCall;
    setIncomingCall(null);
    try {
      const friend = friends.find(item => item.id === call.fromUserId) || {
        id: call.fromUserId,
        name: call.fromName,
        avatar: call.fromAvatar
      };
      setActiveFriend(friend);
      const peer = createPeer(call.fromUserId);
      const stream = await getMedia(call.mode);
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      await peer.setRemoteDescription(call.offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      setCallState({ target: friend, mode: call.mode, status: "connected" });
      window.dispatchEvent(new Event("vainaar:call-start"));
      socket.emit("call:answer", {
        targetUserId: call.fromUserId,
        answer
      });
    } catch {
      rejectCall();
    }
  }

  function rejectCall() {
    if (incomingCall) {
      socket.emit("call:reject", { targetUserId: incomingCall.fromUserId });
    }
    setIncomingCall(null);
  }

  function stopMedia() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
  }

  function endCallLocal() {
    stopMedia();
    setCallState(null);
    window.dispatchEvent(new Event("vainaar:call-end"));
  }

  function endCall() {
    if (callState?.target) {
      socket.emit("call:end", { targetUserId: callState.target.id });
    }
    endCallLocal();
  }

  return (
    <main className="friends-page">
      <aside className="friends-sidebar panel">
        <div className="friends-title">
          <button onClick={onBack}>←</button>
          <div><span className="kicker">SOCIAL NODE</span><h2>VRIENDEN</h2></div>
        </div>

        <input className="friend-search" placeholder="Zoek naam of e-mail..." onChange={search} />

        {results.length > 0 && (
          <div className="search-results">
            {results.map(person => (
              <div className="friend-row" key={person.id}>
                <UserAvatar person={person} />
                <span><strong>{person.name}</strong><small>{person.email}</small></span>
                {person.friendship === "none" && <button onClick={() => addFriend(person.id)}>＋</button>}
                {person.friendship === "pending" && <small>WACHTEND</small>}
                {person.friendship === "accepted" && <small>VRIEND</small>}
              </div>
            ))}
          </div>
        )}

        {incoming.length > 0 && <>
          <h4>VERZOEKEN</h4>
          {incoming.map(person => (
            <div className="friend-row request" key={person.requestId}>
              <UserAvatar person={person} />
              <span><strong>{person.name}</strong><small>Wil vriend worden</small></span>
              <button onClick={() => respond(person.requestId, "accept")}>✓</button>
              <button onClick={() => respond(person.requestId, "decline")}>×</button>
            </div>
          ))}
        </>}

        <h4>MIJN VRIENDEN</h4>
        <div className="friend-list">
          {friends.map(friend => (
            <button className={`friend-card ${activeFriend?.id === friend.id ? "active" : ""}`} key={friend.id} onClick={() => openChat(friend)}>
              <UserAvatar person={friend} />
              <span><strong>{friend.name}</strong><small>{friend.online ? "● Online" : "○ Offline"}</small></span>
            </button>
          ))}
          {friends.length === 0 && <p className="muted">Nog geen vrienden toegevoegd.</p>}
        </div>
      </aside>

      <section className="dm-panel panel">
        {!activeFriend ? (
          <div className="dm-empty">
            <div className="dm-icon">✦</div>
            <h2>KIES EEN VRIEND</h2>
            <p>Start een privéchat, audiogesprek of videogesprek.</p>
          </div>
        ) : (
          <>
            <header className="dm-header">
              <div className="dm-person"><UserAvatar person={activeFriend} /><div><h3>{activeFriend.name}</h3><small>{activeFriend.online ? "● Online" : "○ Offline"}</small></div></div>
              <div className="call-buttons">
                <button onClick={() => startCall("audio")} title="Audiobellen">☎</button>
                <button onClick={() => startCall("video")} title="Videobellen">▣</button>
              </div>
            </header>

            <div className="dm-messages">
              {messages.map(message => (
                <article className={message.senderId === user.id ? "mine" : ""} key={message.id}>
                  <strong>{message.sender.name}</strong>
                  <p>{message.body}</p>
                  <small>{new Date(message.createdAt).toLocaleString("nl-NL")}</small>
                </article>
              ))}
            </div>

            <form className="dm-composer" onSubmit={sendMessage}>
              <input name="body" placeholder={`Privébericht aan ${activeFriend.name}`} maxLength="1000" />
              <button>➤</button>
            </form>
          </>
        )}
      </section>

      {(callState || incomingCall) && (
        <div className="call-overlay">
          <div className="call-window panel">
            {incomingCall && !callState ? (
              <div className="incoming-call">
                <UserAvatar person={{ name: incomingCall.fromName, avatar: incomingCall.fromAvatar }} />
                <h2>{incomingCall.fromName}</h2>
                <p>Inkomend {incomingCall.mode === "video" ? "videogesprek" : "audiogesprek"}</p>
                <div>
                  <button className="accept-call" onClick={acceptCall}>OPNEMEN</button>
                  <button className="end-call" onClick={rejectCall}>WEIGEREN</button>
                </div>
              </div>
            ) : (
              <>
                <div className={`video-stage ${callState?.mode === "audio" ? "audio-only" : ""}`}>
                  <video ref={remoteVideo} autoPlay playsInline />
                  <video ref={localVideo} autoPlay playsInline muted className="local-video" />
                  {callState?.mode === "audio" && <div className="audio-avatar"><UserAvatar person={callState.target} /><h2>{callState.target.name}</h2></div>}
                </div>
                <div className="call-status">{callState?.status === "calling" ? "Bellen..." : "Verbonden"}</div>
                <button className="end-call" onClick={endCall}>GESPREK STOPPEN</button>
              </>
            )}
          </div>
        </div>
      )}

      {error && <div className="toast-error">{error}<button onClick={() => setError("")}>×</button></div>}
    </main>
  );
}

function UserAvatar({ person }) {
  return person.avatar
    ? <Avatar config={person.avatar} small />
    : <div className="friend-initials">{person.name?.slice(0, 2).toUpperCase()}</div>;
}
