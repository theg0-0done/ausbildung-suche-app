import { Router, type Request, type Response } from 'express';
import { supabase } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// ── GET /user/favorites ────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('id, refnr, title, employer, location, saved_at')
      .eq('user_id', req.user!.userId)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Fetch favorites error:', error);
      res.status(500).json({ error: 'Favoriten konnten nicht geladen werden.' });
      return;
    }

    res.json(favorites || []);
  } catch (err) {
    console.error('Fetch favorites error:', err);
    res.status(500).json({ error: 'Favoriten konnten nicht geladen werden.' });
  }
});

// ── POST /user/favorites ───────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { refnr, title, employer, location } = req.body as {
    refnr?: string;
    title?: string;
    employer?: string;
    location?: string;
  };

  if (!refnr) {
    res.status(400).json({ error: 'refnr ist erforderlich.' });
    return;
  }

  try {
    // Check if it exists first
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', req.user!.userId)
      .eq('refnr', refnr)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('favorites')
        .insert([{
          user_id: req.user!.userId,
          refnr,
          title: title || '',
          employer: employer || '',
          location: location || ''
        }]);

      if (error) {
        console.error('Save favorite db error:', error);
        res.status(500).json({ error: 'Fehler beim Speichern.' });
        return;
      }
    }

    res.status(201).json({ message: 'Favorit gespeichert.' });
  } catch (err) {
    console.error('Save favorite error:', err);
    res.status(500).json({ error: 'Fehler beim Speichern.' });
  }
});

// ── DELETE /user/favorites/:refnr ──────────────────────
router.delete('/:refnr', async (req: Request, res: Response) => {
  const { refnr } = req.params;

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', req.user!.userId)
      .eq('refnr', refnr);

    if (error) {
      console.error('Delete favorite error:', error);
      res.status(500).json({ error: 'Fehler beim Löschen.' });
      return;
    }

    res.json({ message: 'Favorit entfernt.' });
  } catch (err) {
    console.error('Delete favorite error:', err);
    res.status(500).json({ error: 'Fehler beim Löschen.' });
  }
});

// ── GET /user/favorites/check/:refnr ───────────────────
router.get('/check/:refnr', async (req: Request, res: Response) => {
  const { refnr } = req.params;

  try {
    const { data: fav, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', req.user!.userId)
      .eq('refnr', refnr)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Check favorite error:', error);
      res.status(500).json({ error: 'Fehler beim Prüfen.' });
      return;
    }

    res.json({ isFavorite: !!fav });
  } catch (err) {
    console.error('Check favorite error:', err);
    res.status(500).json({ error: 'Fehler beim Prüfen.' });
  }
});

export default router;
