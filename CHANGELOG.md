# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue uma versão simplificada do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), com agrupamento por versão e por tipo de alteração.

## [0.1.3] - 2026-06-15

### Alterado

- Adicionados atributos de acessibilidade ao item de conversa selecionado.
- A conversa ativa agora informa seu estado com `aria-current` e `aria-pressed`, além do destaque visual.

### Técnico

- Melhorada a navegação com tecnologias assistivas sem alterar o comportamento visual da lista.

## [0.1.2] - 2026-06-15

### Alterado

- Substituído o indicador fixo "Online" por um badge de sincronização derivado do estado das queries.
- O status geral agora pode exibir "Online", "Sincronizando" ou "Offline".
- Removido o badge fixo da lista de conversas para evitar estados visuais conflitantes.

### Técnico

- O header passou a receber estados de sincronização e falha das queries principais.
- Adicionado `aria-live="polite"` ao badge para comunicar mudanças de status sem interromper o usuário.

## [0.1.1] - 2026-06-15

### Alterado

- Separado o estado de carregamento e erro do perfil do atendente do estado da lista de conversas.
- O header agora exibe um estado próprio quando `/me` falha, com ação para tentar carregar o perfil novamente.
- A lista de conversas passa a depender apenas da query de conversas para decidir loading e erro.

### Técnico

- Evitado que uma falha isolada em `/me` bloqueie o uso principal do inbox.
- Mantida a query de conversas independente para preservar a experiência quando apenas dados acessórios falham.

## [0.1.0] - 2026-06-15

### Adicionado

- Implementada a tela principal do inbox de atendimento.
- Adicionada lista de conversas com contato, telefone, última mensagem, horário e indicador de mensagens não lidas.
- Adicionada busca local por nome, telefone e última mensagem.
- Implementado painel de chat com histórico de mensagens em bolhas separando cliente e atendente.
- Adicionados timestamps nas mensagens.
- Implementado envio de mensagem com atualização otimista.
- Adicionado rollback visual em caso de falha no envio.
- Implementado botão de sugestão de resposta com IA usando `POST /ai/suggest`.
- Adicionado polling com React Query para manter conversas e mensagens sincronizadas.
- Adicionados estados de carregamento, erro e vazio para lista e chat.
- Adicionado tratamento de erro no campo de composição.
- Adicionadas melhorias básicas de acessibilidade com labels ocultas, foco visível e alertas de erro.
- Atualizado `README.md` com instruções de execução, decisões de arquitetura e melhorias futuras.

### Técnico

- Mantido `app/page.tsx` como Server Component de composição da rota.
- Criado `app/inbox-app.tsx` como Client Component para concentrar estado interativo, queries, mutations e eventos de UI.
- Reutilizado `lib/api.ts` como camada centralizada de comunicação com o backend.
- Configurado uso de chaves de cache `["me"]`, `["conversations"]` e `["messages", conversationId]` no React Query.

### Validado

- `npm run lint`
- `npm run typecheck`
- `npm run build`
