import { describe, expect, it } from "vitest";
import { filtrarRececoes } from "../shared/rececao-filtros";

const rececoes = [
  { fornecedorId: 1, materiaPrimaId: 10, materiaPrimaNome: "Farinha de arroz", fornecedorNome: "Credin", lote: "A-01", numeroGuia: "GR-101", dataRececao: "2026-08-10" },
  { fornecedorId: 2, materiaPrimaId: 11, materiaPrimaNome: "Açúcar", fornecedorNome: "Martinpan", lote: "B-02", numeroGuia: "GR-102", dataRececao: "2026-08-14" },
];

describe("filtros de pesquisa de receções", () => {
  it("pesquisa por texto nos campos operacionais", () => {
    expect(filtrarRececoes(rececoes, { pesquisa: "credin" })).toHaveLength(1);
    expect(filtrarRececoes(rececoes, { pesquisa: "gr-102" })[0]?.materiaPrimaId).toBe(11);
  });

  it("combina os filtros de fornecedor e matéria-prima", () => {
    expect(filtrarRececoes(rececoes, { pesquisa: "", fornecedorId: 1, materiaPrimaId: 10 })).toHaveLength(1);
    expect(filtrarRececoes(rececoes, { pesquisa: "", fornecedorId: 1, materiaPrimaId: 11 })).toHaveLength(0);
  });

  it("filtra inclusivamente por data inicial e final", () => {
    expect(filtrarRececoes(rececoes, { pesquisa: "", dataInicial: "2026-08-10", dataFinal: "2026-08-10" })).toHaveLength(1);
    expect(filtrarRececoes(rececoes, { pesquisa: "", dataInicial: "2026-08-11", dataFinal: "2026-08-20" })[0]?.materiaPrimaId).toBe(11);
  });

  it("filtra por lote específico independentemente da pesquisa geral", () => {
    expect(filtrarRececoes(rececoes, { pesquisa: "", lote: "b-02" })[0]?.materiaPrimaId).toBe(11);
    expect(filtrarRececoes(rececoes, { pesquisa: "", lote: "inexistente" })).toHaveLength(0);
  });
});
