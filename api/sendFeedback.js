export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  const { feedback } = req.body;

  // Función para formatear el mensaje sin caracteres y etiquetas no soportadas
  const mensaje = `
🚀 <b>Nuevo Feedback Recibido</b> 🚀
📝 <i>${feedback}</i>

<pre>------------------------------------</pre>

📅 <b>Fecha:</b> ${new Date().toLocaleString()}
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
      const errorResponse = await response.text();
      console.error("Error en la respuesta de Telegram:", errorResponse);
      res.status(500).json({ error: `Error al enviar el feedback: ${errorResponse}` });
    }
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
}
