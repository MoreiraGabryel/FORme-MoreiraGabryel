# Auditoria do fluxo visual e das transições de scroll

## Escopo

Auditoria e correção do fluxo entre Loading, Hero/Cena 1, pausa preta, Cena 2 e nascimento dos ícones na branch `feat/loading-603010-transition`.

A alteração preexistente em `src/components/sections/LoadingScreen.tsx` foi preservada e não pertence a esta correção. Nenhum commit, push ou staging foi executado.

## Sequência visual vigente

```text
Loading
→ Hero / Cena 1
→ saída cinematográfica da Cena 1
→ pausa preta real
→ revelação da Cena 2
→ nascimento dos ícones
→ saída gradual dos ícones
→ cards About
→ fake footer com vídeo em loop
→ blackout de saída
→ footer verdadeiro preto
```

## Assets

| Responsabilidade | Asset | Dimensões |
| --- | --- | ---: |
| Cena 1 / Hero | `/media/scene-0.webp` | 1280×720 |
| Cena 2 / tecnologias e cards | `/media/scene-1.webp` | 1280×720 |
| Fake footer | `/media/stage3-tunnel-loop.mp4` | vídeo em loop |
| Uso futuro preservado | `/media/stage3-tunnel.mp4` | vídeo |

`scene-2.webp` e `scene-3.webp` permanecem fisicamente no repositório, mas não participam do fluxo atual. Nenhum asset foi criado, renomeado ou substituído.

## Regressão observada no mobile

As capturas enviadas pelo proprietário mostravam:

- `scene-0.webp`: nave diante de um vórtice, com feixe amarelo;
- `scene-1.webp`: vórtice sem a nave;
- marca global persistente;
- ausência de ícones e conteúdo durante uma distância grande de scroll.

### Medição anterior à correção — viewport 390×844

A árvore possuía cinco blocos principais:

| Bloco | Início | Fim | Altura |
| --- | ---: | ---: | ---: |
| Hero pin spacer | 0 | 2194 | 2194 px |
| Transição cinematográfica duplicada | 2194 | 4895 | 2701 px |
| Tecnologias/About | 4895 | 11816 | 6921 px |
| Fake footer | 11816 | 14897 | 3081 px |
| Footer verdadeiro | 14897 | 15741 | 844 px |

A inspeção por scroll confirmou:

- Hero sem conteúdo ainda expondo Cena 1;
- a seção intermediária fazendo Cena 1 reaparecer, depois preto, depois Cena 2;
- Cena 2 permanecendo sozinha antes do primeiro ícone;
- primeiro ícone perceptível apenas próximo de `scrollY = 5500`.

O usuário percorria aproximadamente 1600 px de Cena 1 vazia e 1400 px de Cena 2 vazia no mobile.

## Causa raiz

Não era o Loading e já não era o antigo `SceneCrossfade` isoladamente. A regressão vinha da composição de três controladores consecutivos:

1. `HeroIntro` já encerrava sua interface e preparava a saída para preto;
2. `SceneOneToSceneTwoTransition` montava novamente `scene-0.webp`, criava outro preto e depois montava `scene-1.webp`;
3. `TechnologyAndAboutStage` montava novamente `scene-1.webp` antes do nascimento dos ícones.

Cada seção pinada também preservava uma viewport natural no fluxo. Isso transformava movimentos sutis em longas telas aparentemente estáticas.

Havia ainda uma concorrência interna na Hero:

- um tween levava `--hero-handoff` a `0.72` até o tempo `1.04`;
- o reset para `0` terminava antes, no tempo `1.02`;
- o primeiro tween voltava a vencer e deixava um feixe amarelo sobre a pausa preta.

## Arquitetura atual — um proprietário por fronteira

| Fronteira/etapa | Proprietário | Responsabilidade |
| --- | --- | --- |
| Loading → Hero | `LoadingScreen` / `App` | concluir Loading e liberar a página |
| Cena 1 → preto | `HeroIntro` | zoom/escurecimento, saída da UI e fade reversível da mídia |
| Preto → Cena 2 | `TechnologyAndAboutStage` | revelar `scene-1.webp` de escala ampliada para escala 1 |
| Cena 2 → ícones → cards | `TechnologyAndAboutStage` | nascimento, drift, saída dos ícones e entrada dos cards |
| Cards → fake footer | `FakeFooterStage` | handoff para vídeo e encerramento imersivo |
| Fake footer → preto | `fake-footer-exit-blackout` | blackout de saída, não um footer semântico |
| Footer final | `FutureFooterStage` | seção preta independente para design futuro |

