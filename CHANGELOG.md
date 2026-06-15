# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue uma versão simplificada do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), com agrupamento por versão e por tipo de alteração.

## [0.1.9] - 2026-06-15

### Alterado

- Renomeada a ação compacta de envio por teclado para "Enviar com ENTER".
- Transformada a opção de envio por ENTER em um toggle visual.
- Reduzido o espaçamento entre textarea e botões no composer mobile.
- Alinhadas as ações do composer à direita para seguir um padrão mais comum de envio.

### Técnico

- Mantido `aria-pressed` no toggle para preservar semântica acessível.
- Ajustadas classes responsivas de espaçamento e largura dos botões no composer.

## [0.1.8] - 2026-06-15

### Alterado

- Compactado o composer no mobile para reduzir o espaço entre campo de texto e botões.
- Ajustados os botões do composer no mobile para ficarem menores e alinhados na mesma linha.
- O botão de envio agora permanece ao lado das ações de ENTER e IA em telas pequenas.
- Aumentado o botão de voltar do header mobile do chat para melhorar toque e visibilidade.

### Técnico

- Usadas classes responsivas para manter botões compactos no mobile e confortáveis no desktop.
- Mantido texto acessível via `aria-label` no botão de envio com ENTER.

## [0.1.7] - 2026-06-15

### Alterado

- Ajustada a experiência mobile para funcionar como navegação lista-conversa.
- No mobile, a tela inicial mostra apenas a lista de contatos.
- Ao selecionar uma conversa no mobile, o chat ocupa a tela e exibe um botão de voltar no header.
- O header mobile do chat passou a exibir botão voltar, avatar, nome e telefone do contato.
- No desktop, a lista e o chat continuam lado a lado.

### Técnico

- Adicionado controle de viewport mobile com `matchMedia`.
- Separado o estado de abertura do chat no mobile do estado de conversa selecionada.
- Usadas classes responsivas para alternar visibilidade dos painéis sem afetar o layout desktop.

## [0.1.6] - 2026-06-15

### Adicionado

- Adicionada opção "Enviar mensagem com ENTER" no composer.
- Quando ativada, a tecla `Enter` envia a mensagem e `Shift + Enter` continua permitindo quebra de linha.
- Adicionado `enterKeyHint="send"` para sugerir ação de envio em teclados digitais no mobile.

### Técnico

- Centralizado o envio do rascunho em uma função compartilhada entre submit do formulário e atalho de teclado.
- Usado `aria-pressed` para comunicar o estado do botão alternável.

## [0.1.5] - 2026-06-15

### Alterado

- Ajustado o layout do inbox para ocupar a altura da janela, sem rolar a página inteira.
- A lista de conversas e o histórico do chat agora possuem rolagem interna própria.
- O composer permanece fixo no rodapé do painel de conversa, semelhante ao comportamento do WhatsApp Desktop.
- Melhorada a distribuição responsiva entre lista e chat em telas menores.

### Técnico

- Substituídos cálculos fixos de altura por composição com grid/flex, `h-dvh`, `min-h-0` e `overflow-y-auto`.
- Reduzida a chance de o scroll automático das mensagens deslocar a página inteira.

## [0.1.4] - 2026-06-15

### Alterado

- Separados os componentes visuais do inbox em arquivos menores dentro de `app/_components/inbox`.
- `app/inbox-app.tsx` passou a concentrar principalmente estado local, queries, mutations e orquestração da tela.
- Extraídos utilitários de formatação, iniciais, telefone e busca para um módulo compartilhado da feature.

### Técnico

- Melhorada a organização para evidenciar composição de componentes no App Router.
- Mantido o comportamento existente sem alterar contratos com a API.

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
