export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  const { feedback } = req.body;

  // Función para formatear la fecha y hora en el formato deseado
  function getDate() {
    const opciones = {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    return new Intl.DateTimeFormat("es-AR", opciones).format(new Date());
  }

  // Función para formatear el mensaje sin caracteres y etiquetas no soportadas
  const mensaje = `
🚀 <b>Nuevo Feedback Recibido</b> 🚀

📝 <i>${feedback}</i>

<pre>------------------------------------</pre>

📅 <b>Fecha:</b> ${getDate()}
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
      res
        .status(500)
        .json({ error: `Error al enviar el feedback: ${errorResponse}` });
    }
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    res.status(500).json({ error: "Error en la solicitud" });
  }
}
