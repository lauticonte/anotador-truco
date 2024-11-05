export default async function handler(req, res) {
  console.log('Request recibida:', req.body);

  if (req.method !== 'POST') {
    console.error('Método no permitido');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.CHAT_ID,
        text: `Nuevo feedback recibido:\n${req.body.feedback}`,
      }),
    });

    console.log('Respuesta de Telegram:', response.status);
    console.log('Respuesta de Telegram (texto):', await response.text());

    if (response.ok) {
      res.status(200).json({ message: 'Feedback enviado correctamente' });
    } else {
      res.status(500).json({ error: 'Error al enviar el feedback' });
    }
  } catch (error) {
    console.error('Error al enviar el mensaje:', error);
    res.status(500).json({ error: 'Error en la solicitud' });
  }
}
