/**
 * dailyEmailJob.ts
 *
 * Core logic for the daily email notification system.
 *
 * Flow:
 * 1. Query Supabase for all users with email_notifications enabled
 * 2. For each user, search Arbeitsagentur API for new offers (last 24h)
 * 3. If offers > 0, send personalized email via Resend
 * 4. Log every attempt to the email_logs table
 */

import { Resend } from "resend";
import { supabase } from "./db.js";
import {
  buildDailyEmailHtml,
  buildDailyEmailSubject,
} from "./emailTemplates.js";
import { log } from "console";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";

// ── Types ──────────────────────────────────────────────

interface UserForEmail {
  id: number;
  email: string;
  display_name: string;
  bereich: string | null;
  location: string | null;
  jobart: string | null;
}

interface SearchApiResponse {
  maxErgebnisse?: number;
  stellenangebote?: unknown[];
}

// ── Helpers ────────────────────────────────────────────

/**
 * Maps user jobart to the Arbeitsagentur angebotsart parameter.
 * Default: 4 (Ausbildung)
 */
function mapJobartToAngebotsart(jobart: string | null): string {
  switch (jobart) {
    case "dual_study":
      return "34"; // Duales Studium
    case "praktikum":
      return "34"; // Praktikum
    case "ausbildung":
    default:
      return "4"; // Ausbildung
  }
}

/**
 * Search Arbeitsagentur API for offers matching user preferences.
 * Uses the same proxy endpoint the frontend uses.
 */
async function searchOffersForUser(
  user: UserForEmail,
): Promise<{ count: number }> {
  const params = new URLSearchParams({
    angebotsart: mapJobartToAngebotsart(user.jobart),
    veroeffentlichtseit: "1", // Last 24 hours
    size: "1", // We only need the count, not the full list
    page: "1",
  });

  if (user.bereich?.trim()) {
    params.set("was", user.bereich.trim());
  }

  const url = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs?${params}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": "jobboerse-jobsuche",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `[DailyEmail] API error for user ${user.id}: ${response.status}`,
      );
      return { count: 0 };
    }

    const data: SearchApiResponse = await response.json();
    return { count: data.maxErgebnisse || 0 };
  } catch (err) {
    console.error(`[DailyEmail] Fetch error for user ${user.id}:`, err);
    return { count: 0 };
  }
}

/**
 * Build the deep link URL for the email CTA button.
 * This opens the search page with pre-applied filters.
 */
function buildDeepLinkUrl(user: UserForEmail): string {
  const params = new URLSearchParams();

  if (user.bereich?.trim()) {
    params.set("was", user.bereich.trim());
  }
  params.set("veroeffentlichtseit", "1");

  return `${APP_BASE_URL}/home?${params.toString()}`;
}

/**
 * Log the result of an email attempt to the email_logs table.
 */
async function logEmailResult(
  userId: number,
  email: string,
  offerCount: number,
  filters: Record<string, string>,
  status: "sent" | "failed" | "skipped",
  errorMessage?: string,
): Promise<void> {
  try {
    await supabase.from("email_logs").insert({
      user_id: userId,
      email,
      offer_count: offerCount,
      filters,
      status,
      error_message: errorMessage || null,
    });
  } catch (err) {
    console.error(
      `[DailyEmail] Failed to log email result for user ${userId}:`,
      err,
    );
  }
}

// ── Main Job ───────────────────────────────────────────

/**
 * The main daily email job. Call this from the cron scheduler.
 * Returns a summary of what happened.
 */
export async function runDailyEmailJob(): Promise<{
  totalUsers: number;
  emailsSent: number;
  emailsSkipped: number;
  emailsFailed: number;
}> {
  const startTime = Date.now();
  console.log(`\n📧 [DailyEmail] Starting daily email job...`);

  const stats = {
    totalUsers: 0,
    emailsSent: 0,
    emailsSkipped: 0,
    emailsFailed: 0,
  };

  // Step 1: Query eligible users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, display_name, bereich, location, jobart")
    .eq("email_notifications", true)
    .not("bereich", "is", null);

  if (usersError) {
    console.error("[DailyEmail] Failed to fetch users:", usersError);
    return stats;
  }

  if (!users || users.length === 0) {
    console.log("[DailyEmail] No eligible users found. Job complete.");
    return stats;
  }

  stats.totalUsers = users.length;
  console.log(`[DailyEmail] Found ${users.length} eligible users.`);

  // Step 2: Process each user
  for (const user of users as UserForEmail[]) {
    try {
      // Search for matching offers
      const { count: offerCount } = await searchOffersForUser(user);

      const filters = {
        was: user.bereich || "",
        veroeffentlichtseit: "1",
      };

      // Skip if no offers
      if (offerCount === 0) {
        console.log(
          `[DailyEmail] User ${user.id} (${user.email}): 0 offers → skipped`,
        );
        stats.emailsSkipped++;
        await logEmailResult(user.id, user.email, 0, filters, "skipped");
        continue;
      }

      // Build and send email
      const deepLinkUrl = buildDeepLinkUrl(user);
      const html = buildDailyEmailHtml({
        displayName: user.display_name,
        offerCount,
        bereich: user.bereich || "Alle Bereiche",
        location: user.location || "",
        deepLinkUrl,
        appBaseUrl: APP_BASE_URL,
      });
      const subject = buildDailyEmailSubject(
        offerCount,
        user.location || undefined,
      );

      const { error: sendError } = await resend.emails.send({
        from: (process.env.RESEND_FROM_EMAIL as string) || "onboarding@resend.dev",
        to: [user.email],
        subject,
        html,
      });

      if (sendError) {
        console.error(
          `[DailyEmail] User ${user.id} (${user.email}): send failed →`,
          sendError,
        );
        stats.emailsFailed++;
        await logEmailResult(
          user.id,
          user.email,
          offerCount,
          filters,
          "failed",
          JSON.stringify(sendError),
        );
      } else {
        console.log(
          `[DailyEmail] User ${user.id} (${user.email}): ${offerCount} offers → email sent ✓`,
        );
        stats.emailsSent++;
        await logEmailResult(user.id, user.email, offerCount, filters, "sent");
      }

      // Small delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      console.error(`[DailyEmail] Unexpected error for user ${user.id}:`, err);
      stats.emailsFailed++;
      await logEmailResult(
        user.id,
        user.email,
        0,
        {},
        "failed",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n📧 [DailyEmail] Job complete in ${elapsed}s — ` +
      `Sent: ${stats.emailsSent}, Skipped: ${stats.emailsSkipped}, Failed: ${stats.emailsFailed}`,
  );

  console.log(process.env.RESEND_FROM_EMAIL)

  return stats;
}
