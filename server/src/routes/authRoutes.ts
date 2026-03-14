import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../db.js";
import { generateToken } from "../auth.js";
import { OAuth2Client } from "google-auth-library";
import {
  sendOtp,
  verifyOtp as verifyOtpService,
  isOtpVerified,
  clearOtp,
} from "../otpService.js";
import { requireAuth } from "../auth.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── POST /auth/google ──────────────────────────────────
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Fehlende Google-Anmeldedaten" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Ungültiger Google-Token" });
      return;
    }

    const email = payload.email.toLowerCase();
    const displayName = payload.name || email.split("@")[0];

    // Check if user exists in Supabase
    let { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, email, display_name, location, birthday, bereich, jobart, theme, created_at",
      )
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("Database error checking user:", userError);
      res.status(500).json({ error: "Datenbankfehler." });
      return;
    }

    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            email,
            password_hash: null,
            display_name: displayName,
            theme: "dark",
          },
        ])
        .select("*")
        .single();

      if (insertError || !newUser) {
        console.error("Database error creating Google user:", insertError);
        res
          .status(500)
          .json({ error: "Konto konnte nicht erstellt werden." });
        return;
      }
      user = newUser;
    }

    const token = generateToken({ userId: user!.id, email: user!.email });

    res.json({
      token,
      isNewUser: !user.location && !user.bereich && !user.jobart,
      user: {
        id: user!.id,
        email: user!.email,
        displayName: user!.display_name,
        location: user!.location,
        birthday: user!.birthday,
        bereich: user!.bereich,
        jobart: user!.jobart,
        theme: user!.theme,
        createdAt: user!.created_at,
      },
    });
  } catch (err: any) {
    console.error("Google Auth Error:", err);
    res
      .status(500)
      .json({ error: "Google Anmeldung fehlgeschlagen." });
  }
});

// ── POST /auth/register ────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      displayName,
      birthday,
      location,
      bereich,
      jobart,
      theme,
    } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
      birthday?: string;
      location?: string;
      bereich?: string;
      jobart?: string;
      theme?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "E-Mail und Passwort sind erforderlich." });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ error: "Das Passwort muss mindestens 6 Zeichen lang sein." });
      return;
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      res
        .status(409)
        .json({ error: "Ein Konto mit dieser E-Mail existiert bereits." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const payload = {
      email,
      password_hash: passwordHash,
      display_name: displayName || email.split("@")[0],
      birthday: birthday || null,
      location: location || null,
      bereich: bereich || null,
      jobart: jobart || null,
      theme: theme || "dark",
    };

    console.log(
      "[Register] Attempting insert with payload keys:",
      Object.keys(payload),
    );

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([payload])
      .select("*")
      .single();

    if (insertError || !newUser) {
      console.error("[Register] Supabase error:", insertError);
      res.status(500).json({ error: "Registrierung fehlgeschlagen." });
      return;
    }

    const userId = newUser.id;
    const token = generateToken({ userId, email });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: newUser.email,
        displayName: newUser.display_name,
        location: newUser.location,
        birthday: newUser.birthday,
        bereich: newUser.bereich,
        jobart: newUser.jobart,
        theme: newUser.theme,
        createdAt: newUser.created_at,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registrierung fehlgeschlagen." });
  }
});

// ── POST /auth/login ───────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "E-Mail und Passwort sind erforderlich." });
      return;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, email, password_hash, display_name, location, birthday, bereich, jobart, theme, created_at",
      )
      .eq("email", email)
      .maybeSingle();

    if (userError || !user) {
      res.status(401).json({ error: "E-Mail oder Passwort falsch." });
      return;
    }

    if (!user.password_hash) {
      res.status(401).json({
        error:
          "Dieses Konto ist mit Google verknüpft. Bitte melde dich über Google an.",
      });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      res.status(401).json({ error: "E-Mail oder Passwort falsch." });
      return;
    }

    const token = generateToken({ userId: user!.id, email: user!.email });

    res.json({
      token,
      user: {
        id: user!.id,
        email: user!.email,
        displayName: user!.display_name,
        location: user!.location,
        birthday: user!.birthday,
        bereich: user!.bereich,
        jobart: user!.jobart,
        theme: user!.theme,
        createdAt: user!.created_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Anmeldung fehlgeschlagen." });
  }
});

