# Política de Segurança

## Escopo

Este repositório mantém o portfólio estático MoreiraGabryel em React, Vite e TypeScript.

A aplicação não deve exigir segredos, tokens ou chaves para build, preview ou deploy estático.

## Versões suportadas

| Branch | Suporte |
| --- | --- |
| `main` | Suportada |
| demais branches | Uso temporário para PRs |

## Relato de vulnerabilidade

Se encontrar uma falha de segurança:

1. Abra uma issue privada, se o GitHub permitir.
2. Se não houver issue privada disponível, reporte com o mínimo de detalhe explorável.
3. Não publique tokens, chaves, payloads sensíveis ou dados pessoais.

Inclua, quando possível:

- área afetada;
- passos de reprodução seguros;
- impacto esperado;
- versão/commit analisado.

## Higiene de segurança

Antes de publicar ou fazer deploy:

```bash
npm run verify
```

Esse gate executa:

- lint;
- testes focados do viewport, contador e pacote Cloudflare;
- auditoria de dependências com `npm audit --audit-level=moderate`;
- typecheck e build de produção.

## Segredos

Arquivos `.env*`, credenciais, certificados e chaves privadas são ignorados pelo Git.

O arquivo `.env.example` deve conter apenas exemplos sem valor real.

## Pacote de publicação

O pacote da branch `main-build` não deve conter Markdown interno, fontes, source maps, bancos locais, credenciais ou relatórios de auditoria. O D1 é vinculado no servidor da Cloudflare, sem chave de administração no frontend. Os comandos de regeneração e os limites do contador público estão em `docs/cloudflare-deployment.md`.

Manter o pacote limpo não elimina informações que já estejam em commits antigos ou outras branches públicas. Se um segredo real for encontrado, revogue/rotacione a credencial antes de avaliar uma reescrita coordenada do histórico; apagar um arquivo não revoga acesso.
