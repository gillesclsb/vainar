const API_URL = "http://localhost:3000/api";

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = localStorage.getItem("vainaarToken");
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "Er ging iets mis.");
  return data;
}

export const api = {
  register(payload) {
    return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },
  login(payload) {
    return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  },
  me() {
    return request("/me");
  },
  saveAvatar(avatar) {
    return request("/me/avatar", { method: "PUT", body: JSON.stringify({ avatar }) });
  },
  searchUsers(query) {
    return request(`/users/search?q=${encodeURIComponent(query)}`);
  },
  getFriends() {
    return request("/friends");
  },
  sendFriendRequest(userId) {
    return request("/friends/request", {
      method: "POST",
      body: JSON.stringify({ userId })
    });
  },
  respondFriendRequest(requestId, action) {
    return request(`/friends/${requestId}/respond`, {
      method: "POST",
      body: JSON.stringify({ action })
    });
  },
  removeFriend(friendId) {
    return request(`/friends/${friendId}`, { method: "DELETE" });
  },
  getDirectMessages(friendId) {
    return request(`/dm/${friendId}`);
  },
  sendDirectMessage(friendId, body) {
    return request(`/dm/${friendId}`, {
      method: "POST",
      body: JSON.stringify({ body })
    });
  },
  getChannels() {
    return request("/channels");
  },
  createChannel(name, emoji = "🔒", isPrivate = true) {
    return request("/channels", {
      method: "POST",
      body: JSON.stringify({ name, emoji, isPrivate })
    });
  },
  addChannelMember(channelId, email) {
    return request(`/channels/${channelId}/members`, {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  getMessages(channel) {
    return request(`/messages/${encodeURIComponent(channel)}`);
  },
  sendMessage(channel, body) {
    return request("/messages", { method: "POST", body: JSON.stringify({ channel, body }) });
  }
};
