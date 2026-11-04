import { tarefaStore } from "./store";

/**
 * Popula o store com tarefas fictícias para que o infinite scroll seja
 * visível logo ao abrir a aplicação. Pode ser desligado com SEED=false.
 */
const exemplos = [
  "Revisar pull request do módulo de relatórios",
  "Atualizar dependências do projeto",
  "Escrever testes para o fluxo de cadastro",
  "Preparar apresentação da sprint",
  "Corrigir alinhamento do cabeçalho no mobile",
  "Documentar endpoints da API",
  "Configurar pipeline de CI",
  "Responder feedback do time de design",
  "Planejar migração para o novo servidor",
  "Organizar backlog da próxima sprint",
  "Investigar lentidão na tela de busca",
  "Criar protótipo da tela de configurações",
];

export function seed(quantidade = 25) {
  const agora = Date.now();
  for (let i = 0; i < quantidade; i++) {
    tarefaStore.criar(
      {
        titulo: `${exemplos[i % exemplos.length]} #${i + 1}`,
        descricao: i % 3 === 0 ? undefined : "Tarefa de exemplo gerada automaticamente.",
      },
      // Datas espaçadas de 1 minuto para uma ordenação previsível.
      agora - (quantidade - i) * 60_000,
    );
  }
}