`SceneOneToSceneTwoTransition` foi removido da composição e do código. Seus seletores CSS também foram removidos.

## Comportamento implementado

### Hero / Cena 1

No fim da timeline:

- a mídia recebe zoom final moderado;
- brilho e saturação diminuem;
- mídia e overlay chegam a `autoAlpha: 0`;
- o fundo estrutural preto fica exposto;
- o comportamento é reversível pelo scroll.

O tween de `--hero-handoff` agora termina antes do reset, impedindo o feixe residual.

### Cena 2 e ícones

`TechnologyAndAboutStage` inicia com:

- Cena 2 em `autoAlpha: 0`;
- escala `1.2` no mobile e `1.45` no desktop;
- blur e brilho reduzido;
- fundo estrutural preto.

A mesma timeline revela Cena 2 rapidamente para opacidade 1 e escala 1. O primeiro ícone só começa após a imagem estar visualmente resolvida.

## Medição posterior — viewport 390×844

A árvore passou a quatro blocos:

| Bloco | Início | Fim | Altura |
| --- | ---: | ---: | ---: |
| Hero pin spacer | 0 | 2194 | 2194 px |
| Tecnologias/About | 2194 | 9115 | 6921 px |
| Fake footer | 9115 | 12196 | 3081 px |
| Footer verdadeiro | 12196 | 13040 | 844 px |

Estados medidos:

| scrollY | Cena 1 | Cena 2 | Ícones | Resultado |
| ---: | ---: | ---: | ---: | --- |
| 1350 | 0 / hidden | 0 | 0 | preto real |
| 2194 | 0 | 0, escala 1.2 | 0 | início da revelação |
| 2600 | 0 | 0.835, escala 1.033 | 0 | Cena 2 quase resolvida |
| 2700 | 0 | 1, escala 1 | 0.094 | nascimento inicia |
| 2800 | 0 | 1, escala 1 | 0.244 | quatro ícones surgindo |
| 3400 | 0 | 1, escala 1 | 0.694 | doze ícones visíveis |

No scroll reverso para `2194`, Cena 2 retorna a opacidade 0/escala 1.2 e todos os ícones retornam a zero. Ao avançar novamente, o nascimento é reproduzido.

## Validação executada após a correção

- `npx tsc --noEmit`: aprovado.
- `npm run build`: aprovado; Vite concluiu em 1,34 s.
- `git diff --check`: aprovado.
- Console do navegador: zero mensagens e zero erros JavaScript.
- Mobile 390×844: pausa preta, Cena 2, nascimento dos ícones e reversão aprovados.
- Desktop 1280×577: pausa preta, Cena 2, nascimento dos ícones e reversão aprovados; primeiro nascimento medido com Cena 2 em opacidade 1 e escala 1.
- Scroll rápido e repetição forward/reverse: aprovados.
- Overflow horizontal mobile e desktop: 0 px.
- Imagens de cena no DOM após a Hero: somente `/media/scene-1.webp`, carregada em 1280 px de largura natural.
- `.cinematic-transition`: zero elementos.
- Prévia local: HTTP 200.
- Prévia pública Cloudflare: HTTP 200.

## Higiene e publicação

- Nenhum commit, push ou staging foi realizado.
- `LoadingScreen.tsx` continua sendo uma alteração preexistente separada.
- Os componentes renomeados/novos ainda precisam ser adicionados explicitamente em um futuro commit autorizado; não usar apenas `git add -u`.
- `.gitignore` cobre build, dependências, ambientes, caches e artefatos locais de agentes.
- `public/media/stage3-tunnel.mp4` permanece preservado para uso futuro.

## Limitações

- Safari mobile físico não está disponível neste ambiente; a correção foi validada em Chromium usando viewport móvel isolada de 390×844.
- A marca global permanece visível durante a pausa preta por ser navegação persistente preexistente. Nenhuma imagem de cena ou feixe permanece visível.
