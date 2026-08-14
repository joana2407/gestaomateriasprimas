import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { qualidadeProcedure, router } from "../_core/trpc";
import { addAuditLog, atualizarOperadorPin, criarOperadorPin, getOperadorPinGerivelPorId, getOperadoresPinGeriveis } from "../db";

const perfilSchema = z.enum(["logistica", "qualidade"]);
const pinSchema = z.string().regex(/^\d{4}$/, "O PIN deve ter quatro dígitos.");
const hashPin = (pin: string) => createHash("sha256").update(pin).digest("hex");

export const operadoresRouter = router({
  list: qualidadeProcedure.query(async () => getOperadoresPinGeriveis()),

  criar: qualidadeProcedure
    .input(z.object({ nome: z.string().trim().min(2).max(120), role: perfilSchema, pin: pinSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        const criado = await criarOperadorPin({
          openId: `pin-${randomUUID()}`,
          nome: input.nome,
          role: input.role,
          pinHash: hashPin(input.pin),
        });
        await addAuditLog({
          entidade: "operador_pin",
          entidadeId: criado.operadorId,
          acao: "criado",
          dadosNovos: { nome: input.nome, role: input.role },
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Qualidade",
        });
        return criado;
      } catch (error: any) {
        if (error?.code === "ER_DUP_ENTRY") throw new Error("Este PIN já está a ser utilizado por outro operador.");
        throw error;
      }
    }),

  atualizar: qualidadeProcedure
    .input(z.object({ operadorId: z.number().int().positive(), role: perfilSchema.optional(), ativo: z.boolean().optional(), pin: pinSchema.optional() }))
    .mutation(async ({ input, ctx }) => {
      const operadorAtual = await getOperadorPinGerivelPorId(input.operadorId);
      if (!operadorAtual) throw new Error("Operador não encontrado.");
      if (operadorAtual.userId === ctx.user.id && input.ativo === false) throw new Error("Não pode desativar o seu próprio acesso.");
      try {
        await atualizarOperadorPin(input.operadorId, {
          ...(input.role ? { role: input.role } : {}),
          ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
          ...(input.pin ? { pinHash: hashPin(input.pin) } : {}),
        });
        await addAuditLog({
          entidade: "operador_pin",
          entidadeId: input.operadorId,
          acao: "atualizado",
          dadosNovos: { ...(input.role ? { role: input.role } : {}), ...(input.ativo !== undefined ? { ativo: input.ativo } : {}), ...(input.pin ? { pinAlterado: true } : {}) },
          userId: ctx.user.id,
          userName: ctx.user.name ?? "Qualidade",
        });
        return { success: true } as const;
      } catch (error: any) {
        if (error?.code === "ER_DUP_ENTRY") throw new Error("Este PIN já está a ser utilizado por outro operador.");
        throw error;
      }
    }),
});
