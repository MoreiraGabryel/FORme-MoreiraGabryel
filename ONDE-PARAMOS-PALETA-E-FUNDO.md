# Onde paramos — paleta cromática e fundo da Etapa 1

## Contexto
Estamos ajustando o portfólio MoreiraGabryel para aplicar uma estratégia cromática 60-30-10 reinterpretada a partir da paleta clássica do Batman dos quadrinhos, sem parecer tema literal.

Direção aprovada:
- 60% base escura carvão
- 30% profundidade estrutural azul-marinho
- 10% accent amarelo-ouro

Leitura desejada:
- premium
- técnica
- cinematográfica
- editorial
- high-contrast
- elegante
- autoral

## Arquivos principais alterados até agora

1. `src/index.css`
   - tokens semânticos da nova paleta
   - ajustes globais de superfícies, overlays, progress, hero, footer, cards e legal
   - ajustes específicos na hero para progress card, lang switch, overlays e micro accents

2. `src/components/sections/LoadingScreen.tsx`
   - loading recolorido para a nova paleta
   - beam/progress/scan com ouro controlado
   - fundo e atmosfera mais navy/carvão

3. `public/media/scene-0.webp`
   - imagem real da Etapa 1 substituída diretamente
   - mantém o mesmo caminho usado pelo app
   - convertida para WebP em 1280x720
   - usa a nova imagem enviada pelo usuário como fonte

## Último pedido do usuário
O usuário pediu para substituir a imagem de fundo da cena `scene-0` pela nova imagem enviada, sem quebrar o caminho usado pelo app e limpando vestígios da foto antiga.

`/home/moreiragabryel/Downloads/scena-0.png`

## O que foi feito por último
Foi substituído diretamente o arquivo:

`public/media/scene-0.webp`

Detalhes:
- fonte usada: `/home/moreiragabryel/Downloads/scena-0.png`
- saída: `public/media/scene-0.webp`
- dimensão final: `1280x720`
- formato final: WebP
- nenhum caminho em React/CSS precisou mudar

## Validação feita
- `npm run build` deve ser executado após a substituição
- site carregou usando `http://127.0.0.1:3000/media/scene-0.webp`

## Estado visual atual
O fundo da hero agora usa a nova imagem enviada como fonte da Etapa 1.

Pontos para revisar ao voltar:
1. abrir `http://127.0.0.1:3000/`
2. comparar a hero com `/home/moreiragabryel/Downloads/scena-0.png`
3. verificar se a foto não ficou escura demais sob os overlays
4. verificar se o título continua legível e premium
5. decidir se precisa de micro-ajuste no próprio `scene-0.webp` ou no overlay

## Importante
Não fazer redesign, não mexer em layout e não reabrir motion.
Se continuar, fazer apenas micro-refino visual no asset da Etapa 1 ou nos overlays que afetam essa imagem.

## Último diff stat observado
- `public/media/scene-0.webp | nova imagem 1280x720 WebP`
- `src/components/sections/LoadingScreen.tsx | 26 +--`
- `src/index.css | 374 +++++++++++++++++-------------`
- `3 files changed, 229 insertions(+), 171 deletions(-)`

## Comando de validação usado
`npm run build`
