/**
 * Appwrite Function: discord-alert
 * 
 * Sends a Discord embed notification when abnormal database read
 * activity is detected from the frontend.
 * 
 * Environment variables required (set in Appwrite Console):
 *   DISCORD_WEBHOOK_URL — your Discord webhook URL
 */
export default async ({ req, res, log, error }) => {
  // 1. Grab the Webhook URL from Appwrite environment variables or hardcode it
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1486857618562613391/WWDgshhemqSwTuLL-8Vx1IjiSlzo5sifXaZRy_R8_k90IwxmIB5zfP5c7b3Ab8BCJSRN";

  if (!discordWebhookUrl) {
    error("Discord Webhook URL is missing.");
    return res.json({ success: false, message: "Missing Config" }, 500);
  }

  // 2. Parse the alert details sent from your frontend
  let payload = {};
  try {
    payload = req.bodyRaw ? JSON.parse(req.bodyRaw) : {};
  } catch (err) {
    log("No JSON body provided, using default alert.");
  }

  const alertMessage = payload.message || "⚠️ Abnormal Database Read Activity Detected!";
  const userContext  = payload.userId  || "Unknown User";
  const routeContext = payload.route   || "Unknown Route";
  const missCount    = payload.missCount || "?";

  // 3. Build the Discord Embed Message
  const params = {
    username: "NCET Buddy Alert Bot",
    avatar_url: "https://appwrite.io/images/logos/appwrite.png",
    embeds: [
      {
        title: "🚨 High DB Read Usage Warning",
        color: 16711680, // Bright Red
        description: alertMessage,
        fields: [
          { name: "👤 User", value: String(userContext), inline: true },
          { name: "📍 Route", value: String(routeContext), inline: true },
          { name: "💥 Cache Misses (60s window)", value: String(missCount), inline: true },
        ],
        footer: { text: "NCET Buddy · Appwrite Monitor" },
        timestamp: new Date().toISOString(),
      }
    ]
  };

  // 4. Send the alert to Discord
  try {
    const response = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      log("Alert successfully sent to Discord.");
      return res.json({ success: true, message: "Alert dispatched." });
    } else {
      const body = await response.text();
      error(`Discord rejected the payload: ${response.status} — ${body}`);
      return res.json({ success: false }, 500);
    }
  } catch (err) {
    error(`Fetch failed: ${err.message}`);
    return res.json({ success: false }, 500);
  }
};
