import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const KEYS = ['items', 'loans', 'loanItems'];
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

await pool.query(`
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '[]'::jsonb
  )
`);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/state', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, data FROM app_state');
    const state = { items: [], loans: [], loanItems: [] };
    for (const r of rows) if (KEYS.includes(r.key)) state[r.key] = r.data;
    res.json(state);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal membaca data' });
  }
});

app.put('/api/state/:key', async (req, res) => {
  const { key } = req.params;
  if (!KEYS.includes(key)) return res.status(400).json({ error: 'Key tidak valid' });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body harus array' });
  try {
    await pool.query(
      `INSERT INTO app_state (key, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`,
      [key, JSON.stringify(req.body)]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal menyimpan data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`API jalan di port ${PORT}`));