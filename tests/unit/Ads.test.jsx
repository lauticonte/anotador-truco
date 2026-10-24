// Anuncio: los iframes que crea Moneytizer reciben un title (accesibilidad)
import React from "react";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Ads from "../../src/components/Ads.jsx";

afterEach(() => vi.useRealTimers());

describe("Ads", () => {
  it("pone title a los iframes que agrega Moneytizer, también cuando rota el anuncio", async () => {
    vi.useFakeTimers();
    const { container } = render(<Ads adId="127560-28" type="28" siteId="127560" formatId="28" />);
    const contenedor = container.querySelector("[id='127560-28']");
    // Como hace Smart AdServer: un div con el iframe adentro
    const banner = document.createElement("div");
    banner.innerHTML = '<iframe id="sas_iframe_30012"></iframe>';
    await act(async () => contenedor.appendChild(banner));
    expect(contenedor.querySelector("iframe").title).toBe("Publicidad");
    // Rotación: el iframe se reemplaza por otro nuevo
    const nuevo = document.createElement("iframe");
    await act(async () => banner.replaceChildren(nuevo));
    expect(nuevo.title).toBe("Publicidad");
  });

  it("no pisa un title que ya traiga el iframe", async () => {
    vi.useFakeTimers();
    const { container } = render(<Ads adId="127560-28" type="28" siteId="127560" formatId="28" />);
    const contenedor = container.querySelector("[id='127560-28']");
    const iframe = document.createElement("iframe");
    iframe.title = "Anuncio de Moneytizer";
    await act(async () => contenedor.appendChild(iframe));
    expect(iframe.title).toBe("Anuncio de Moneytizer");
  });
});
