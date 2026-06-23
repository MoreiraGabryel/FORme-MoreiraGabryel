# Loading — documento base para reconstrução no Figma

Data: `2026-06-22`

Objetivo:
Este documento serve como base visual para você continuar o loading no Figma a partir do estado atual implementado no projeto, sem apagar a documentação já existente.

Importante:
- este documento não substitui `docs/loading-animation-handoff.md`
- ele organiza o loading atual em etapas estáticas, para facilitar ajustes visuais e de animação
- a base abaixo descreve o que existe hoje no código
- a partir daqui, você pode alterar no Figma da etapa onde parou

Arquivos de referência atuais:
- `src/components/sections/LoadingScreen.tsx`
- `docs/loading-animation-handoff.md`

URL de revisão:
- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/?loading-slow=0.3&loading-motion=1`
- `http://127.0.0.1:3000/?loading-slow=0.18&loading-motion=1`

## Resumo do estado atual

O loading atual, depois do ajuste mais recente, está assim:
- fundo escuro premium com glow central e grade sutil
- status técnico no topo do bloco: `Inicializando portfólio`
- percentual numérico à direita
- nome `MoreiraGabryel` aparecendo letra por letra
- sem efeito especial isolado na letra `i`
- trilho de progresso horizontal abaixo do nome
- beam luminoso atravessando o trilho durante a escrita
- glow de palco crescendo no final
- flash + aperture branco para entregar a home

## Estrutura visual atual

### Camadas de fundo
1. Fundo base escuro: `#050608`
2. Glow radial central suave
3. Grade sutil com máscara radial
4. Glow de palco central (`stageGlowRef`)
5. Flash final (`flashRef`)
6. Aperture branco final (`apertureRef`)

### Bloco principal
1. Linha superior com:
   - status: `Inicializando portfólio`
   - progresso: `0%` até `100%`
2. Área central do nome
3. Barra/trilho de progresso inferior

### Elementos do nome
Cada letra de `MoreiraGabryel` tem:
- o caractere principal
- um flare luminoso discreto por trás

Observação importante:
- a letra `i` hoje não possui prisma, cristal, stem, core nem eco isolado
- ela aparece como letra normal, igual à lógica das demais letras

## Timings atuais implementados

Desktop atual:
- início da escrita: ~`0.18s`
- término da escrita: ~`1.53s`
- hold: ~`1.69s`
- fade/start do reveal: ~`1.95s`
- fallback total: ~`2.47s`

Comportamento responsivo:
- mobile usa stagger e duração de letras um pouco maiores
- reduced motion usa uma versão mais curta e simplificada

## Mapa de etapas para montar no Figma

Abaixo está a decomposição sugerida em frames/etapas estáticas.

---

## Etapa 1 — Tela base vazia

Objetivo:
Estabelecer o palco do loading antes da leitura principal.

O que deve existir:
- fundo `#050608`
- glow radial muito suave ao centro
- grade bem discreta ao fundo
- nada ainda com protagonismo forte

Leitura visual:
- ambiente escuro, premium, técnico
- sensação de profundidade e silêncio visual

Anotações de motion:
- esta etapa praticamente só prepara o palco
- o brilho ainda está contido

---

## Etapa 2 — Entrada do painel

Objetivo:
Apresentar a UI do loading.

O que deve existir:
- status `Inicializando portfólio`
- percentual começando em `0%`
- painel central surgindo com blur reduzindo
- nome ainda não totalmente revelado
- trilho de progresso ainda discreto

Leitura visual:
- interface de sistema refinada
- promessa de carregamento controlado

Anotações de motion:
- painel sobe levemente
- blur some
- textos ganham legibilidade

---

## Etapa 3 — Preparação da escrita do nome

Objetivo:
Preparar o lettering como protagonista.

O que deve existir:
- `MoreiraGabryel` centralizado
- letras ainda parcialmente ocultas
- baixa opacidade inicial
- leve blur nas letras
- cursor vertical luminoso (`writeHead`)
- barra de progresso já visível, mas ainda no começo

Leitura visual:
- o nome vai ser “escrito” ou revelado
- o foco é totalmente o lettering

Anotações de motion:
- o `writeHead` inicia da esquerda
- as letras ainda estão “presas” por clip/reveal

---

## Etapa 4 — Escrita principal do nome

Objetivo:
Mostrar a formação do nome letra por letra.

O que deve existir:
- letras surgindo em sequência
- cada letra clareando de um branco parcial para branco cheio
- flare suave por trás de cada letra
- `writeHead` avançando horizontalmente
- barra de progresso indo até aproximadamente `68%`
- beam de progresso cruzando o trilho

