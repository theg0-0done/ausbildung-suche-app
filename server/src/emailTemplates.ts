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
}

export function buildDailyEmailHtml(data: DailyEmailData): string {
  const { displayName, offerCount, bereich, location, deepLinkUrl } = data;

  const locationText = location ? ` in ${location}` : "";
  const headline = `${offerCount} neue Ausbildungsangebote${locationText}`;
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
            <td style="padding: 32px 28px 16px 28px; text-align: center;">
              <div style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #7c5cfc, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                AusbildungSuche
              </div>
              <div style="margin-top: 4px; font-size: 12px; color: #6b7280; letter-spacing: 1px; text-transform: uppercase;">
                Tägliche Benachrichtigung
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 8px 28px 0 28px;">
              <p style="color: #d1d5db; font-size: 15px; margin: 0;">
                Hallo ${firstName} 👋
              </p>
            </td>
          </tr>

          <!-- Offer Count Badge -->
          <tr>
            <td style="padding: 20px 28px;">
              <div style="background: linear-gradient(135deg, rgba(124, 92, 252, 0.15), rgba(167, 139, 250, 0.1)); border: 1px solid rgba(124, 92, 252, 0.3); border-radius: 16px; padding: 24px; text-align: center;">
                <div style="font-size: 42px; font-weight: 800; color: #a78bfa; line-height: 1;">
                  ${offerCount}
                </div>
                <div style="margin-top: 8px; color: #e5e7eb; font-size: 15px; font-weight: 500;">
                  ${headline}
                </div>
              </div>
            </td>
          </tr>

          <!-- Branch Info -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 14px 18px;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 10px; vertical-align: middle;">
                          <div style="width: 8px; height: 8px; border-radius: 50%; background: #7c5cfc;"></div>
                        </td>
                        <td>
                          <span style="color: #9ca3af; font-size: 12px;">Bereich</span><br>
                          <span style="color: #e5e7eb; font-size: 14px; font-weight: 600;">${bereich}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
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
