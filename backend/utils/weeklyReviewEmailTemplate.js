/**
 * Weekly review email template.
 *
 * Deliberately plain inline-styled HTML (no external CSS, no images) —
 * this is a transactional-style email read mostly in Gmail/Outlook web
 * clients that strip <style> blocks and often block remote images by
 * default. A plain-text fallback is included since some clients or
 * privacy settings prefer it.
 */

const BRAND_BG = "#0a0a0a";
const BRAND_ACCENT = "#22c55e";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @param {Object} data
 * @param {string} data.displayName
 * @param {number} data.weekSolvedCount
 * @param {number} data.currentStreak
 * @param {number} data.totalXP
 * @param {string[]} data.topicsThisWeek
 * @param {{ headline: string, review: string, recommendation: string }} data.ai
 * @param {string} data.dashboardUrl
 */
export function buildWeeklyReviewEmail({
  displayName,
  weekSolvedCount,
  currentStreak,
  totalXP,
  topicsThisWeek,
  ai,
  dashboardUrl,
}) {
  const name = escapeHtml(displayName || "there");
  const topicsLine = topicsThisWeek.length
    ? escapeHtml(topicsThisWeek.join(", "))
    : "no new topics this week";

  const subject =
    weekSolvedCount > 0
      ? `Your week in review: ${weekSolvedCount} problem${weekSolvedCount === 1 ? "" : "s"} solved 🎯`
      : `Your weekly Code Club review`;

  const html = `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="background-color:${BRAND_BG}; padding: 24px 32px;">
                <span style="color:${BRAND_ACCENT}; font-size: 20px; font-weight: 700;">Code Club</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h1 style="margin: 0 0 8px; font-size: 20px; color: #111827;">Hey ${name} 👋</h1>
                <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.5;">
                  ${escapeHtml(ai.headline)}
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 12px; background-color: #f9fafb; border-radius: 8px; text-align: center;" width="33%">
                      <div style="font-size: 22px; font-weight: 700; color: ${BRAND_ACCENT};">${weekSolvedCount}</div>
                      <div style="font-size: 12px; color: #6b7280;">solved this week</div>
                    </td>
                    <td width="8"></td>
                    <td style="padding: 12px; background-color: #f9fafb; border-radius: 8px; text-align: center;" width="33%">
                      <div style="font-size: 22px; font-weight: 700; color: ${BRAND_ACCENT};">${currentStreak}</div>
                      <div style="font-size: 12px; color: #6b7280;">day streak</div>
                    </td>
                    <td width="8"></td>
                    <td style="padding: 12px; background-color: #f9fafb; border-radius: 8px; text-align: center;" width="33%">
                      <div style="font-size: 22px; font-weight: 700; color: ${BRAND_ACCENT};">${totalXP}</div>
                      <div style="font-size: 12px; color: #6b7280;">total XP</div>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
                  Topics this week: ${topicsLine}
                </p>

                <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.5;">
                  ${escapeHtml(ai.review)}
                </p>

                <div style="padding: 16px; background-color: #f0fdf4; border-left: 3px solid ${BRAND_ACCENT}; border-radius: 6px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #166534;">
                    <strong>Next step:</strong> ${escapeHtml(ai.recommendation)}
                  </p>
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:${BRAND_ACCENT}; border-radius: 8px;">
                      <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; color:#0a0a0a; font-size: 14px; font-weight: 600; text-decoration: none;">
                        Open Dashboard
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  You're getting this because weekly reviews are on for your account.
                  Turn them off any time in Profile → Settings.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    `Hey ${displayName || "there"},`,
    "",
    ai.headline,
    "",
    `This week: ${weekSolvedCount} solved, ${currentStreak}-day streak, ${totalXP} total XP.`,
    `Topics: ${topicsThisWeek.length ? topicsThisWeek.join(", ") : "no new topics this week"}`,
    "",
    ai.review,
    "",
    `Next step: ${ai.recommendation}`,
    "",
    dashboardUrl,
    "",
    "— Code Club",
    "(Turn off weekly reviews any time in Profile → Settings.)",
  ].join("\n");

  return { subject, html, text };
}