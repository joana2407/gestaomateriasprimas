import { describe, expect, it } from "vitest";
import { resumirObservacoesRececao, temObservacoesRececao } from "../shared/rececao-observacoes";

describe("alerta de observações de receção", () => {
  it("só considera observações com conteúdo efetivo", () => {
    expect(temObservacoesRececao(null)).toBe(false);
    expect(temObservacoesRececao("   ")).toBe(false);
    expect(temObservacoesRececao("Embalagem com pequena marca.")).toBe(true);
  });

  it("normaliza e limita o resumo enviado na notificação", () => {
    expect(resumirObservacoesRececao("  Embalagem\ncom   marca  ")).toBe("Embalagem com marca");
    expect(resumirObservacoesRececao("abcdef", 5)).toBe("abcd…");
  });
});
