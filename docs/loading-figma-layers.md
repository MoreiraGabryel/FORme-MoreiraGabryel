# Loading — estrutura de layers para montar no Figma

Data: `2026-06-22`

Objetivo:
Este arquivo organiza o loading atual em uma estrutura de camadas/layers para você montar no Figma com mais rapidez.

Importante:
- este arquivo não substitui os outros documentos
- ele serve como blueprint operacional
- foi feito com base no estado atual implementado em `src/components/sections/LoadingScreen.tsx`

Referências:
- `docs/loading-figma-base.md`
- `docs/loading-animation-handoff.md`
- `src/components/sections/LoadingScreen.tsx`

==================================================
1. ESTRUTURA GERAL DO ARQUIVO NO FIGMA
==================================================

Página sugerida:
- Loading

Frames sugeridos:
- 01_Base_Escura
- 02_Entrada_Painel
- 03_Preparacao_Nome
- 04_Escrita_Do_Nome
- 05_Nome_Completo
- 06_Pre_Reveal
- 07_Flash
- 08_Aperture
- 09_Home_Primeiro_Frame

Se quiser trabalhar tudo em um frame master:
- Loading_Master
  - use variantes/duplicações por etapa

==================================================
2. HIERARQUIA PRINCIPAL DE LAYERS
==================================================

Use esta árvore como base:

- Loading
  - Background
    - Base_Color
    - Radial_Glow_Back
    - Grid_Overlay
    - Radial_Mask
  - Stage_Effects
    - Stage_Glow
    - Flash
    - Aperture
  - Panel
    - Top_Status_Row
      - Status_Label
      - Progress_Number
    - Word_Area
      - Mid_Line_Glow
      - Write_Head
      - Wordmark
        - Letter_M
        - Letter_o
        - Letter_r
        - Letter_e
        - Letter_i
        - Letter_r_2
        - Letter_a
        - Letter_G
        - Letter_a_2
        - Letter_b
        - Letter_r_3
        - Letter_y
        - Letter_e_2
        - Letter_l
      - Flares
        - Flare_M
        - Flare_o
        - Flare_r
        - Flare_e
        - Flare_i
        - Flare_r_2
        - Flare_a
        - Flare_G
        - Flare_a_2
        - Flare_b
        - Flare_r_3
        - Flare_y
        - Flare_e_2
        - Flare_l
    - Progress_Track_Block
      - Track_Base
      - Track_Fill
      - Track_Beam

Observação importante:
- não criar um grupo especial para o `i`
- no estado atual, a letra `i` é uma letra normal do wordmark
- não usar prism, crystal, echo, core ou stem nessa versão atual

==================================================
3. ESPECIFICAÇÃO DE CADA BLOCO
==================================================

3.1 Background

- Base_Color
  - função: fundo principal do loading
  - cor: `#050608`

- Radial_Glow_Back
  - função: glow suave central para profundidade
  - leitura: brilho sutil, não dominante

- Grid_Overlay
  - função: textura técnica discreta
  - leitura: grade fina, quase invisível

- Radial_Mask
  - função: apagar a grade nas bordas e concentrar no centro

3.2 Stage_Effects

- Stage_Glow
  - função: glow do palco principal
  - cresce ao longo do loading
  - no final ganha mais presença

- Flash
  - função: estalo visual do clímax
  - breve
  - branco suave, sem estourar por muito tempo

- Aperture
  - função: camada branca de abertura final
  - faz a transição para a home

3.3 Panel

- Top_Status_Row
  - função: linha superior técnica
  - contém:
    - `Inicializando portfólio`
    - `%` de progresso

- Word_Area
  - função: área protagonista
  - contém o nome e os efeitos de escrita

- Progress_Track_Block
  - função: apoio técnico de progressão
  - reforça sensação de sistema/loading premium

==================================================
4. ESTRUTURA DETALHADA DO WORDMARK
==================================================

Grupo:
- Wordmark

Conteúdo:
- Letter_M
- Letter_o
- Letter_r
- Letter_e
- Letter_i
- Letter_r_2
- Letter_a
- Letter_G
- Letter_a_2
- Letter_b
- Letter_r_3
- Letter_y
- Letter_e_2
- Letter_l

Regras visuais:
- todas as letras seguem a mesma lógica visual
- branco principal
- começam com menos opacidade
- começam com blur/clip de entrada
- vão para branco legível e limpo

Regra do `i`:
- manter como letra normal
- sem elemento cristalino
- sem símbolo solto
- sem overlay especial em cima da letra

==================================================
5. ESTRUTURA DOS FLARES
==================================================

Grupo:
- Flares

Itens:
- Flare_M
- Flare_o
- Flare_r
- Flare_e
- Flare_i
- Flare_r_2
- Flare_a
- Flare_G
- Flare_a_2
- Flare_b
- Flare_r_3
- Flare_y
- Flare_e_2
- Flare_l

Função:
- flare sutil por trás de cada letra
- reforça a sensação de escrita premium
- não deve parecer explosão
- deve ser mais apoio óptico do que protagonista

