import { describe, expect, it } from "vitest";
import { filtrarRececoes } from "../shared/rececao-filtros";

const rececoes = [
  { fornecedorId: 1, materiaPrimaId: 10, materiaPrimaNome: "Farinha de arroz", fornecedorNome: "Credin", lote: "A-01", numeroGuia: "GR-101" },
  { fornecedorId: 2, materiaPrimaId: 11, materiaPrimaNome: "Açúcar", fornecedorNome: "Martinpan", lote: "B-02", numeroGuia: "GR-102" },
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
});