// ── GET /auth/me ───────────────────────────────────────
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, display_name, location, birthday, bereich, jobart, theme, created_at",
      )
      .eq("id", req.user!.userId)
      .maybeSingle();

    if (error || !user) {
      res.status(404).json({ error: "Benutzer nicht gefunden." });
      return;
    }

    res.json({
      user: {
        id: user!.id,
        email: user!.email,
        displayName: user!.display_name,
        location: user!.location,
        birthday: user!.birthday,
        bereich: user!.bereich,
        jobart: user!.jobart,
        theme: user!.theme,
        createdAt: user!.created_at,
      },
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Benutzer konnte nicht geladen werden." });
  }
});

// ── POST /auth/send-otp ─────────────────────────────────
router.post("/send-otp", async (req: Request, res: Response) => {
  try {
    const { email, purpose } = req.body as {
      email?: string;
      purpose?: "register" | "reset";
    };

    if (!email || !purpose) {
      res.status(400).json({ error: "E-Mail und Zweck sind erforderlich." });
      return;
    }

    if (!["register", "reset"].includes(purpose)) {
      res.status(400).json({ error: "Ungültiger Zweck." });
      return;
    }

    // For reset: check that user exists
    if (purpose === "reset") {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (!existing) {
        res
          .status(404)
          .json({ error: "Kein Konto mit dieser E-Mail gefunden." });
        return;
      }
    }

    // For register: check that email is NOT already taken
    if (purpose === "register") {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existing) {
        res
          .status(409)
          .json({ error: "Ein Konto mit dieser E-Mail existiert bereits." });
        return;
      }
    }

    const result = await sendOtp(email, purpose);
    if (!result.success) {
      res
        .status(500)
        .json({ error: result.error || "OTP konnte nicht gesendet werden." });
      return;
    }

    res.json({ message: "Bestätigungscode gesendet." });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ error: "Serverfehler." });
  }
});

// ── POST /auth/verify-otp ───────────────────────────────
router.post("/verify-otp", (req: Request, res: Response) => {
  const { email, code, purpose } = req.body as {
    email?: string;
    code?: string;
    purpose?: "register" | "reset";
  };

  if (!email || !code || !purpose) {
    res
      .status(400)
      .json({ error: "E-Mail, Code und Zweck sind erforderlich." });
    return;
  }

  const result = verifyOtpService(email, code, purpose);

  if (!result.valid) {
    res.status(400).json({ error: result.error || "Ungültiger Code." });
    return;
  }

  res.json({ message: "Code bestätigt.", verified: true });
});

// ── POST /auth/reset-password ───────────────────────────
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body as {
      email?: string;
      newPassword?: string;
    };

    if (!email || !newPassword) {
      res
        .status(400)
        .json({ error: "E-Mail und neues Passwort sind erforderlich." });
      return;
    }

    if (newPassword.length < 6) {
      res
        .status(400)
        .json({ error: "Das Passwort muss mindestens 6 Zeichen lang sein." });
      return;
    }

    // Verify that the OTP was previously verified for this email
    if (!isOtpVerified(email, "reset")) {
      res
        .status(403)
        .json({ error: "Bitte bestätige zuerst deinen E-Mail-Code." });
      return;
    }

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (fetchError || !user) {
      res.status(404).json({ error: "Benutzer nicht gefunden." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", user!.id);

    if (updateError) {
      console.error("Update password db error:", updateError);
      res
        .status(500)
        .json({ error: "Passwort konnte nicht zurückgesetzt werden." });
      return;
    }

    // Clear the used OTP
    clearOtp(email, "reset");

    res.json({ message: "Passwort erfolgreich geändert." });
  } catch (err) {
    console.error("reset-password error:", err);
    res.status(500).json({ error: "Serverfehler." });
  }
});

// ── PATCH /auth/update-profile ──────────────────────────
router.patch(
  "/update-profile",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { displayName, birthday, bereich, location, jobart } = req.body;
      const updates: any = {};
      if (displayName !== undefined) updates.display_name = displayName;
      if (birthday !== undefined) updates.birthday = birthday;
      if (bereich !== undefined) updates.bereich = bereich;
      if (location !== undefined) updates.location = location;
      if (jobart !== undefined) updates.jobart = jobart;

      const { data: user, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", req.user!.userId)
        .select("*")
        .single();

      if (error) {
        console.error("Update profile error:", error);
        res
          .status(500)
          .json({ error: "Fehler beim Aktualisieren des Profils." });
        return;
      }

      res.json({
        message: "Profil aktualisiert.",
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          location: user.location,
          birthday: user.birthday,
          bereich: user.bereich,
          jobart: user.jobart,
          theme: user.theme,
          createdAt: user.created_at,
        },
      });
    } catch (err) {
      console.error("Patch update-profile error:", err);
      res.status(500).json({ error: "Serverfehler." });
    }
  },
);

export default router;
