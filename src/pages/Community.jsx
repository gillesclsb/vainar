import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import Avatar from "../components/Avatar";
import { api } from "../api/api";

export default function Community({ user, onLogout, onEditAvatar, onFriends, onSettings }) {
  const [channels, setChannels] = useState([]);
  const [channel, setChannel] = useState(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const socket = useMemo(() => io("http://localhost:3000", {
    auth: { token: localStorage.getItem("vainaarToken") },
    transports: ["websocket", "polling"],
    reconnection: true
  }), []);

  useEffect(() => {
    api.getChannels().then(data => {
      setChannels(data.channels);
      setChannel(current => current || data.channels[0] || null);
    }).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!channel) return;

    api.getMessages(channel.slug)
      .then(data => setMessages(data.messages))
      .catch(e => setError(e.message));

    socket.emit("channel:join", channel.slug);

    const handleMessage = message => {
      if (message.channel === channel.slug) {
        setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
      }
    };

    socket.on("message:new", handleMessage);
    socket.on("server:online-count", count => setOnlineCount(Math.max(1, Number(count) || 1)));
    socket.emit("presence:request");

    return () => {
      socket.emit("channel:leave", channel.slug);
      socket.off("message:new", handleMessage);
      socket.off("server:online-count");
    };
  }, [channel, socket]);

  useEffect(() => () => socket.disconnect(), [socket]);

  async function createChannel(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await api.createChannel(String(form.get("name")), String(form.get("emoji") || "🔒"), true);
      setChannels(current => [...current, data.channel]);
      setChannel(data.channel);
      setShowCreate(false);
      event.currentTarget.reset();
    } catch (e) {
      setError(e.message);
    }
  }

  async function send(event) {
    event.preventDefault();
    if (!channel) return;
    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") || "").trim();
    if (!body) return;

    try {
      const data = await api.sendMessage(channel.slug, body);
      setMessages(current => current.some(item => item.id === data.message.id) ? current : [...current, data.message]);
      event.currentTarget.reset();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="community">
      <aside className="sidebar">
        <div className="side-brand"><span>V</span><strong>VAINAAR</strong></div>

        <button className="profile-card" onClick={onEditAvatar}>
          <Avatar config={user.avatar} small />
          <div><strong>{user.name}</strong><small>● Online</small></div>
        </button>

        <nav className="menu">
          <button>⌂ HOME</button>
          <button onClick={onFriends}>☻ VRIENDEN</button>
          <button onClick={onEditAvatar}>♙ PROFIEL</button>
          <button onClick={onSettings}>⚙ INSTELLINGEN</button>
          <button onClick={onLogout}>↪ UITLOGGEN</button>
        </nav>

        <div className="channel-heading">
          <h4>KANALEN</h4>
          <button className="channel-add" onClick={() => setShowCreate(true)}>＋</button>
        </div>

        <nav className="channels led-channels">
          {channels.map(item => (
            <button
              key={item.id}
              className={`${channel?.id === item.id ? "active" : ""} ${item.isPrivate ? "private" : ""}`}
              onClick={() => setChannel(item)}
            >
              <span className="channel-emoji">{item.emoji || (item.isPrivate ? "🔒" : "💬")}</span>
              <strong>{item.name}</strong>
              {item.isPrivate && <small>PRIVÉ</small>}
            </button>
          ))}
        </nav>

        <div className="node">VAINAAR NODE <span>{onlineCount} ONLINE</span></div>
      </aside>

      <section className="chat">
        <header>
          <div>
            <h2>{channel?.emoji || (channel?.isPrivate ? "🔒" : "💬")} {channel?.name || "Kanaal"}</h2>
            {channel?.isPrivate && <small className="private-label">Alleen genodigde leden</small>}
          </div>
          <div className="search">⌕ <input placeholder="Zoeken..." /></div>
        </header>

        <div className="messages">
          {messages.length === 0 && <div className="empty">Nog geen berichten in dit kanaal.</div>}
          {messages.map(message => (
            <article key={message.id}>
              <div className="msg-avatar">
                {message.user.avatar ? <Avatar config={message.user.avatar} small /> : message.user.name.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div className="meta">
                  <strong>{message.user.name}</strong>
                  <small>{new Date(message.createdAt).toLocaleString("nl-NL")}</small>
                </div>
                <p>{message.body}</p>
              </div>
            </article>
          ))}
        </div>

        <form className="composer" onSubmit={send}>
          <button type="button">＋</button>
          <input name="body" placeholder={`Bericht sturen naar ${channel?.name || "kanaal"}`} maxLength="300" />
          <button className="send">➤</button>
        </form>

        {error && <div className="error">{error}</div>}
      </section>

      <aside className="members">
        <h3>ONLINE LEDEN — {onlineCount}</h3>
        <div className="member">
          <div>{user.name.slice(0,2).toUpperCase()}</div>
          <span><strong>{user.name}</strong><small>● Online</small></span>
        </div>
      </aside>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <form className="panel channel-modal" onSubmit={createChannel} onClick={e => e.stopPropagation()}>
            <span className="kicker yellow">PRIVATE NODE</span>
            <h2>NIEUW PRIVÉKANAAL</h2>
            <p>Alleen jij en later toegevoegde leden kunnen dit kanaal zien.</p>
            <label>KANAALNAAM</label>
            <input name="name" required minLength="2" maxLength="30" placeholder="Bijvoorbeeld: Mijn team" />

            <label>KIES EEN EMOJI</label>
            <div className="emoji-picker">
              {["🔒","🎮","🔥","💎","🚀","🎵","⚽","📚","👥","🌙"].map(emoji => (
                <label key={emoji}>
                  <input type="radio" name="emoji" value={emoji} defaultChecked={emoji === "🔒"} />
                  <span>{emoji}</span>
                </label>
              ))}
            </div>

            <button className="primary yellow-btn">PRIVÉKANAAL MAKEN</button>
            <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>ANNULEREN</button>
          </form>
        </div>
      )}
    </main>
  );
}
