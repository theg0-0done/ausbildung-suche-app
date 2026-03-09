import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: true, // Allow dynamic origin (e.g. mobile IP on WiFi)
  credentials: true,
}));
app.use(express.json());

// ── API Routes ─────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/user/favorites', favoritesRoutes);
app.use('/user/history', historyRoutes);

// ── API Proxy for Arbeitsagentur (for Capacitor mobile apps) ──
app.use('/proxy/api', async (req, res) => {
  const targetUrl = `https://rest.arbeitsagentur.de${req.url}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'X-API-Key': 'jobboerse-jobsuche',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    res.status(response.status).set('Content-Type', response.headers.get('content-type') || 'application/json').send(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Proxy request failed' });
  }
});

// ── Health check ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
