import express from "express";
import http from "http";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

fs.mkdirSync(dataDir, { recursive: true });

const databasePath = path.join(dataDir, "vainaar.sqlite");
const db = new Database(databasePath);

const JWT_SECRET = process.env.JWT_SECRET || "vainaar-local-secret-change-me";

db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_json TEXT,
    avatar_done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    channel TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '💬',
    is_private INTEGER NOT NULL DEFAULT 0,
    owner_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS channel_members (
    channel_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY(channel_id, user_id),
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id),
    FOREIGN KEY(requester_id) REFERENCES users(id),
    FOREIGN KEY(addressee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS direct_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );
`);

const channelColumns = db.prepare("PRAGMA table_info(channels)").all();
if (!channelColumns.some(column => column.name === "emoji")) {
  db.exec("ALTER TABLE channels ADD COLUMN emoji TEXT NOT NULL DEFAULT '💬'");
}

const defaultChannels = [
  ["algemeen", "Algemeen", "🌐"],
  ["deals", "Deals", "🔥"],
  ["vragen", "Vragen", "❓"],
  ["off-topic", "Off-topic", "🎮"]
];

for (const [slug, name, emoji] of defaultChannels) {
  db.prepare(`
    INSERT OR IGNORE INTO channels (slug, name, emoji, is_private, owner_id)
    VALUES (?, ?, ?, 0, NULL)
  `).run(slug, name, emoji);

  db.prepare(`
    UPDATE channels SET emoji = ?
    WHERE slug = ? AND (emoji IS NULL OR emoji = '' OR emoji = '💬')
  `).run(emoji, slug);
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"], credentials: true }
});

const activeSockets = new Set();
const userSockets = new Map();
const socketUsers = new Map();

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarDone: Boolean(row.avatar_done),
    avatar: row.avatar_json ? JSON.parse(row.avatar_json) : null
  };
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "30d" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Je sessie is verlopen. Log opnieuw in." });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, onlineCount: activeSockets.size });
});

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || password.length < 6) {
    return res.status(400).json({ error: "Vul alle velden correct in." });
  }

  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    return res.status(409).json({ error: "Dit e-mailadres bestaat al." });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
  ).run(name, email, hash);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "E-mail of wachtwoord klopt niet." });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/api/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.sub);
  if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden." });
  res.json({ user: publicUser(user) });
});

app.put("/api/me/avatar", requireAuth, (req, res) => {
  const avatar = req.body.avatar;

  if (!avatar || typeof avatar !== "object") {
    return res.status(400).json({ error: "Ongeldige charactergegevens." });
  }

  db.prepare(`
    UPDATE users
    SET avatar_json = ?, avatar_done = 1
    WHERE id = ?
  `).run(JSON.stringify(avatar), req.auth.sub);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.auth.sub);
  res.json({ user: publicUser(user) });
});



function friendshipStatus(userA, userB) {
  return db.prepare(`
    SELECT * FROM friendships
    WHERE (requester_id = ? AND addressee_id = ?)
       OR (requester_id = ? AND addressee_id = ?)
    LIMIT 1
  `).get(userA, userB, userB, userA);
}

function areFriends(userA, userB) {
  const relation = friendshipStatus(userA, userB);
  return Boolean(relation && relation.status === "accepted");
}

app.get("/api/users/search", requireAuth, (req, res) => {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) return res.json({ users: [] });

  const like = `%${query}%`;
  const rows = db.prepare(`
    SELECT id, name, email, avatar_json
    FROM users
    WHERE id != ? AND (name LIKE ? OR email LIKE ?)
    ORDER BY name ASC
    LIMIT 20
  `).all(req.auth.sub, like, like);

  res.json({
    users: rows.map(row => {
      const relation = friendshipStatus(req.auth.sub, row.id);
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar_json ? JSON.parse(row.avatar_json) : null,
        friendship: relation ? relation.status : "none",
        requestDirection: relation
          ? (relation.requester_id === req.auth.sub ? "outgoing" : "incoming")
          : null
      };
    })
  });
});

app.get("/api/friends", requireAuth, (req, res) => {
  const accepted = db.prepare(`
    SELECT users.id, users.name, users.email, users.avatar_json
    FROM friendships
    JOIN users ON users.id = CASE
      WHEN friendships.requester_id = ? THEN friendships.addressee_id
      ELSE friendships.requester_id
    END
    WHERE friendships.status = 'accepted'
      AND (friendships.requester_id = ? OR friendships.addressee_id = ?)
    ORDER BY users.name ASC
  `).all(req.auth.sub, req.auth.sub, req.auth.sub);

  const incoming = db.prepare(`
    SELECT friendships.id AS request_id, users.id, users.name, users.email, users.avatar_json
    FROM friendships
    JOIN users ON users.id = friendships.requester_id
    WHERE friendships.addressee_id = ? AND friendships.status = 'pending'
    ORDER BY friendships.id DESC
  `).all(req.auth.sub);

  const outgoing = db.prepare(`
    SELECT friendships.id AS request_id, users.id, users.name, users.email, users.avatar_json
    FROM friendships
    JOIN users ON users.id = friendships.addressee_id
    WHERE friendships.requester_id = ? AND friendships.status = 'pending'
    ORDER BY friendships.id DESC
  `).all(req.auth.sub);

  const mapUser = row => ({
    id: row.id,
    requestId: row.request_id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_json ? JSON.parse(row.avatar_json) : null,
    online: userSockets.has(row.id)
  });

  res.json({
    friends: accepted.map(mapUser),
    incoming: incoming.map(mapUser),
    outgoing: outgoing.map(mapUser)
  });
});

app.post("/api/friends/request", requireAuth, (req, res) => {
  const friendId = Number(req.body.userId);
  if (!friendId || friendId === req.auth.sub) {
    return res.status(400).json({ error: "Ongeldige gebruiker." });
  }

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(friendId);
  if (!target) return res.status(404).json({ error: "Gebruiker niet gevonden." });

  const existing = friendshipStatus(req.auth.sub, friendId);
  if (existing) {
    return res.status(409).json({ error: "Er bestaat al een vriendschapsverzoek of vriendschap." });
  }

  const result = db.prepare(`
    INSERT INTO friendships (requester_id, addressee_id, status)
    VALUES (?, ?, 'pending')
  `).run(req.auth.sub, friendId);

  io.to(`user:${friendId}`).emit("friend:request", { fromUserId: req.auth.sub });
  res.status(201).json({ requestId: Number(result.lastInsertRowid) });
});

app.post("/api/friends/:requestId/respond", requireAuth, (req, res) => {
  const requestId = Number(req.params.requestId);
  const action = String(req.body.action || "");
  const request = db.prepare(`
    SELECT * FROM friendships
    WHERE id = ? AND addressee_id = ? AND status = 'pending'
  `).get(requestId, req.auth.sub);

  if (!request) return res.status(404).json({ error: "Verzoek niet gevonden." });

  if (action === "accept") {
    db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(requestId);
    io.to(`user:${request.requester_id}`).emit("friend:accepted", { userId: req.auth.sub });
    return res.json({ ok: true });
  }

  if (action === "decline") {
    db.prepare("DELETE FROM friendships WHERE id = ?").run(requestId);
    return res.json({ ok: true });
  }

  res.status(400).json({ error: "Ongeldige actie." });
});

app.delete("/api/friends/:friendId", requireAuth, (req, res) => {
  const friendId = Number(req.params.friendId);
  db.prepare(`
    DELETE FROM friendships
    WHERE (requester_id = ? AND addressee_id = ?)
       OR (requester_id = ? AND addressee_id = ?)
  `).run(req.auth.sub, friendId, friendId, req.auth.sub);
  res.json({ ok: true });
});

app.get("/api/dm/:friendId", requireAuth, (req, res) => {
  const friendId = Number(req.params.friendId);
  if (!areFriends(req.auth.sub, friendId)) {
    return res.status(403).json({ error: "Jullie zijn geen vrienden." });
  }

  const rows = db.prepare(`
    SELECT direct_messages.id, direct_messages.sender_id, direct_messages.receiver_id,
           direct_messages.body, direct_messages.created_at,
           users.name AS sender_name, users.avatar_json AS sender_avatar
    FROM direct_messages
    JOIN users ON users.id = direct_messages.sender_id
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY direct_messages.id ASC
    LIMIT 500
  `).all(req.auth.sub, friendId, friendId, req.auth.sub);

  res.json({
    messages: rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      body: row.body,
      createdAt: row.created_at,
      sender: {
        name: row.sender_name,
        avatar: row.sender_avatar ? JSON.parse(row.sender_avatar) : null
      }
    }))
  });
});

app.post("/api/dm/:friendId", requireAuth, (req, res) => {
  const friendId = Number(req.params.friendId);
  const body = String(req.body.body || "").trim();

  if (!areFriends(req.auth.sub, friendId)) {
    return res.status(403).json({ error: "Jullie zijn geen vrienden." });
  }
  if (!body || body.length > 1000) {
    return res.status(400).json({ error: "Ongeldig bericht." });
  }

  const result = db.prepare(`
    INSERT INTO direct_messages (sender_id, receiver_id, body)
    VALUES (?, ?, ?)
  `).run(req.auth.sub, friendId, body);

  const sender = db.prepare("SELECT name, avatar_json FROM users WHERE id = ?").get(req.auth.sub);
  const message = {
    id: Number(result.lastInsertRowid),
    senderId: req.auth.sub,
    receiverId: friendId,
    body,
    createdAt: new Date().toISOString(),
    sender: {
      name: sender.name,
      avatar: sender.avatar_json ? JSON.parse(sender.avatar_json) : null
    }
  };

  io.to(`user:${friendId}`).emit("dm:new", message);
  io.to(`user:${req.auth.sub}`).emit("dm:new", message);
  res.status(201).json({ message });
});

app.get("/api/channels", requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT channels.id, channels.slug, channels.name, channels.emoji,
           channels.is_private, channels.owner_id
    FROM channels
    LEFT JOIN channel_members ON channel_members.channel_id = channels.id
    WHERE channels.is_private = 0
       OR channels.owner_id = ?
       OR channel_members.user_id = ?
    ORDER BY channels.is_private ASC, channels.id ASC
  `).all(req.auth.sub, req.auth.sub);

  res.json({
    channels: rows.map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      emoji: row.emoji || "💬",
      isPrivate: Boolean(row.is_private),
      isOwner: row.owner_id === req.auth.sub
    }))
  });
});

