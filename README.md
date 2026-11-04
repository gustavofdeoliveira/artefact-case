# artefact

Gerenciador de tarefas simples, feito para a **Parte 2 – Desafio Prático** do case. O backend expõe um CRUD de tarefas via **tRPC** e guarda tudo em memória. O frontend é um app **Next.js 15** que consome esse backend.

## Estrutura

```
.
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── index.ts        # servidor HTTP (adapter standalone do tRPC) + CORS
│       ├── trpc.ts         # init do tRPC e formatação de erros
│       ├── router.ts       # procedimentos task.list/byId/create/update/delete
│       ├── tarefa.ts       # modelo e schemas Zod
│       ├── store.ts        # repositório em memória (Map) + paginação por cursor
│       └── seed.ts         # tarefas fictícias para demonstrar o infinite scroll
├── frontend/               # interface e código em inglês
│   └── src/
│       ├── app/            # rotas: / , /tasks/new , /tasks/[id]/edit
│       ├── components/     # TaskList (infinite scroll), TaskForm, Notice
│       ├── trpc/           # clientes tRPC (server/SSR e React hooks) e tipos
│       └── lib/config.ts
├── docker-compose.yml      # sobe o backend
└── README.md
```

---

## Requisitos funcionais

| ID | Requisito |
|------|-----------|
| RF01 | **Criar tarefa** com `titulo` (obrigatório) e `descricao` (opcional). O servidor gera `id` e `dataCriacao`. |
| RF02 | **Listar tarefas** de forma paginada (cursor), das mais recentes para as mais antigas. |
| RF03 | **Atualizar tarefa** existente (título e descrição). |
| RF04 | **Deletar tarefa** existente. |
| RF05 | **Validação no backend**: rejeitar tarefa sem título (ou só com espaços). |
| RF06 | **Erros significativos**: operar sobre um `id` inexistente retorna erro `NOT_FOUND` com mensagem clara; uma entrada inválida retorna `BAD_REQUEST`. |
| RF07 | **Página de listagem** com a lista pré-carregada via **SSR**. |
| RF08 | **Excluir direto na listagem**, com feedback visual de sucesso ou erro. |
| RF09 | **Página de criação/edição** com formulário (componentes funcionais e hooks). |
| RF10 | **Validação no formulário**: impedir o envio quando o título estiver vazio. |
| RF11 | **Feedback de estados**: carregamento, sucesso e falha, com erros vindos do backend ou do frontend. |
| RF12 | *(Bônus)* **Infinite scroll**: carregamento incremental da listagem conforme o usuário rola a página. |

## Requisitos não funcionais

| ID | Requisito |
|-------|-----------|
| RNF01 | **Stack**: TypeScript em todo o projeto, Next.js 15 (App Router) e tRPC no transporte. |
| RNF02 | **Type-safety de ponta a ponta**: o frontend usa o tipo do router do backend, sem contrato duplicado à mão. |
| RNF03 | **Validação declarativa** dos inputs com Zod, que gera erros padronizados do tRPC. |
| RNF04 | **Armazenamento em memória**: sem banco de dados, e os dados se perdem quando o processo reinicia (comportamento esperado). |
| RNF05 | **Backend containerizado** com Docker, para subir com um único comando. |
| RNF06 | **Simplicidade**: poucas dependências e um layout funcional, sem design elaborado. |
| RNF07 | **Documentação**: código com comentários nas decisões principais e este README. |
| RNF08 | **Repositório público**: nenhuma informação sensível. Todo dado é fictício e não há segredos versionados. |

---

## Pontos não abordados e restrições

O escopo foi limitado de propósito. Abaixo está o que ficou de fora e como seria tratado num cenário real.

