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
- `npm run dev:fresh` libera a porta 3000, limpa o cache do Vite e inicia o servidor
- `npm run dev:stop` encerra um processo Node/Vite ouvindo na porta 3000
- `npm run build` remove `dist/`, executa o typecheck e gera um build novo
- `npm run preview` serve o build em `http://127.0.0.1:4173`

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20+

## Estrutura

- `src/App.tsx` contem a composicao visual atual da pagina
- `src/components/sections/` guarda secoes e experiencias reutilizaveis
- `src/config/` centraliza dados editaveis do portfolio
- `src/i18n/` centraliza textos PT/EN para fases futuras
- `public/icons/` guarda icones estaticos
- `public/projects/` guarda assets de projetos

## Cuidados de manutencao

- Preserve caminhos relativos para assets em `public/`
- Evite versionar builds gerados em `dist/`
- Antes de publicar, rode `npm run build` e confira o preview local
- Mantenha a base leve: adicione bibliotecas apenas quando houver ganho real
