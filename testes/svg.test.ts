import { describe, expect, it } from "vitest";
import * as simpleIcons from "simple-icons";
import * as icones from "../src/data/icons";
import { enxugarPath, lerPath } from "../src/data/svg";

// Todo path que o sprite pode usar: o simple-icons inteiro e os ícones próprios
const paths = [
  ...Object.values(simpleIcons).flatMap((i) => (typeof i === "object" && i && "path" in i ? [(i as any).path] : [])),
  ...Object.values(icones).map((i) => i.path),
] as string[];

describe("enxugarPath", () => {
  it("mantém comandos e valores de todos os ícones, com desvio de no máximo 0,005", () => {
    let pior = 0;
    for (const d of paths) {
      const original = lerPath(d);
      const enxuto = lerPath(enxugarPath(d));
      expect(enxuto.map((s) => s.comando)).toEqual(original.map((s) => s.comando));
      original.forEach((segmento, i) => {
        expect(enxuto[i].valores.length).toBe(segmento.valores.length);
        segmento.valores.forEach((v, k) => {
          pior = Math.max(pior, Math.abs(v - enxuto[i].valores[k]));
        });
      });
    }
    expect(paths.length).toBeGreaterThan(3000);
    expect(pior).toBeLessThanOrEqual(0.005 + 1e-9);
  });

  it("lê flags de arco coladas como um caractere cada", () => {
    expect(lerPath("M0 0a1 1 0 01.5.5")).toEqual([
      { comando: "M", valores: [0, 0] },
      { comando: "a", valores: [1, 1, 0, 0, 1, 0.5, 0.5] },
    ]);
  });

  it("trata pares depois do moveto como lineto", () => {
    expect(lerPath("M1 2 3 4").map((s) => s.comando)).toEqual(["M", "L"]);
    expect(lerPath(enxugarPath("M1 2 3 4")).map((s) => s.comando)).toEqual(["M", "L"]);
  });
});
