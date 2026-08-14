export type TransferenciaStockInput = {
  rececaoOrigemId: number;
  fabricaDestinoId: number;
  dataTransferencia: Date;
  quantidade: number;
  responsavel: string;
  motivo: string;
};

export function calcularQuantidadeDisponivel(quantidadeRecebida: number, quantidadeTransferida: number) {
  return Math.max(0, quantidadeRecebida - quantidadeTransferida);
}

export function validarTransferenciaStock(input: TransferenciaStockInput) {
  if (!Number.isInteger(input.rececaoOrigemId) || input.rececaoOrigemId <= 0) {
    throw new Error("Selecione a receção e o lote de origem.");
  }
  if (!Number.isInteger(input.fabricaDestinoId) || input.fabricaDestinoId <= 0) {
    throw new Error("Selecione a fábrica de destino.");
  }
  if (!(input.dataTransferencia instanceof Date) || Number.isNaN(input.dataTransferencia.getTime())) {
    throw new Error("Indique a data da transferência.");
  }
  if (!Number.isFinite(input.quantidade) || input.quantidade <= 0) {
    throw new Error("Indique uma quantidade superior a zero.");
  }
  if (input.responsavel.trim().length < 2) {
    throw new Error("Indique o responsável pela transferência.");
  }
  if (input.motivo.trim().length < 3) {
    throw new Error("Indique o motivo da transferência.");
  }
}
