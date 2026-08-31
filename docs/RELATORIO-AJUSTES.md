# Relatório de ajustes — cena e cascata

Branch: `fix/ajustes-cena-e-cascata`

## Escopo preservado

- `src/components/sections/LoadingScreen.tsx` não foi alterado.
- CSS da tela de loading não foi alterado.
- `src/components/sections/AboutCardsStage.tsx` não foi alterado.
- Fluxo narrativo de `docs/VISAO-DO-PORTFOLIO.md` foi preservado.
- Mudanças limitaram-se a correção de handoff, limpeza CSS e fecho preto final.

## Itens validados

### 1. Camada dos ícones de tecnologia

Status: já resolvido no código atual; sem alteração nova.

Evidência:
- Browser smoke encontrou 16 `.technology-float-button` visíveis.
- Clique em botão de tecnologia abriu o modal corretamente.
- Modal abriu sem mudar `location.hash`.
- Console sem erro.

### 2. Modal acima da marca fixa

Status: já resolvido no código atual; sem alteração nova.

Evidência runtime:
- `.persistent-brand-lockup`: `z-index: 90`.
- `.technology-and-about-flow:has(.has-open-technology-card)`: `z-index: 100`.
- `.technology-modal-backdrop`: `z-index: 120`.
- `elementFromPoint` sobre a área da marca retornou `.technology-modal-backdrop` com modal aberto.
- A marca não ficou clicável por cima do modal.

### 3. Sobreposição Tecnologias → Sobre

Status: corrigido.

Commit:
- `1cc5623 corrige troca entre tecnologias e sobre`

Arquivos:
- `src/components/sections/TechnologyAndAboutStage.tsx`

O que mudou:
- Nomeei a janela de saída da etapa de tecnologias.
- A camada de tecnologias termina antes da entrada/interação da camada Sobre.
- `prefers-reduced-motion` foi mantido.

Evidência runtime:
- Em `target 0.96`, camada Sobre ainda sem pointer-events.
- Em `target 0.97`, tecnologias já saíram e Sobre passa a ser interativa.
- Console sem erro.

### 4. CSS morto do fake footer

Status: corrigido.

Commit:
- `6a77f2c limpa css morto do rodape falso`

Arquivo:
- `src/index.css`

O que mudou:
- Removi seletores `.fake-footer-*` sem uso no JSX atual.
- Consolidei bloco duplicado de `.fake-footer-left-column`.
- Mantive seletores usados por `FakeFooterStage.tsx`.
- Não alterei markup nem redesenhei o fake footer.

Evidência:
- Busca no componente confirmou uso real apenas dos seletores atuais do fake footer.
- `npm run lint` passou.
- `npm run build` passou.
- Screenshots atuais capturadas em:
  - `/tmp/forme-ajustes-screens/current-footer-desktop.png`
  - `/tmp/forme-ajustes-screens/current-footer-mobile.png`

### 5. Fecho preto final após `FakeFooterStage`

Status: corrigido.

Commit:
- `f9cebee adiciona fecho preto final`

Arquivos:
- `src/App.tsx`
- `src/index.css`

O que mudou:
- Adicionado `FinalBlackoutStage` logo após `FakeFooterStage`.
- Container identificável: `data-section="final-blackout"`.
- Tela final preta, sem texto.
- Comentário obrigatório incluído: `// TODO: animação autoral`.
- `z-index` do fecho garante que links do fake footer não fiquem clicáveis sobre a tela final.

Evidência runtime:
- `.final-blackout-stage` existe.
- `background: rgb(0, 0, 0)`.
- `min-height` igual à viewport.
- `elementFromPoint` no fim da página retorna `.final-blackout-stage`.
- Screenshots atuais capturadas em:
  - `/tmp/forme-ajustes-screens/current-final-desktop.png`
  - `/tmp/forme-ajustes-screens/current-final-mobile.png`

### 6. Seletor de idioma legal

Status: já resolvido no código atual; sem alteração nova.

Evidência:
- `src/components/legal/LegalPage.tsx` já usa `LanguageSwitch`.
- Browser smoke em `/privacy-policy` confirmou `.legal-top-actions .lang-switch` com botões `PT` e `EN`.
- Console sem erro.

### 7. Alvo real para `href="#home"`

Status: já resolvido no código atual; sem alteração nova.

Evidência:
- Marca fixa usa `href="#home"`.
- `<main id="home" className="site-shell">` existe.
- Browser smoke confirmou alvo real.

## Validações executadas

Baseline antes de qualquer mudança:
- `npm install` passou.
- `npm run build` passou.
- `npm run lint` passou.

Durante os commits:
- `git -c core.whitespace=cr-at-eol diff --check` passou.
- `npm run lint` passou.
- `npm run build` passou.

Browser/runtime:
- Home carregou em `http://127.0.0.1:3000/`.
- Modal de tecnologia validado acima da marca fixa.
- Handoff tecnologias/sobre validado por amostragem de scroll.
- Fecho preto final validado no fim do fluxo.
- Página legal `/privacy-policy` validada com `LanguageSwitch`.
- Console limpo nas validações executadas.

## Observação

`src/index.css` usa CRLF. Para evitar falso positivo de whitespace por carriage return, a checagem segura usada foi:

```bash
git -c core.whitespace=cr-at-eol diff --check
```
