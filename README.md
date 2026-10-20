# MoreiraGabryel Portfolio

Portfolio estatico em React + Vite + TypeScript, preparado para deploy no Cloudflare Pages.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- GSAP para animacoes pontuais

## Scripts

- `npm run dev` inicia o Vite em `http://127.0.0.1:3000`
- `npm run dev:counter` inicia a API/D1 local do contador em `http://127.0.0.1:8788`; mantenha junto do Vite para revisar o contador sem build
- `npm run test:counter` verifica o contador, sua integração e a política de uma entrada por documento
- `npm run dev:fresh` libera a porta 3000, limpa o cache do Vite e inicia o servidor
- `npm run dev:stop` encerra um processo Node/Vite ouvindo na porta 3000
- `npm run lint` valida o código com ESLint
- `npm run security:audit` valida dependências com `npm audit --audit-level=moderate`
- `npm run build` remove `dist/`, executa o typecheck e gera um build novo
- `npm run verify` executa lint, auditoria de dependências e build
- `npm run preview` serve o build em `http://127.0.0.1:4173`

Observacao:
- `dev:fresh` e `dev:stop` agora funcionam em Linux e Windows
- em Linux, rode o projeto a partir de um filesystem nativo; evitar `node_modules` em particoes exFAT/NTFS montadas externamente

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22+ (alinhar com o CI em `.github/workflows/quality-gate.yml`)
- `wrangler.jsonc` (`not_found_handling: single-page-application`) faz o fallback SPA para as rotas legais funcionarem em acesso direto
- `public/_headers` define cabecalhos de seguranca e cache dos assets
- O contador da Hero usa `_worker.js` e um binding D1 chamado `VISITOR_COUNTER_DB`. Configuração única e prévia sem build: [docs/hero-visitor-counter.md](docs/hero-visitor-counter.md).
- `main-build` contém apenas o pacote final, sem fontes ou documentação interna. Empacotamento, domínio e configuração do banco: [docs/cloudflare-deployment.md](docs/cloudflare-deployment.md).
- Para gerar uma pasta nova e mínima após `npm run verify`: `npm run release:cloudflare -- build/cloudflare-release`.

## Estrutura

- `src/App.tsx` contem a composicao visual atual da pagina
- `src/components/sections/` guarda secoes e experiencias reutilizaveis
- `src/config/` centraliza dados editaveis do portfolio
- `src/i18n/` centraliza textos PT/EN para fases futuras
- `public/icons/` guarda icones estaticos
- `public/media/` guarda imagens e videos usados nas cenas



## Licença

Copyright © 2026 MoreiraGabryel. Todos os direitos reservados. O código é público apenas para visualização e estudo pessoal; cópia, modificação, redistribuição, uso comercial e treinamento de modelos de IA exigem autorização por escrito. Detalhes em [LICENSE](LICENSE).
