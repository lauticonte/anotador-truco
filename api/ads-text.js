export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.themoneytizer.com/ads.txt");
    const originalText = await response.text();

    const extraLines = `
OWNERDOMAIN=contelautaro.com.ar
MANAGERDOMAIN=themoneytizer.com
themoneytizer.com,118752,DIRECT
google.com, pub-3361247486635932, DIRECT, f08c47fec0942fa0
`.trim();

    const finalText = `${extraLines}\n${originalText}`;

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(finalText);
  } catch (error) {
    res.status(500).send("Error al obtener el ads.txt");
  }
}