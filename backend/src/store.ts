import { randomUUID } from "node:crypto";
import type {
  AtualizarTarefaInput,
  CriarTarefaInput,
  ListarTarefasInput,
  Tarefa,
} from "./tarefa";

/**
 * Repositório em memória. A camada de rotas só conhece esta interface,
 * então trocar por um banco real (Postgres/Prisma) não afeta o router.
 * Os dados vivem enquanto o processo estiver de pé, por definição do case.
 */
const tarefas = new Map<string, Tarefa>();

/**
 * Ordenação estável: mais recentes primeiro e `id` como desempate, porque
 * duas tarefas podem ser criadas no mesmo milissegundo.
 */
type ChaveOrdenacao = Pick<Tarefa, "dataCriacao" | "id">;

function compararTarefas(a: ChaveOrdenacao, b: ChaveOrdenacao): number {
  if (a.dataCriacao !== b.dataCriacao) return b.dataCriacao - a.dataCriacao;
  return b.id.localeCompare(a.id);
}

export const tarefaStore = {
  listar({ limit, cursor }: ListarTarefasInput) {
    const ordenadas = [...tarefas.values()].sort(compararTarefas);

    // Mantém apenas o que vem *depois* do cursor na ordenação, mesmo que a
    // tarefa do cursor já tenha sido excluída.
    const restantes = cursor
      ? ordenadas.filter((t) => compararTarefas(t, cursor) > 0)
      : ordenadas;

    const itens = restantes.slice(0, limit);
    const ultimo = itens[itens.length - 1];
    const temMais = restantes.length > limit;

    return {
      items: itens,
      nextCursor: temMais && ultimo ? { dataCriacao: ultimo.dataCriacao, id: ultimo.id } : null,
    };
  },

  obter(id: string): Tarefa | undefined {
    return tarefas.get(id);
  },

  criar({ titulo, descricao }: CriarTarefaInput, dataCriacao = Date.now()): Tarefa {
    const tarefa: Tarefa = { id: randomUUID(), titulo, descricao, dataCriacao };
    tarefas.set(tarefa.id, tarefa);
    return tarefa;
  },

  /** Retorna `undefined` se a tarefa não existir; o router traduz em NOT_FOUND. */
  atualizar({ id, titulo, descricao }: AtualizarTarefaInput): Tarefa | undefined {
    const atual = tarefas.get(id);
    if (!atual) return undefined;
    const atualizada: Tarefa = { ...atual, titulo, descricao };
    tarefas.set(id, atualizada);
    return atualizada;
  },

  deletar(id: string): boolean {
    return tarefas.delete(id);
  },
};
