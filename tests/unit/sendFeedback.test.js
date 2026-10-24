// @vitest-environment node
// Función de sugerencias: valida, escapa el texto y limita los envíos por IP
import { beforeEach, describe, expect, it, vi } from "vitest";

const respuesta = () => {
  const res = { statusCode: 0, body: null };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (body) => ((res.body = body), res);
  return res;
};

const pedido = (feedback, ip = "1.1.1.1", method = "POST") => ({
  method,
  body: { feedback },
  headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
});

let handler;
let fetchMock;
beforeEach(async () => {
  vi.resetModules(); // límite por IP nuevo en cada test
  ({ default: handler } = await import("../../api/sendFeedback.js"));
  fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("ok") });
  vi.stubGlobal("fetch", fetchMock);
  process.env.BOT_TOKEN = "token-de-prueba";
  process.env.CHAT_ID = "123";
});

const textoEnviado = () => JSON.parse(fetchMock.mock.calls[0][1].body).text;

describe("api/sendFeedback", () => {
  it("solo acepta POST", async () => {
    const res = respuesta();
    await handler(pedido("hola", "1.1.1.1", "GET"), res);
    expect(res.statusCode).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("manda la sugerencia a Telegram con formato HTML", async () => {
    const res = respuesta();
    await handler(pedido("  Muy bueno el anotador  "), res);
    expect(res.statusCode).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.telegram.org/bottoken-de-prueba/sendMessage");
    expect(textoEnviado()).toContain("<i>Muy bueno el anotador</i>");
  });

  it("escapa el HTML del usuario para que no rompa ni formatee el mensaje", async () => {
    const res = respuesta();
    await handler(pedido('<b>hola</b> & <a href="x">link</a> 5 < 7'), res);
    expect(res.statusCode).toBe(200);
    expect(textoEnviado()).toContain("<i>&lt;b&gt;hola&lt;/b&gt; &amp; &lt;a href=\"x\"&gt;link&lt;/a&gt; 5 &lt; 7</i>");
  });

  it.each([
    ["vacía", "   "],
    ["que no es texto", { malicioso: true }],
    ["de más de 1000 caracteres", "a".repeat(1001)],
  ])("rechaza una sugerencia %s", async (_, feedback) => {
    const res = respuesta();
    await handler(pedido(feedback), res);
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limita a 5 envíos por IP cada 10 minutos", async () => {
    for (let i = 0; i < 5; i++) {
      const res = respuesta();
      await handler(pedido(`sugerencia ${i}`), res);
      expect(res.statusCode).toBe(200);
    }
    const bloqueada = respuesta();
    await handler(pedido("una más"), bloqueada);
    expect(bloqueada.statusCode).toBe(429);
    const otraIp = respuesta();
    await handler(pedido("desde otra IP", "2.2.2.2"), otraIp);
    expect(otraIp.statusCode).toBe(200);
  });

  it("si Telegram falla no le muestra el detalle al navegador", async () => {
    fetchMock.mockResolvedValue({ ok: false, text: () => Promise.resolve('{"description":"Unauthorized: token"}') });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = respuesta();
    await handler(pedido("hola"), res);
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("Unauthorized");
  });
});
