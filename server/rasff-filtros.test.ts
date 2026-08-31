import { describe, expect, it } from "vitest";
import { dataEstaNoIntervalo, extrairDataAlertaRasff } from "../shared/rasff-filtros";

describe("filtros de alertas RASFF", () => {
  it("reconhece data ISO e data portuguesa", () => {
    expect(extrairDataAlertaRasff("RASFF 2026-08-14 — trigo")).toBe("2026-08-14");
    expect(extrairDataAlertaRasff("Alerta de 14/08/2026 — farinha")).toBe("2026-08-14");
    expect(extrairDataAlertaRasff("Alerta de 14.08.2026 — farinha")).toBe("2026-08-14");
  });

  it("reconhece agosto escrito por extenso", () => {
    expect(extrairDataAlertaRasff("Data do alerta: 14 de agosto de 2026")).toBe("2026-08-14");
  });

  it("mantém linhas sem data quando não há filtro e exclui-as apenas com filtro temporal", () => {
    expect(dataEstaNoIntervalo(undefined, "", "")).toBe(true);
    expect(dataEstaNoIntervalo(undefined, "2026-08-01", "2026-08-31")).toBe(false);
    expect(dataEstaNoIntervalo("2026-08-14", "2026-08-01", "2026-08-31")).toBe(true);
  });
});
