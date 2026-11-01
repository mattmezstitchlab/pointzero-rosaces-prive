import { act } from "react";
import { createRoot } from "react-dom/client";
import { it, expect, vi } from "vitest";
vi.mock("../lib/convert", () => ({ asyncRasterToCells: vi.fn(async () => ({ cross: new Int16Array([0]), palette: [0] })) }));
import Brode from "../components/edition/Brode";
it("fixe le cercle, le conserve au changement de focus, puis le libère au clavier ou par commande", async () => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal("Image", class { naturalHeight = 1; naturalWidth = 1; decode = () => Promise.resolve(); });
  const ctx = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host), fixer = vi.fn();
  const render = (liberation = 0) => root.render(<Brode src="test.webp" alt="Étoffe" legende="Test" fixation={{ rayon: 64, marge: 170, liberation, surFixer: fixer }} />);
  try {
    await act(async () => render());
    const vue = host.querySelector<HTMLElement>(".ed-brode-vue")!;
    expect(host.querySelector("figure")!.dataset.pret).toBe("oui");
    await act(async () => vue.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(fixer.mock.lastCall![0]).toEqual({ x: 300, y: 200 });
    const nb = fixer.mock.calls.length;
    await act(async () => vue.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    expect(fixer).toHaveBeenCalledTimes(nb);
    await act(async () => vue.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(fixer).toHaveBeenLastCalledWith(null);
    await act(async () => vue.click()); expect(fixer.mock.lastCall![0]).not.toBeNull();
    await act(async () => render(1)); expect(fixer).toHaveBeenLastCalledWith(null);
  } finally { await act(async () => root.unmount()); host.remove(); ctx.mockRestore(); vi.unstubAllGlobals(); }
});
