import { UNIDADES_RECECAO_IDS, type UnidadeRececao } from "./rececao-unidades";

export type TransferenciaStockInput = {
  fabricaOrigemId: number;
  fabricaDestinoId: number;
  dataTransferencia: Date;
  quantidade: number;
  unidade: UnidadeRececao;
  responsavel: string;
  motivo: string;
};

export function validarTransferenciaStock(input: TransferenciaStockInput) {
  if (!Number.isInteger(input.fabricaOrigemId) || !Number.isInteger(input.fabricaDestinoId) || input.fabricaOrigemId <= 0 || input.fabricaDestinoId <= 0) {
    throw new Error("Selecione as fábricas de origem e destino.");
  }
  if (input.fabricaOrigemId === input.fabricaDestinoId) {
    throw new Error("A fábrica de destino deve ser diferente da origem.");
  }
  if (!(input.dataTransferencia instanceof Date) || Number.isNaN(input.dataTransferencia.getTime())) {
    throw new Error("Indique a data da transferência.");
  }
  if (!Number.isFinite(input.quantidade) || input.quantidade <= 0) {
    throw new Error("Indique uma quantidade superior a zero.");
  }
  if (!UNIDADES_RECECAO_IDS.includes(input.unidade)) {
    throw new Error("Selecione uma unidade válida.");
  }
  if (input.responsavel.trim().length < 2) {
    throw new Error("Indique o responsável pela transferência.");
  }
  if (input.motivo.trim().length < 3) {
    throw new Error("Indique o motivo da transferência.");
  }
}