app.post("/api/channels", requireAuth, (req, res) => {
  const name = String(req.body.name || "").trim();
  const emoji = String(req.body.emoji || "🔒").trim().slice(0, 8) || "🔒";
  const isPrivate = req.body.isPrivate !== false;

  if (name.length < 2 || name.length > 30) {
    return res.status(400).json({ error: "Kanaalnaam moet 2 tot 30 tekens zijn." });
  }

  const baseSlug = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "kanaal";

  let slug = baseSlug;
  let number = 2;
  while (db.prepare("SELECT id FROM channels WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${number++}`;
  }

  const result = db.prepare(`
    INSERT INTO channels (slug, name, emoji, is_private, owner_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(slug, name, emoji, isPrivate ? 1 : 0, req.auth.sub);

  db.prepare(`
    INSERT OR IGNORE INTO channel_members (channel_id, user_id)
    VALUES (?, ?)
  `).run(result.lastInsertRowid, req.auth.sub);

  res.status(201).json({
    channel: {
      id: Number(result.lastInsertRowid),
      slug,
      name,
      emoji,
      isPrivate,
      isOwner: true
    }
  });
});

app.post("/api/channels/:id/members", requireAuth, (req, res) => {
  const channel = db.prepare("SELECT * FROM channels WHERE id = ?").get(req.params.id);
  if (!channel || channel.owner_id !== req.auth.sub) {
    return res.status(403).json({ error: "Alleen de eigenaar kan leden toevoegen." });
  }

  const email = String(req.body.email || "").trim().toLowerCase();
  const user = db.prepare("SELECT id, name, email FROM users WHERE email = ?").get(email);
  if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden." });

  db.prepare(`
    INSERT OR IGNORE INTO channel_members (channel_id, user_id)
    VALUES (?, ?)
  `).run(channel.id, user.id);

  res.json({ member: user });
});

function canAccessChannel(userId, slug) {
  const channel = db.prepare("SELECT * FROM channels WHERE slug = ?").get(slug);
  if (!channel) return false;
  if (!channel.is_private) return true;
  if (channel.owner_id === userId) return true;

  return Boolean(db.prepare(`
    SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?
  `).get(channel.id, userId));
}

app.get("/api/messages/:channel", requireAuth, (req, res) => {
  if (!canAccessChannel(req.auth.sub, req.params.channel)) {
    return res.status(403).json({ error: "Geen toegang tot dit kanaal." });
  }

  const rows = db.prepare(`
    SELECT messages.id, messages.channel, messages.body, messages.created_at,
           users.id AS user_id, users.name, users.avatar_json
    FROM messages
    JOIN users ON users.id = messages.user_id
    WHERE messages.channel = ?
    ORDER BY messages.id ASC
    LIMIT 300
  `).all(req.params.channel);

  res.json({
    messages: rows.map(row => ({
      id: row.id,
      channel: row.channel,
      body: row.body,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.name,
        avatar: row.avatar_json ? JSON.parse(row.avatar_json) : null
      }
    }))
  });
});

app.post("/api/messages", requireAuth, (req, res) => {
  const channel = String(req.body.channel || "").trim();
  const body = String(req.body.body || "").trim();

  if (!channel || !body || body.length > 300) {
    return res.status(400).json({ error: "Ongeldig bericht." });
  }

  if (!canAccessChannel(req.auth.sub, channel)) {
    return res.status(403).json({ error: "Geen toegang tot dit kanaal." });
  }

  const result = db.prepare(
    "INSERT INTO messages (user_id, channel, body) VALUES (?, ?, ?)"
  ).run(req.auth.sub, channel, body);

  const row = db.prepare(`
    SELECT messages.id, messages.channel, messages.body, messages.created_at,
           users.id AS user_id, users.name, users.avatar_json
    FROM messages
    JOIN users ON users.id = messages.user_id
    WHERE messages.id = ?
  `).get(result.lastInsertRowid);

  const message = {
    id: row.id,
    channel: row.channel,
    body: row.body,
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      name: row.name,
      avatar: row.avatar_json ? JSON.parse(row.avatar_json) : null
    }
  };

  io.to(channel).emit("message:new", message);
  res.status(201).json({ message });
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = Number(payload.sub);
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", socket => {
  const userId = socket.userId;
  activeSockets.add(socket.id);
  socketUsers.set(socket.id, userId);

  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socket.id);

  socket.join(`user:${userId}`);
  io.emit("server:online-count", userSockets.size);
  io.emit("presence:update", { userId, online: true });

  socket.on("channel:join", channel => socket.join(channel));
  socket.on("channel:leave", channel => socket.leave(channel));
  socket.on("presence:request", () => socket.emit("server:online-count", userSockets.size));

  socket.on("call:offer", payload => {
    const targetId = Number(payload.targetUserId);
    if (!areFriends(userId, targetId)) return;

    const caller = db.prepare("SELECT id, name, avatar_json FROM users WHERE id = ?").get(userId);
    io.to(`user:${targetId}`).emit("call:incoming", {
      fromUserId: userId,
      fromName: caller.name,
      fromAvatar: caller.avatar_json ? JSON.parse(caller.avatar_json) : null,
      mode: payload.mode,
      offer: payload.offer
    });
  });

  socket.on("call:answer", payload => {
    io.to(`user:${Number(payload.targetUserId)}`).emit("call:answered", {
      fromUserId: userId,
      answer: payload.answer
    });
  });

  socket.on("call:ice", payload => {
    io.to(`user:${Number(payload.targetUserId)}`).emit("call:ice", {
      fromUserId: userId,
      candidate: payload.candidate
    });
  });

  socket.on("call:reject", payload => {
    io.to(`user:${Number(payload.targetUserId)}`).emit("call:rejected", {
      fromUserId: userId
    });
  });

  socket.on("call:end", payload => {
    io.to(`user:${Number(payload.targetUserId)}`).emit("call:ended", {
      fromUserId: userId
    });
  });

  socket.on("disconnect", () => {
    activeSockets.delete(socket.id);
    socketUsers.delete(socket.id);

    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        io.emit("presence:update", { userId, online: false });
      }
    }

    io.emit("server:online-count", userSockets.size);
  });
});

const PORT = Number(process.env.PORT || 3000);

server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Poort ${PORT} is al in gebruik door een ander programma.`);
    console.error("Sluit oude Vainaar-vensters of gebruik start.bat opnieuw.");
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Vainaar backend draait op http://localhost:${PORT}`);
});
