import { Router, type Request, type Response } from "express";
import { supabase } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// All routes require auth
router.use(requireAuth);

// ── GET /user/profile ──────────────────────────────────
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, display_name, location, birthday, bereich, jobart, theme, email_notifications, created_at",
      )
      .eq("id", req.user!.userId)
      .maybeSingle();

    if (error || !user) {
      res.status(404).json({ error: "Benutzer nicht gefunden." });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      location: user.location,
      birthday: user.birthday,
      bereich: user.bereich,
      jobart: user.jobart,
      theme: user.theme,
      emailNotifications: user.email_notifications ?? true,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res
      .status(500)
      .json({ error: "Benutzerprofil konnte nicht geladen werden." });
  }
});

// ── PUT /user/profile ──────────────────────────────────
router.put("/profile", async (req: Request, res: Response) => {
  const {
    displayName,
    location,
    birthday,
    bereich,
    jobart,
    email,
    theme,
    emailNotifications,
  } = req.body as {
    displayName?: string;
    location?: string;
    birthday?: string;
    bereich?: string;
    jobart?: string;
    email?: string;
    theme?: string;
    emailNotifications?: boolean;
  };

  try {
    const updates: Record<string, any> = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (location !== undefined) updates.location = location;
    if (birthday !== undefined) updates.birthday = birthday;
    if (bereich !== undefined) updates.bereich = bereich;
    if (jobart !== undefined) updates.jobart = jobart;
    if (theme !== undefined) updates.theme = theme;
    if (email !== undefined) updates.email = email;
    if (emailNotifications !== undefined)
      updates.email_notifications = emailNotifications;

    if (Object.keys(updates).length === 0) {
      res.json({ message: "Keine Änderungen vorgenommen." });
      return;
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.user!.userId);

    if (error) {
      if (error.code === "23505") {
        res.status(400).json({ error: "E-Mail Adresse ist bereits vergeben." });
        return;
      }
      console.error("Update profile db error:", error);
      res
        .status(500)
        .json({ error: "Serverfehler beim Speichern des Profils." });
      return;
    }

    res.json({ message: "Profil aktualisiert." });
  } catch (error: any) {
    console.error("Update profile generic error:", error);
    res.status(500).json({ error: "Serverfehler beim Speichern des Profils." });
  }
});

export default router;
