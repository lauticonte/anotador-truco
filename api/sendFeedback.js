// Recibe las sugerencias de la pantalla de resultado y las manda al chat de Telegram.
const MAX_LENGTH = 1000;

// Límite de envíos por IP: hasta 5 cada 10 minutos. Vive en la memoria de la función, así que es una
// primera barrera contra el spam (cada instancia lleva su propia cuenta), no un límite exacto.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const sendsByIp = new Map();

const isRateLimited = (ip) => {
  const now = Date.now();
  const recent = (sendsByIp.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    sendsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  sendsByIp.set(ip, recent);
  return false;
};

// El mensaje va con parse_mode HTML: el texto del usuario se escapa para que no pueda romperlo ni darle formato
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const feedback = typeof req.body?.feedback === "string" ? req.body.feedback.trim() : "";
  if (!feedback || feedback.length > MAX_LENGTH) {
    return res.status(400).json({ error: `La sugerencia tiene que tener entre 1 y ${MAX_LENGTH} caracteres` });
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "sin-ip";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Demasiados envíos, probá en unos minutos" });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  const dateInBuenosAires = new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour12: false, // Usa formato de 24 horas
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Función para formatear el mensaje sin caracteres y etiquetas no soportadas
  const mensaje = `
🚀 <b>Nuevo Feedback Recibido</b> 🚀
📝 <i>${escapeHtml(feedback)}</i>

-------------------------------------

📅 <b>${dateInBuenosAires}</b>
  `;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: mensaje.trim(), // Se asegura de que no haya espacios innecesarios
          parse_mode: "HTML",
        }),
      }
    );

    if (response.ok) {
      res.status(200).json({ message: "Feedback enviado correctamente" });
    } else {
      // El detalle queda en los logs de Vercel; al navegador no se le muestra la respuesta de Telegram
      console.error("Error en la respuesta de Telegram:", await response.text());
      res.status(500).json({ error: "Error al enviar el feedback" });
    }
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
}
