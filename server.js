import express from "express";
import Database from "better-sqlite3";

const db = new Database("database.sqlite");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const KEYS = ["items", "loans", "loanItems"];

const app = express();
app.use(express.json({ limit: "5mb" }));

// Izinkan akses dari halaman di port 3000
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/state", (req, res) => {
  const state = {};
  for (const key of KEYS) {
    const row = db.prepare("SELECT value FROM store WHERE key = ?").get(key);
    state[key] = row ? JSON.parse(row.value) : [];
  }
  res.json(state);
});

app.put("/api/state/:key", (req, res) => {
  const { key } = req.params;
  if (!KEYS.includes(key)) return res.status(400).json({ error: "Key tidak dikenal" });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "Body harus array" });

  db.prepare(
    "INSERT INTO store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.listen(3001, "0.0.0.0", () => console.log("API jalan di port 3001"));