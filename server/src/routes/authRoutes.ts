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
      res.status(400).json({ error: "Missing Google credential" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token" });
      return;
    }

    const email = payload.email.toLowerCase();
    const displayName = payload.name || email.split("@")[0];

    // Check if user exists in Supabase
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, display_name")
      .eq("email", email)
      .single();

    if (userError && userError.code !== "PGRST116") {
      // PGRST116 means no rows found
      console.error("Database error checking user:", userError);
      res.status(500).json({ error: "DB-Error: " + userError.message });
      return;
    }

    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ email, password_hash: null, display_name: displayName }])
        .select("id, email, display_name")
        .single();

      if (insertError || !newUser) {
        console.error("Database error creating Google user:", insertError);
        res
          .status(500)
          .json({ error: "DB Insert Error: " + insertError?.message });
        return;
      }
      user = newUser;
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    });
  } catch (err: any) {
    console.error("Google Auth Error:", err);
    res
      .status(500)
      .json({ error: "Google Auth Error: " + (err.message || String(err)) });
  }
});

// ── POST /auth/register ────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
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
      .single();

    if (existing) {
      res
        .status(409)
        .json({ error: "Ein Konto mit dieser E-Mail existiert bereits." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash: passwordHash,
          display_name: displayName || email.split("@")[0],
        },
      ])
      .select("id, email, display_name")
      .single();

    if (insertError || !newUser) {
      console.error("Register db error:", insertError);
      res.status(500).json({ error: "Registrierung fehlgeschlagen." });
      return;
    }

    const userId = newUser.id;
    const token = generateToken({ userId, email });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        displayName: newUser.display_name,
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
      .select("id, email, password_hash, display_name")
      .eq("email", email)
      .single();

    if (userError || !user) {
      res.status(401).json({ error: "E-Mail oder Passwort falsch." });
      return;
    }

    if (!user.password_hash || user.password_hash === "oauth-google") {
      res
        .status(401)
        .json({
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

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
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
        "id, email, display_name, preferred_location, preferred_category, created_at",
      )
      .eq("id", req.user!.userId)
      .single();

    if (error || !user) {
      res.status(404).json({ error: "Benutzer nicht gefunden." });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        preferredLocation: user.preferred_location,
        preferredCategory: user.preferred_category, // Wait, might need underscore conversion if properties differ
        createdAt: user.created_at,
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
        .single();
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
        .single();
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
      .single();

    if (fetchError || !user) {
      res.status(404).json({ error: "Benutzer nicht gefunden." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", user.id);

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

export default router;
