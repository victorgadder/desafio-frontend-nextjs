# Inbox de Atendimento WhatsApp com IA

Frontend em Next.js para um painel de atendimento via WhatsApp. A aplicacao consome a API fornecida pelo desafio e entrega lista de conversas, historico do chat, envio de mensagens com atualizacao otimista e sugestao de resposta com IA.

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse http://localhost:3000.

A URL da API ja vem configurada em `.env.example`:

```bash
NEXT_PUBLIC_API_URL=https://8tymn68hp9.execute-api.us-east-1.amazonaws.com
```

## Scripts

```bash
npm run dev        # ambiente local
npm run lint       # validacao de lint
npm run typecheck  # checagem TypeScript
npm run build      # build de producao
```

## O que foi implementado

- Lista de conversas com busca por nome, telefone e ultima mensagem.
- Indicador de nao lidas, ultima mensagem e horario da conversa.
- Tela de chat com bolhas separando cliente e atendente.
- Envio de mensagem com atualizacao otimista.
- Botao para sugerir resposta com IA usando `POST /ai/suggest`.
- Estados de loading, erro e vazio para lista, chat e composicao.
- Polling para manter conversas e mensagens sincronizadas.
- Layout responsivo com foco em uso de inbox operacional.

## Decisoes de arquitetura

### Server e Client Components

`app/page.tsx` fica como Server Component simples e renderiza `InboxApp`. A interface principal esta em `app/inbox-app.tsx` como Client Component porque depende de estado local, eventos de formulario, React Query, polling e mutacoes.

Essa separacao deixa a rota limpa e evita transformar mais componentes do que o necessario em componentes interativos.

### API centralizada

O arquivo `lib/api.ts` continua sendo o contrato de comunicacao com o backend. A UI importa funcoes como `getConversations`, `getMessages`, `sendMessage` e `suggestReply`, sem conhecer detalhes de Axios, base URL ou rotas.

Isso facilita testes futuros e reduz acoplamento entre tela e transporte HTTP.

### React Query

React Query foi usado para cache, loading, erro, polling e invalidacao:

- `["me"]` carrega o atendente logado.
- `["conversations"]` carrega a lista e faz polling a cada 10 segundos.
- `["messages", conversationId]` carrega o historico da conversa selecionada e faz polling a cada 6 segundos.

Escolhi polling por ser suficiente para o escopo do desafio e simples de defender. Em producao, eu avaliaria WebSocket ou Server-Sent Events para reduzir latencia e chamadas repetidas.

### Atualizacao otimista

No envio de mensagem, a mensagem aparece imediatamente no chat antes da resposta do servidor. A mutacao:

1. Cancela queries em andamento da conversa.
2. Salva snapshots de mensagens e conversas.
3. Insere uma mensagem temporaria no cache.
4. Atualiza o preview da conversa.
5. Troca a mensagem temporaria pela resposta real quando o backend confirma.
6. Restaura o estado anterior se houver erro.

Essa escolha melhora a percepcao de velocidade sem esconder falhas, porque em caso de erro o texto volta para o campo de composicao.

### UX e acessibilidade

A tela usa controles nativos (`button`, `input`, `textarea`, `form`) para manter boa acessibilidade basica. Tambem foram adicionados:

- `sr-only` em labels visuais.
- `aria-label` em skeletons.
- `role="alert"` para erros do composer.
- foco visivel em botoes e campos.
- estados vazios e mensagens de erro com acao de tentar novamente.

## O que faria com mais tempo

- Adicionar testes com React Testing Library para busca, envio otimista e erro de mutacao.
- Usar WebSocket ou SSE para atualizacao em tempo real.
- Marcar mensagens como lidas ao abrir a conversa, se a API oferecesse essa rota.
- Separar `InboxApp` em componentes menores por pasta quando a tela crescesse.
- Adicionar virtualizacao se a lista de mensagens pudesse ficar muito grande.

## Validacao

Os comandos abaixo foram executados com sucesso:

```bash
npm run lint
npm run typecheck
npm run build
```