==================================================
6. ESTRUTURA DA BARRA DE PROGRESSO
==================================================

Grupo:
- Progress_Track_Block

Itens:
- Track_Base
  - trilho base discreto

- Track_Fill
  - preenchimento principal
  - vai de 0% a 100%

- Track_Beam
  - beam luminoso que corre no progresso
  - aparece durante a escrita
  - perde presença perto do final

==================================================
7. ESTRUTURA POR FRAME
==================================================

7.1 Frame 01 — Base escura

Layers visíveis:
- Background
  - Base_Color
  - Radial_Glow_Back
  - Grid_Overlay
  - Radial_Mask

Layers ocultas ou muito discretas:
- Panel
- Stage_Glow
- Flash
- Aperture

Objetivo:
- preparar o palco

7.2 Frame 02 — Entrada do painel

Layers visíveis:
- Background
- Panel
  - Top_Status_Row
  - Word_Area
  - Progress_Track_Block

Estado:
- panel ainda com leve blur residual
- status e progresso já aparecem
- nome ainda não totalmente legível

7.3 Frame 03 — Preparação do nome

Layers visíveis:
- Background
- Stage_Glow (baixo)
- Panel completo
- Write_Head
- Wordmark
- Flares quase invisíveis

Estado:
- letras ainda semi ocultas
- write head preparado para atravessar o nome

7.4 Frame 04 — Escrita do nome

Layers visíveis:
- tudo do frame 03
- Track_Fill crescendo
- Track_Beam ativo
- Flares aparecendo por letra

Estado:
- letras surgindo em sequência
- progresso aproximado: até ~68%

7.5 Frame 05 — Nome completo

Layers visíveis:
- Wordmark completo
- Flares já perdendo força
- Write_Head saindo
- Track_Fill em ~86%
- Stage_Glow um pouco mais forte

Estado:
- nome 100% legível
- sem efeito especial no `i`

7.6 Frame 06 — Pré-reveal

Layers visíveis:
- Wordmark completo
- Track_Fill em 100%
- Track_Beam quase saindo
- Stage_Glow forte
- Top_Status_Row menos protagonista

Estado:
- micro aproximação do painel/wordmark
- tensão final antes do flash

7.7 Frame 07 — Flash

Layers visíveis:
- Flash
- Wordmark ainda perceptível por um instante
- Stage_Glow forte

Estado:
- estalo visual curto

7.8 Frame 08 — Aperture

Layers visíveis:
- Aperture dominante
- loading cedendo espaço

Estado:
- abertura luminosa
- transição para a home

7.9 Frame 09 — Home primeiro frame

Layers visíveis:
- primeiro frame da home

Estado:
- loading já saiu
- sem resíduos de overlay

==================================================
8. TIMINGS ATUAIS PARA ANOTAR NO FIGMA
==================================================

Desktop atual aproximado:
- início da escrita: `0.18s`
- fim da escrita: `1.53s`
- hold: `1.69s`
- início do fade/reveal: `1.95s`
- fallback total: `2.47s`

Referências de progresso:
- durante escrita: ~`68%`
- nome completo estabilizando: ~`86%`
- clímax final: `100%`

==================================================
9. O QUE NÃO COLOCAR NESSA VERSÃO
==================================================

Não colocar:
- cristal no `i`
- prisma no `i`
- bolt/raio no `i`
- anel/echo especial do `i`
- point core especial do `i`
- haste luminosa separada só no `i`

Porque:
- isso fazia parte da direção anterior
- a versão atual foi simplificada para deixar só o nome aparecendo

==================================================
10. CHECKLIST RÁPIDO DE MONTAGEM
==================================================

Checklist:
- criar 9 frames principais
- montar a árvore de layers conforme este arquivo
- manter `MoreiraGabryel` como protagonista
- manter o `i` como letra normal
- criar flare discreto para todas as letras
- criar trilho + fill + beam
- criar stage glow separado do background
- criar flash separado do aperture
- definir em cada frame o estado de opacidade/blur/escala

==================================================
11. SUGESTÃO DE NOMES PADRONIZADOS
==================================================

Frames:
- 01_Base_Escura
- 02_Entrada_Painel
- 03_Preparacao_Nome
- 04_Escrita_Do_Nome
- 05_Nome_Completo
- 06_Pre_Reveal
- 07_Flash
- 08_Aperture
- 09_Home_Primeiro_Frame

Grupos:
- Background
- Stage_Effects
- Panel
- Top_Status_Row
- Word_Area
- Wordmark
- Flares
- Progress_Track_Block

==================================================
12. OBSERVAÇÃO FINAL
==================================================

Este arquivo foi pensado para você abrir o Figma e montar a estrutura rapidamente sem depender de lembrar o loading inteiro de cabeça.

Se quiser, no próximo passo eu posso gerar uma versão ainda mais prática:
- uma tabela `Layer | Função | Visível em quais frames`

Isso ajuda bastante quando você quer montar rápido e não se perder nas etapas.