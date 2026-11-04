import { TRPCError } from "@trpc/server";
import { tarefaStore } from "./store";
import {
  atualizarTarefaInput,
  criarTarefaInput,
  idTarefaInput,
  listarTarefasInput,
} from "./tarefa";
import { publicProcedure, router } from "./trpc";

function tarefaNaoEncontrada(id: string): never {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: `Task ${id} not found. It may have been deleted.`,
  });
}

const tarefaRouter = router({
  list: publicProcedure
    .input(listarTarefasInput)
    .query(({ input }) => tarefaStore.listar(input)),

  // Usado pela página de edição para pré-carregar o formulário.
  byId: publicProcedure
    .input(idTarefaInput)
    .query(({ input }) => tarefaStore.obter(input.id) ?? tarefaNaoEncontrada(input.id)),

  create: publicProcedure
    .input(criarTarefaInput)
    .mutation(({ input }) => tarefaStore.criar(input)),

  update: publicProcedure
    .input(atualizarTarefaInput)
    .mutation(({ input }) => tarefaStore.atualizar(input) ?? tarefaNaoEncontrada(input.id)),

  delete: publicProcedure.input(idTarefaInput).mutation(({ input }) => {
    if (!tarefaStore.deletar(input.id)) tarefaNaoEncontrada(input.id);
    return { id: input.id };
  }),
});

export const appRouter = router({ task: tarefaRouter });

/**
 * Único artefato que o frontend importa do backend, e só como *tipo*
 * (`import type`). Isso garante tipagem de ponta a ponta sem levar código
 * do servidor para o bundle do cliente.
 */
export type AppRouter = typeof appRouter;
