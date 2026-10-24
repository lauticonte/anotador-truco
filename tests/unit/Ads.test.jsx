// Publicidad diferida (v2.0.1): los scripts de Moneytizer se cargan 2,5 s después del load, nunca antes
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdComponent, { AD_DELAY_MS } from "../../src/components/Ads.jsx";

const props = { adId: "127560-28", type: "28", siteId: "127560", formatId: "28" };
const scriptsDe = (container) => [...container.querySelectorAll("script")].map((s) => s.getAttribute("src"));

describe("AdComponent", () => {
  it("con la página ya cargada, espera 2,5 s antes de pedir los scripts de Moneytizer", () => {
    vi.useFakeTimers();
    vi.spyOn(console, "time").mockImplementation(() => {});
    const { container } = render(<AdComponent {...props} />);
    act(() => vi.advanceTimersByTime(AD_DELAY_MS - 1));
    expect(scriptsDe(container)).toEqual([]);
    act(() => vi.advanceTimersByTime(1));
    expect(scriptsDe(container)).toEqual([
      "//ads.themoneytizer.com/s/gen.js?type=28",
      "//ads.themoneytizer.com/s/requestform.js?siteId=127560&formatId=28",
    ]);
  });

  it("si la página todavía no terminó de cargar, cuenta los 2,5 s desde el evento load", () => {
    vi.useFakeTimers();
    vi.spyOn(console, "time").mockImplementation(() => {});
    const estado = vi.spyOn(document, "readyState", "get").mockReturnValue("interactive");
    const { container } = render(<AdComponent {...props} />);
    act(() => vi.advanceTimersByTime(10000));
    expect(scriptsDe(container)).toEqual([]);
    estado.mockReturnValue("complete");
    act(() => window.dispatchEvent(new Event("load")));
    act(() => vi.advanceTimersByTime(AD_DELAY_MS));
    expect(scriptsDe(container)).toHaveLength(2);
  });

  it("un toque no adelanta la carga (no compite con la interacción)", () => {
    vi.useFakeTimers();
    vi.spyOn(console, "time").mockImplementation(() => {});
    const { container } = render(<AdComponent {...props} />);
    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);
    act(() => vi.advanceTimersByTime(1000));
    expect(scriptsDe(container)).toEqual([]);
  });

  it("si se desmonta antes, no carga nada", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<AdComponent {...props} />);
    unmount();
    act(() => vi.advanceTimersByTime(AD_DELAY_MS * 2));
    expect(scriptsDe(container)).toEqual([]);
  });
});
