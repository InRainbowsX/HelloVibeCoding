import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("vibe.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'unclaimed',
    votes INTEGER DEFAULT 0,
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idea_id TEXT,
    user TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(idea_id) REFERENCES ideas(id)
  );

  CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    author TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // API Routes
  app.get("/api/ideas", (req, res) => {
    const ideas = db.prepare("SELECT * FROM ideas ORDER BY created_at DESC").all();
    res.json(ideas);
  });

  app.post("/api/ideas", (req, res) => {
    const { id, title, description, category, author } = req.body;
    db.prepare("INSERT INTO ideas (id, title, description, category, author) VALUES (?, ?, ?, ?, ?)")
      .run(id, title, description, category, author);
    res.json({ success: true });
  });

  app.post("/api/ideas/:id/vote", (req, res) => {
    db.prepare("UPDATE ideas SET votes = votes + 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/ideas/:id/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE idea_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(messages);
  });

  app.get("/api/apps", (req, res) => {
    const apps = db.prepare("SELECT * FROM apps ORDER BY created_at DESC").all();
    res.json(apps);
  });

  // Seed initial data if empty
  const ideaCount = db.prepare("SELECT COUNT(*) as count FROM ideas").get() as { count: number };
  if (ideaCount.count === 0) {
    db.prepare("INSERT INTO ideas (id, title, description, category, status, votes, author) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run('1', 'Tinder for adoption dogs', 'Swipe right to find your new best friend.', 'Social', 'novel', 248, 'alex_dev');
    db.prepare("INSERT INTO ideas (id, title, description, category, status, votes, author) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run('2', 'App that screams when you slouch', 'Uses webcam to detect posture and alerts you.', 'Health', 'cocreate', 86, 'posture_king');
    
    db.prepare("INSERT INTO apps (id, title, description, url, author, icon) VALUES (?, ?, ?, ?, ?, ?)")
      .run('a1', 'PawsSwipe', 'Tinder for adoption dogs - swipe right to find your new best friend.', '#', 'dev_knight', 'Dog');
  }

  // Socket.io logic
  io.on("connection", (socket) => {
    socket.on("join-room", (ideaId) => {
      socket.join(ideaId);
    });

    socket.on("send-message", (data) => {
      const { ideaId, user, content } = data;
      db.prepare("INSERT INTO messages (idea_id, user, content) VALUES (?, ?, ?)")
        .run(ideaId, user, content);
      io.to(ideaId).emit("new-message", { user, content, created_at: new Date().toISOString() });
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
