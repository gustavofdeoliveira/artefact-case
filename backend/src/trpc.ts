import { initTRPC } from "@trpc/server";
import { ZodError, z } from "zod";

const t = initTRPC.create({
  /**
   * Por padrão, um erro de validação do Zod chega ao cliente com a lista de
   * issues serializada em JSON no `message`. Aqui a mensagem vira a primeira
   * issue (legível para o usuário), e o detalhe por campo segue em
   * `data.zodError` para quem precisar.
   */
  errorFormatter({ shape, error }) {
    const zodError = error.cause instanceof ZodError ? error.cause : null;
    return {
      ...shape,
      message: zodError?.issues[0]?.message ?? shape.message,
      data: {
        ...shape.data,
        zodError: zodError ? z.flattenError(zodError).fieldErrors : null,
      },
    };
  },
});

export const router = t.router;

// Sem autenticação no escopo do case. Um `protectedProcedure` com JWT
// entraria aqui (ver "Pontos não abordados" no README).
export const publicProcedure = t.procedure;
