/**
 * emailTemplates.ts
 *
 * Generates the HTML email body for daily notification emails.
 * Matches the dark-theme branding of the AusbildungSuche app.
 */

interface DailyEmailData {
  displayName: string;
  offerCount: number;
  bereich: string;
  location: string;
  deepLinkUrl: string;
  appBaseUrl: string;
}

export function buildDailyEmailHtml(data: DailyEmailData): string {
  const { displayName, offerCount, bereich, appBaseUrl, deepLinkUrl } = data;

  const headline = `neue Ausbildungsangebote`;
  const firstName = displayName?.split(" ")[0] || "Hallo";

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Ausbildungsangebote — AusbildungSuche</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a1a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background: linear-gradient(135deg, rgba(30, 30, 60, 0.95), rgba(20, 20, 40, 0.98)); border-radius: 20px; border: 1px solid rgba(124, 92, 252, 0.2); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 28px 24px 28px; text-align: center;">
              <img src="${appBaseUrl}/ausbildungLogo.png" alt="Logo" width="48" height="48" style="border-radius: 10px; display: block; margin: 0 auto 16px auto;" />
              <div style="font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #7c5cfc, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: inline-block;">
                AusbildungSuche
              </div>
              <div style="margin-top: 8px; font-size: 11px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
                Tägliche Benachrichtigung
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 28px;">
              <p style="color: #d1d5db; font-size: 15px; margin: 0; text-align: center;">
                Hallo ${firstName} 👋
              </p>
            </td>
          </tr>

          <!-- Offer Count Badge & Info -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="background: linear-gradient(135deg, rgba(124, 92, 252, 0.15), rgba(167, 139, 250, 0.1)); border: 1px solid rgba(124, 92, 252, 0.3); border-radius: 20px; padding: 36px 24px; text-align: center;">
                <div style="font-size: 56px; font-weight: 800; color: #a78bfa; line-height: 1; margin-bottom: 12px;">
                  ${offerCount}
                </div>
                <div style="color: #e5e7eb; font-size: 16px; font-weight: 500; line-height: 1.5;">
                  neue Ausbildungsangebote<br>
                  im Bereich <span style="color: #a78bfa; font-weight: 700;">${bereich}</span>
                </div>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 28px 28px 28px;">
              <a href="${deepLinkUrl}" target="_blank" style="display: block; text-align: center; background: linear-gradient(135deg, #7c5cfc, #6d28d9); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 24px; border-radius: 14px; letter-spacing: 0.3px;">
                Jetzt ansehen →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 28px;">
              <div style="height: 1px; background: rgba(255, 255, 255, 0.06);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px 28px 28px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5;">
                Du erhältst diese E-Mail, weil du tägliche Benachrichtigungen aktiviert hast.<br>
                Du kannst dies in deinen Profileinstellungen ändern.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildDailyEmailSubject(
  offerCount: number,
  location?: string,
): string {
  const locationText = location ? ` in ${location}` : "";
  return `${offerCount} neue Ausbildungsangebote${locationText} — AusbildungSuche`;
}
