export type EstadoOperacionalMp = "ativa" | "para_testes" | "inativa";

export function validarTransferenciaMp(input: {
  fabricaOrigemId: number;
  fabricaDestinoId: number;
  manterNaOrigem: boolean;
}) {
  if (!Number.isInteger(input.fabricaOrigemId) || !Number.isInteger(input.fabricaDestinoId)) {
    throw new Error("Selecione as fábricas de origem e de destino.");
  }
  if (input.fabricaOrigemId === input.fabricaDestinoId) {
    throw new Error("A fábrica de destino deve ser diferente da fábrica de origem.");
  }
}
