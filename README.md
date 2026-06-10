# MoreiraGabryel Portfolio

Portfolio estático em Next.js 14 App Router + TypeScript, pronto para Cloudflare Pages.

## Stack

- Next.js 14 com `output: 'export'`
- TypeScript
- Tailwind CSS
- GSAP + @gsap/react + ScrollTrigger
- Lenis
- next-intl em rotas estáticas `/pt` e `/en`

## Cloudflare Pages

- Build command: `next build`
- Output directory: `out`
- Node version: 18+

## Arquivos editáveis pelo cliente

- `src/config/cursor-icons.ts`
- `src/config/projects.ts`
- `src/config/contact.ts`
- `src/i18n/pt.json`
- `src/i18n/en.json`
- `public/icons/*`
- `public/projects/project1.png`
- `public/projects/project2.png`

## Pendências de conteúdo

- Texto final da seção About
- Imagens finais dos projetos
- Lista final de Skills/tecnologias
- Elemento visual/arte/GIF da seção About
- Fonte final aprovada pelo cliente

## Segurança para GitHub

O `.gitignore` bloqueia `.env`, `.env.*`, certificados, chaves, tokens, caches, build local e `node_modules`.