Leitura visual:
- escrita premium, precisa e limpa
- nome como protagonista absoluto

Anotações de motion:
- stagger atual no desktop é curto e direto
- o flare é sutil, não explosivo
- a letra `i` não tem tratamento isolado nesta versão atual

---

## Etapa 5 — Nome completo estabilizado

Objetivo:
Mostrar o wordmark completo já legível.

O que deve existir:
- `MoreiraGabryel` completo
- branco principal com leve brilho óptico
- flares já perdendo força
- `writeHead` quase saindo de cena
- progresso sobe para aproximadamente `86%`
- glow de palco começa a aumentar

Leitura visual:
- fase de confirmação
- o loading já “venceu” a parte principal

Anotações de motion:
- essa etapa hoje substitui o antigo momento especial do `i`
- não existe mais cristal/prisma isolado

---

## Etapa 6 — Tensão final / pré-reveal

Objetivo:
Preparar a transição cinematográfica para a home.

O que deve existir:
- nome ainda central
- glow geral mais forte
- barra indo para `100%`
- beam perdendo presença e saindo
- painel e wordmark fazem uma micro aproximação/escala
- status perde protagonismo

Leitura visual:
- clímax controlado
- energia acumulada para a abertura final

Anotações de motion:
- aqui o brilho cresce mais no palco do que nas letras isoladas
- a leitura ainda deve permanecer limpa

---

## Etapa 7 — Flash

Objetivo:
Criar o estalo visual antes da abertura.

O que deve existir:
- flash branco suave e central
- intensidade breve, não chapada
- ainda com leitura do centro da tela

Leitura visual:
- payoff curto
- sensação de passagem de estado

Anotações de motion:
- o flash entra e sai rápido
- ele não deve apagar completamente a composição por muito tempo

---

## Etapa 8 — Aperture / abertura para a home

Objetivo:
Abrir a transição final.

O que deve existir:
- camada branca expandindo em abertura vertical ampla
- loading já cedendo espaço
- composição central dissolvendo

Leitura visual:
- revelação premium
- transição contínua para o site

Anotações de motion:
- a abertura vem do `apertureRef`
- o container inteiro do loading também perde opacidade, escala e ganha leve blur

---

## Etapa 9 — Primeiro frame da home já visível

Objetivo:
Definir o estado de entrega.

O que deve existir:
- hero principal do site já perceptível
- loading totalmente fora da frente
- sem resíduos de overlay

Leitura visual:
- fim do ritual de entrada
- início da navegação normal

---

## Componentes que existem hoje no código

### Texto/status
- `Inicializando portfólio`
- número percentual dinâmico

### Nome principal
- `MoreiraGabryel`
- letras individuais com reveal
- flare luminoso discreto por letra

### Barra de progresso
- trilho base (`trackRef`)
- preenchimento (`fillRef`)
- beam luminoso (`beamRef`)

### Efeitos de palco
- glow radial central (`stageGlowRef`)
- flash final (`flashRef`)
- aperture branco (`apertureRef`)

### Elementos que NÃO fazem mais parte da versão atual
- `iFocusRef`
- `iCoreRef`
- `iStemRef`
- `iPrismRef`
- `iEchoRef`

Esses elementos pertenciam à linha visual em que o `i` virava um elemento prismático isolado. No estado atual isso foi removido para deixar apenas o nome aparecendo.

## Recomendação de frames no Figma

Sugestão prática de organização:
- Frame 01 — Base escura
- Frame 02 — Painel/status entra
- Frame 03 — Nome preparado para escrita
- Frame 04 — Escrita em andamento
- Frame 05 — Nome completo
- Frame 06 — Pré-reveal / glow final
- Frame 07 — Flash
- Frame 08 — Aperture
- Frame 09 — Primeiro frame da home

## Recomendação de anotações por frame

Em cada frame do Figma, registrar:
- objetivo da etapa
- duração estimada
- opacidade dos principais elementos
- blur
- escala
- glow
- progresso da barra
- observações do que não deve existir

Exemplo de anotação útil:
- `Etapa 5: nome 100% legível, sem prisma no i, barra ~86%, glow moderado, writeHead já saindo`

## O que preservar se você for continuar do ponto onde parou

Preservar:
- o nome como protagonista
- a escrita letra por letra
- a barra como apoio técnico
- o reveal final com flash + aperture
- a sensação premium/escura

Não considerar como obrigatório daqui para frente:
- o antigo efeito especial do `i`

## Observação final

Este documento foi feito para facilitar sua continuação no Figma a partir da implementação atual, sem apagar o histórico anterior. Se depois você quiser, posso também gerar uma versão 2 deste documento em formato de checklist visual enxuto, própria para copiar e colar dentro do Figma como notas.