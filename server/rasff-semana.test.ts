import { describe, expect, it } from "vitest";
import { obterSemanaRasff } from "@shared/rasff-semana";

describe("semana civil RASFF", () => {
  it("calcula domingo 00:00 até sábado 23:59:59.999", () => {
    const semana = obterSemanaRasff("2026-08-31T07:00:00+01:00");
    expect(semana.inicio.toISOString()).toBe("2026-08-30T00:00:00.000Z");
    expect(semana.fim.toISOString()).toBe("2026-09-05T23:59:59.999Z");
  });

  it("mantém a mesma semana no domingo e no sábado", () => {
    const domingo = obterSemanaRasff("2026-08-30T00:00:00+01:00");
    const sabado = obterSemanaRasff("2026-09-05T23:59:59+01:00");
    expect(domingo.codigo).toBe(sabado.codigo);
    expect(domingo.codigo).toBe("2026-S36");
  });

  it("gera nome de ficheiro estável com ano e número da semana", () => {
    const semana = obterSemanaRasff("2026-08-31T07:00:00+01:00");
    expect(semana.nomeFicheiro).toBe("relatorio-rasff-2026-S36.md");
  });
});
