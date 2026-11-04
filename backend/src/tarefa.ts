import { z } from "zod";

/**
 * Modelo de domínio. `dataCriacao` é um timestamp em milissegundos (epoch):
 * um número trafega em JSON sem perda, dispensando transformers como superjson.
 */
export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
}

// `trim()` antes do `min(1)` impede títulos compostos só de espaços.
const titulo = z
  .string({ error: "Title is required." })
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must be at most 120 characters.");

// Descrição vazia é normalizada para `undefined` (campo opcional).
const descricao = z
  .string()
  .trim()
  .max(1000, "Description must be at most 1000 characters.")
  .optional()
  .transform((v) => (v ? v : undefined));

const id = z.uuid("Invalid task ID.");

export const criarTarefaInput = z.object({ titulo, descricao });

// Atualização com semântica de PUT: o formulário de edição envia a tarefa
// completa, o que evita ambiguidade entre "campo omitido" e "campo apagado".
export const atualizarTarefaInput = z.object({ id, titulo, descricao });

export const idTarefaInput = z.object({ id });

/**
 * Paginação por cursor (keyset). O cursor carrega a chave de ordenação do
 * último item recebido, e não sua posição: excluir uma tarefa já exibida não
 * desloca as páginas seguintes (problema clássico da paginação por offset).
 */
export const listarTarefasInput = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  cursor: z
    .object({ dataCriacao: z.number(), id: z.string() })
    .nullish(),
});

export type CriarTarefaInput = z.infer<typeof criarTarefaInput>;
export type AtualizarTarefaInput = z.infer<typeof atualizarTarefaInput>;
export type ListarTarefasInput = z.infer<typeof listarTarefasInput>;
