import { Resend } from "resend";

// Lazy-init Resend to guarantee dotenv has loaded the API key
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY || "";
    console.log(`[OTP] Initializing Resend client. API key present: ${!!apiKey}, starts with re_: ${apiKey.startsWith("re_")}`);
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ── In-memory OTP store ───────────────────────────────
interface OtpEntry {
  code: string;
  expiresAt: number;
  purpose: "register" | "reset";
  verified: boolean;
}

const otpStore = new Map<string, OtpEntry>();

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of otpStore) {
      if (now > entry.expiresAt) {
        otpStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Generate a 4-digit OTP code
 */
function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Build a composite key to separate register vs reset codes for same email
 */
function storeKey(email: string, purpose: string): string {
  return `${email.toLowerCase()}:${purpose}`;
}

/**
 * Send OTP email via Resend and store code in memory
 */
export async function sendOtp(
  email: string,
  purpose: "register" | "reset",
): Promise<{ success: boolean; error?: string }> {
  const code = generateCode();
  const key = storeKey(email, purpose);

  // Store with 10 minute expiry
  otpStore.set(key, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    purpose,
    verified: false,
  });

  const subjectMap = {
    register: "Dein Bestätigungscode für AusbildungSuche",
    reset: "Passwort zurücksetzen — AusbildungSuche",
  };

  const bodyMap = {
    register: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #111; color: #fff; border-radius: 16px;">
        <h2 style="text-align: center; margin-bottom: 8px;">AusbildungSuche</h2>
        <p style="text-align: center; color: #aaa; font-size: 14px;">Bestätige deine E-Mail-Adresse</p>
        <div style="text-align: center; font-size: 36px; letter-spacing: 12px; font-weight: 700; margin: 32px 0; color: #7c5cfc;">${code}</div>
        <p style="text-align: center; color: #aaa; font-size: 13px;">Dieser Code ist 10 Minuten gültig.</p>
      </div>
    `,
    reset: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #111; color: #fff; border-radius: 16px;">
        <h2 style="text-align: center; margin-bottom: 8px;">AusbildungSuche</h2>
        <p style="text-align: center; color: #aaa; font-size: 14px;">Setze dein Passwort zurück</p>
        <div style="text-align: center; font-size: 36px; letter-spacing: 12px; font-weight: 700; margin: 32px 0; color: #7c5cfc;">${code}</div>
        <p style="text-align: center; color: #aaa; font-size: 13px;">Dieser Code ist 10 Minuten gültig. Ignoriere diese E-Mail, wenn du kein Zurücksetzen angefordert hast.</p>
      </div>
    `,
  };

  try {
    const { data, error } = await getResend().emails.send({
      from: "AusbildungSuche <noreply@fatehsaid.com>",
      to: [email],
      subject: subjectMap[purpose],
      html: bodyMap[purpose],
    });

    if (error) {
      const errorMsg = `[Resend Error] ${new Date().toISOString()} - To: ${email} - Error: ${JSON.stringify(error)}\n`;
      console.error(errorMsg);
      try {
        const fs = await import("fs");
        fs.appendFileSync("email-debug.log", errorMsg);
      } catch (fsErr) {}
      return { success: false, error: "E-Mail konnte nicht gesendet werden." };
    }

    console.log(`OTP sent to ${email} for ${purpose}: ${code}`);
    return { success: true };
  } catch (err: any) {
    const excMsg = `[Resend Exception] ${new Date().toISOString()} - To: ${email} - Exception: ${err.message || String(err)}\n`;
    console.error(excMsg);
    try {
      const fs = await import("fs");
      fs.appendFileSync("email-debug.log", excMsg);
    } catch (fsErr) {}
    return { success: false, error: "E-Mail konnte nicht gesendet werden." };
  }
}

/**
 * Verify a submitted OTP code
 */
export function verifyOtp(
  email: string,
  code: string,
  purpose: "register" | "reset",
): { valid: boolean; error?: string } {
  const key = storeKey(email, purpose);
  const entry = otpStore.get(key);

  if (!entry) {
    return {
      valid: false,
      error: "Kein Code gefunden. Bitte fordere einen neuen an.",
    };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return {
      valid: false,
      error: "Code ist abgelaufen. Bitte fordere einen neuen an.",
    };
  }

  if (entry.code !== code) {
    return { valid: false, error: "Falscher Code. Bitte versuche es erneut." };
  }

  // Mark as verified (for reset-password flow to check later)
  entry.verified = true;
  otpStore.set(key, entry);

  return { valid: true };
}

/**
 * Check if an OTP was previously verified (used before allowing password reset)
 */
export function isOtpVerified(
  email: string,
  purpose: "register" | "reset",
): boolean {
  const key = storeKey(email, purpose);
  const entry = otpStore.get(key);
  return entry?.verified === true && Date.now() <= entry.expiresAt;
}

/**
 * Clear OTP entry after successful use
 */
export function clearOtp(email: string, purpose: "register" | "reset"): void {
  const key = storeKey(email, purpose);
  otpStore.delete(key);
}
