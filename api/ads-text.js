export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.themoneytizer.com/ads.txt");
    const originalText = await response.text();

    // Líneas propias de la cuenta (no están en el ads.txt genérico de Moneytizer).
    // Si el panel de Moneytizer pide líneas nuevas, se agregan acá.
    const extraLines = `
OWNERDOMAIN=contelautaro.com.ar
MANAGERDOMAIN=themoneytizer.com
themoneytizer.com,118752,DIRECT
google.com, pub-3361247486635932, DIRECT, f08c47fec0942fa0
INVENTORYPARTNERDOMAIN=pubx.ai
improvedigital.com, 1602_118752, DIRECT
improvedigital.com, 1033_118752, DIRECT
`.trim();

    const finalText = `${extraLines}\n${originalText}`;

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(finalText);
  } catch (error) {
    res.status(500).send("Error al obtener el ads.txt");
  }
}