| Tema | Situação no projeto | Como seria em produção |
|------|---------------------|------------------------|
| **Autenticação/Autorização (JWT, sessões)** | Não existe. Todos os procedimentos tRPC são públicos e qualquer cliente pode criar, editar ou excluir. | Login (ex.: Auth.js/OAuth) com JWT de curta duração e refresh token em cookie `httpOnly`. Um `protectedProcedure` validaria o token no `context` do tRPC, e as tarefas seriam isoladas por usuário. |
| **Banco de dados / persistência** | Um `Map` em memória. Os dados se perdem a cada restart e não são compartilhados entre réplicas, o que impede escalar horizontalmente. | PostgreSQL com ORM (Prisma/Drizzle), migrations e índices para paginação por cursor. |
| **Multiusuário / concorrência** | Não há controle de edição concorrente: a última escrita vence. | Locking otimista (campo `versao`/`updatedAt`) e conflitos retornando `CONFLICT`. |
| **Rate limiting / proteção contra abuso** | Não implementado. | Rate limit por IP/usuário (ex.: no gateway ou middleware), além de limites de tamanho de payload. |
| **CORS / HTTPS** | CORS liberado só para a origem local do frontend, com HTTP em ambiente de desenvolvimento. | HTTPS terminado em proxy/reverse proxy e CORS restrito aos domínios oficiais. |
| **Observabilidade** | Apenas logs no console. | Logs estruturados, tracing (OpenTelemetry), métricas e alertas. |
| **Testes** | Cobertura mínima ou nenhuma, para manter o foco no escopo do case. | Testes unitários dos procedimentos tRPC (`createCaller`), componentes e e2e (Playwright). |
| **CI/CD e deploy** | Não configurados. | Pipeline com lint, typecheck, testes e build da imagem, mais deploy automatizado. |
| **Frontend em Docker** | Não containerizado de propósito, já que roda localmente com `npm run dev`. | Imagem com `output: "standalone"` do Next.js, se necessário. |
| **Acessibilidade / i18n** | Básico: HTML semântico, `aria-*` nos campos e avisos, e interface em inglês sem suporte a outros idiomas. | Auditoria a11y e internacionalização. |
| **Funcionalidades extras** (status/concluída, prioridade, busca, filtros) | Fora do escopo mínimo. | Evoluções naturais do modelo `Tarefa`. |

---

## Como rodar

### Pré-requisitos

- **Docker** + **Docker Compose** (para o backend)
- **Node.js 20+** e **npm** (para o frontend)

### 1. Backend (Docker)

Na raiz do repositório:

```bash
docker compose up --build
```

O servidor tRPC fica disponível em `http://localhost:4000`.

Para parar: `docker compose down`.

Ao iniciar, o backend cria 25 tarefas fictícias para que o infinite scroll fique visível. Para começar com a lista vazia, defina `SEED: "false"` no `docker-compose.yml`.

<details>
<summary>Rodar o backend sem Docker</summary>

```bash
cd backend
npm install
npm run dev
```
</details>

### 2. Frontend (local)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:3000`.

O frontend lê a URL do backend da variável de ambiente `NEXT_PUBLIC_API_URL`, que tem `http://localhost:4000` como padrão. Para mudar, crie `frontend/.env.local` (ele não é versionado):

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Decisões técnicas

| Decisão | Motivo |
|---------|--------|
| **Backend tRPC standalone** (`@trpc/server/adapters/standalone`), sem Express | Para um CRUD em memória, um framework HTTP a mais não agrega nada. Separar o backend do Next permite subi-lo isolado no Docker. |
| **Frontend importa só o tipo `AppRouter`** (`import type` de `../backend/src/router`) | Garante tipagem de ponta a ponta sem publicar pacote nem montar monorepo. Os `paths` do `frontend/tsconfig.json` resolvem `@trpc/server` e `zod` para os pacotes do próprio frontend, então não é preciso instalar dependências em `backend/`. |
| **Paginação por cursor** (`dataCriacao` + `id`), e não por offset | Com offset, excluir uma tarefa já exibida desloca as páginas seguintes e faz um item "sumir". O cursor guarda a chave do último item, e o `id` desempata tarefas criadas no mesmo milissegundo. |
| **SSR + infinite scroll** | O Server Component busca a 1ª página e a passa como `initialData` para o `useInfiniteQuery`. As páginas seguintes são buscadas no cliente por um `IntersectionObserver`. |
| **`dataCriacao` como número (epoch ms)** | Trafega em JSON sem perda, dispensando transformer (superjson). |
| **Update com semântica de PUT** | O formulário de edição envia a tarefa completa, o que evita ambiguidade entre "campo omitido" e "campo apagado". |
| **Validação dupla** | Zod no backend é a fonte da verdade. O formulário valida antes do envio para dar feedback imediato, e o `errorFormatter` transforma erros do Zod em mensagens legíveis. |
| **Interface e código do frontend em inglês** | Os campos do modelo (`titulo`, `descricao`, `dataCriacao`) mantêm os nomes exigidos pelo case. |

## API (tRPC)

| Procedimento | Tipo | Input | Erros |
|--------------|------|-------|-------|
| `task.list` | query | `{ limit?: 1-50 (default 10), cursor? }` → `{ items, nextCursor }` | `BAD_REQUEST` |
| `task.byId` | query | `{ id }` | `NOT_FOUND`, `BAD_REQUEST` |
| `task.create` | mutation | `{ titulo, descricao? }` | `BAD_REQUEST` (título vazio/longo) |
| `task.update` | mutation | `{ id, titulo, descricao? }` | `NOT_FOUND`, `BAD_REQUEST` |
| `task.delete` | mutation | `{ id }` | `NOT_FOUND`, `BAD_REQUEST` |
