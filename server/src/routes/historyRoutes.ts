import { Router, type Request, type Response } from 'express';
import { supabase } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// All routes require auth
router.use(requireAuth);

// ── GET /user/history ──────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data: history, error } = await supabase
      .from('history')
      .select('id, refnr, title, employer, viewed_at')
      .eq('user_id', req.user!.userId)
      .order('viewed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch history db error:', error);
      res.status(500).json({ error: 'Verlauf konnte nicht geladen werden.' });
      return;
    }

    res.json(history || []);
  } catch (err) {
    console.error('Fetch history error:', err);
    res.status(500).json({ error: 'Verlauf konnte nicht geladen werden.' });
  }
});

// ── POST /user/history ─────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { refnr, title, employer } = req.body as {
    refnr?: string;
    title?: string;
    employer?: string;
  };

  if (!refnr) {
    res.status(400).json({ error: 'refnr ist erforderlich.' });
    return;
  }

  try {
    // Remove previous view of the same job (to move it to top)
    await supabase
      .from('history')
      .delete()
      .eq('user_id', req.user!.userId)
      .eq('refnr', refnr);

    // Insert as most recent
    const { error: insertError } = await supabase
      .from('history')
      .insert([{
        user_id: req.user!.userId,
        refnr,
        title: title || '',
        employer: employer || ''
      }]);

    if (insertError) {
      console.error('Save history insert error:', insertError);
      res.status(500).json({ error: 'Fehler beim Speichern des Verlaufs.' });
      return;
    }

    // Keep only last 100 entries per user
    // In PostgreSQL, you could use a trigger or a subquery. 
    // Here we find the 100th most recent id to use as a cutoff, or just delete older ones.
    const { data: keepData } = await supabase
      .from('history')
      .select('id')
      .eq('user_id', req.user!.userId)
      .order('viewed_at', { ascending: false })
      .limit(100);

    if (keepData && keepData.length === 100) {
      const keepIds = keepData.map(r => r.id);
      await supabase
        .from('history')
        .delete()
        .eq('user_id', req.user!.userId)
        .not('id', 'in', `(${keepIds.join(',')})`);
    }

    res.status(201).json({ message: 'Verlauf gespeichert.' });
  } catch (err) {
    console.error('Save history err:', err);
    res.status(500).json({ error: 'Fehler beim Speichern.' });
  }
});

// ── DELETE /user/history ───────────────────────────────
router.delete('/', async (req: Request, res: Response) => {
  try {
    await supabase.from('history').delete().eq('user_id', req.user!.userId);
    res.json({ message: 'Verlauf gelöscht.' });
  } catch (err) {
    console.error('Delete history err:', err);
    res.status(500).json({ error: 'Fehler beim Löschen des Verlaufs.' });
  }
});

// ── GET /user/searches ─────────────────────────────────
router.get('/searches', async (req: Request, res: Response) => {
  try {
    const { data: searches, error } = await supabase
      .from('searches')
      .select('id, query_was, query_wo, filters_json, searched_at')
      .eq('user_id', req.user!.userId)
      .order('searched_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Fetch searches db error:', error);
      res.status(500).json({ error: 'Suchverlauf konnte nicht geladen werden.' });
      return;
    }

    res.json(searches || []);
  } catch (err) {
    console.error('Fetch searches err:', err);
    res.status(500).json({ error: 'Suchverlauf konnte nicht geladen werden.' });
  }
});

// ── POST /user/searches ────────────────────────────────
router.post('/searches', async (req: Request, res: Response) => {
  const { queryWas, queryWo, filters } = req.body as {
    queryWas?: string;
    queryWo?: string;
    filters?: Record<string, unknown>;
  };

  try {
    const { error } = await supabase
      .from('searches')
      .insert([{
        user_id: req.user!.userId,
        query_was: queryWas || '',
        query_wo: queryWo || '',
        filters_json: JSON.stringify(filters || {})
      }]);

    if (error) {
      console.error('Save search db error:', error);
      res.status(500).json({ error: 'Fehler beim Speichern der Suche.' });
      return;
    }

    res.status(201).json({ message: 'Suche gespeichert.' });
  } catch (err) {
    console.error('Save search err:', err);
    res.status(500).json({ error: 'Fehler beim Speichern.' });
  }
});

export default router;
