# Portfolio MoreiraGabryel v2 — Plano de implementação

> Para Hermes: executar em blocos curtos, validar no browser a cada bloco e preservar compatibilidade com deploy estático no Cloudflare Pages.

Objetivo: reconstruir o portfolio em React + Vite + TypeScript com Tailwind, GSAP e Framer Motion, substituindo a base anterior e entregando build estático em dist/.

Arquitetura: SPA estática em Vite, com i18n manual simples PT/EN em config local, animações leves por CSS para ícones/raios e GSAP restrito ao loading e reveals. O deploy-alvo é Cloudflare Pages servindo a pasta dist/ após npm run build.

Tech stack: React, Vite, TypeScript, Tailwind CSS, GSAP, Framer Motion.

---

## Bloco 0 — Reset controlado do projeto
Objetivo: trocar a base atual pela base Vite sem deixar resíduos da versão Next.

Arquivos/pastas-alvo:
- Substituir: package.json, tsconfig*.json, index.html, vite.config.ts, src/*
- Remover compatibilidade antiga: next.config.*, src/app/*, src/components/sections antigos, src/animations antigos ligados ao Next, out/, .next/
- Preservar e adaptar: public/icons/, public/projects/, scripts/ úteis de dev/stop se fizer sentido para Vite

Passos:
1. Inventariar arquivos atuais e decidir o que sai/permanece.
2. Recriar package.json de Vite.
3. Limpar sobras específicas de Next.
4. Confirmar que `npm install` fecha sem erro.

Validação:
- `npm install`
- `npm run dev`
- browser em http://127.0.0.1:3000 ou porta do Vite configurada

---

## Bloco 1 — Setup base Vite + Tailwind
Objetivo: deixar a fundação estável para desenvolvimento e deploy Cloudflare.

Arquivos:
- Criar/reescrever: package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, index.html, src/main.tsx, src/App.tsx, src/index.css
- Criar/ajustar scripts auxiliares: scripts/dev-fresh.cjs, scripts/dev-stop.cjs (ou nomes equivalentes)

Entregas:
- Vite React TS instalado
- Tailwind configurado via `@tailwindcss/vite`
- porta fixa preferencial 3000 para manter seu fluxo
- comandos simples:
  - `npm run dev:fresh` → sobe localhost limpo
  - `npm run dev:stop` → derruba localhost
  - `npm run build` → gera dist/
  - `npm run preview` → testa build local

Validação:
- `npm run dev:fresh`
- `npm run dev:stop`
- `npm run build`
- confirmar `dist/index.html`

---

## Bloco 2 — Base visual global
Objetivo: definir paleta, tipografia e keyframes globais.

Arquivos:
- index.html
- src/index.css

Entregas:
- Google Fonts: Inter + Space Grotesk via `<link>`
- variáveis de cor globais
- classes utilitárias/base de superfície
- keyframes:
  - `float`
  - `lightningPulse`
  - `fade-in`
- regras de performance respeitadas

Validação:
- browser com fundo #0A0A0A
- tipografia correta carregada
- sem warnings de layout

---

## Bloco 3 — Config e i18n manual simples
Objetivo: centralizar conteúdo PT/EN sem next-intl.

Arquivos:
- src/config/technologies.ts
- src/config/contact.ts
- opcional: src/config/copy.ts

Entregas:
- lista de tecnologias com:
  - id
  - nome PT/EN
  - descrição PT/EN
  - ícone
  - tamanho/posição base se necessário
- contatos centralizados
- dicionário simples PT/EN

Validação:
- troca de idioma altera textos corretos
- sem texto hardcoded espalhado em múltiplos componentes

---

## Bloco 4 — LoadingScreen
Objetivo: implementar a abertura cinematográfica com raio diagonal.

Arquivos:
- src/components/sections/LoadingScreen.tsx
- src/animations/useLightning.ts

Entregas:
- nome aparecendo letra por letra
- SVG inline de raio diagonal
- strokeDashoffset animado por GSAP
- fade out da tela
- callback/controlador para revelar o Hero

Validação:
- loading aparece ao abrir
- raio cruza a tela
- transição some em ~2.2s a 2.5s

---

## Bloco 5 — Hero
Objetivo: montar a primeira dobra com texto central e raios ambiente.

Arquivos:
- src/components/sections/Hero.tsx
- src/components/ui/LangToggle.tsx
- src/animations/useLightning.ts (parte ambiente, sem loop JS)
- src/config/contact.ts

Entregas:
- texto centralizado
- canto inferior esquerdo com contatos
- toggle PT/EN no topo direito
- 6 a 8 raios ambiente com opacidade mínima e CSS pulse

Validação:
- texto legível desktop/mobile
- raios não atrapalham leitura
- links clicáveis

---

## Bloco 6 — Technologies
Objetivo: criar a seção de ícones soltos com modal.

Arquivos:
- src/components/sections/Technologies.tsx
- src/components/ui/TechModal.tsx
- src/animations/useFloatingIcons.ts

Entregas:
- sem grid e sem cards visíveis no idle
- ícones livres em posições semi-aleatórias controladas
- hover: pausa, amarelo, scale 1.15
- click: modal com AnimatePresence
- fechamento por clique fora e botão X

Validação:
- ícones realmente soltos
- hover e modal funcionando no browser
- responsivo mobile

---

## Bloco 7 — Footer
Objetivo: encerrar com estética sofisticada e contatos flutuantes.

Arquivos:
- src/components/sections/Footer.tsx
- src/config/contact.ts

Entregas:
- título grande PT/EN
- ícones de contato flutuando
- hover amarelo + pausa
- links corretos
- copyright final

Validação:
- todos os links abrem corretamente
- hover visual correto

---

## Bloco 8 — App orchestration
Objetivo: juntar tudo com transições consistentes.

Arquivos:
- src/App.tsx
- src/main.tsx

Entregas:
- ordem: LoadingScreen → Hero → Technologies → Footer
- estado global simples para idioma PT/EN
- sem dependências desnecessárias

Validação:
- fluxo completo carregando sem erros no console

---

## Bloco 9 — QA final e build Cloudflare
Objetivo: fechar para deploy estático no Cloudflare Pages.

Checklist:
- `npm run build`
- confirmar `dist/`
- `npm run preview`
- verificar no browser:
  - loading aparece
  - raio do loading funciona
  - hero legível
  - raios sutis
  - techs soltas
  - hover amarelo
  - modal abre/fecha
  - footer flutuante
  - links ok
  - mobile ok

Deploy Cloudflare Pages:
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

---

## Comandos-alvo do fluxo local
- subir: `npm run dev:fresh`
- desligar: `npm run dev:stop`
- build: `npm run build`
- preview do build: `npm run preview`

## Observações importantes
- O projeto anterior em Next não deve ser aproveitado estruturalmente.
- O briefing v2 invalida next-intl, App Router e output export do Next.
- A nova referência de deploy é Cloudflare Pages servindo `dist/`, não `out/`.
