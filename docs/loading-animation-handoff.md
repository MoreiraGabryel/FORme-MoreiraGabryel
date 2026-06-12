# Loading Animation Handoff

Data: `2026-06-11`

## Objetivo

Este documento orienta a proxima pessoa/IA responsavel por manter ou refinar a animacao de loading do portfolio.

A direcao atual ja nao usa mais o conceito literal de raio. O loading foi traduzido para uma linguagem mais premium/optica, mantendo a ideia de energia nascendo no `i` e se espalhando pelo nome.

## Fonte de verdade visual

- Design Canva: `MoreiraGabryel`
- ID do design: `DAHMSNgrySM`
- Link de edicao conhecido: `https://www.canva.com/d/t-1jIGiZez60yHn`

## Regra principal

O Canva continua definindo a narrativa visual geral, mas a implementacao atual traduz essa narrativa para uma solucao original de motion design.

A implementacao no site deve:

- preservar a ordem dos beats visuais;
- preservar o `i` como ponto de ruptura e origem da energia;
- preservar a sensacao de glow/flash antes da abertura do site;
- preservar a energia percorrendo o lettering;
- usar os slides como storyboard, nao como copia literal.

Nao fazer nesta etapa:

- nao voltar para um raio literal ou clipart;
- nao copiar tipografia, composicao ou assinatura visual de referencia externa;
- nao simplificar a sequencia para uma animacao generica;
- nao desconectar os efeitos de energia do lettering.

## Sequencia aprovada

### Beat 1

`MoreiraGabryel` aparece como protagonista, escrito letra por letra, com trilho de progresso e status tecnico.

Leitura:

- tela inicial limpa e controlada;
- loading com sensacao de sistema premium;
- foco total no nome.

### Beat 2

O `i` deixa de ser apenas caractere e entra em transmutacao.

Leitura:

- o `i` perde solidez tipografica;
- surge um conjunto optico/luminoso no mesmo slot;
- esse e o primeiro evento especial da sequencia.

### Beat 3

O novo `i` prismático energiza o restante do lettering.

Leitura:

- a energia nasce no `i`;
- o brilho se propaga para as letras vizinhas por proximidade;
- o nome entra em estado energizado sem perder legibilidade.

### Beat 4

O palco inteiro entra em tensao para o payoff final.

Leitura:

- glow de palco aumenta;
- o wordmark ganha presenca e micro aproximacao;
- o status/trilho cedem protagonismo para o reveal.

### Beat 5

Flash, abertura luminosa e saida para a interface principal.

Leitura:

- o prisma do `i` faz o ultimo bloom;
- o aperture abre a transicao;
- o loading entrega a tela principal com sensacao cinematica/premium.

## Implementacao atual

Arquivo principal:

- `F:/Repositório-Pessoal/src/components/sections/LoadingScreen.tsx`

Estruturas-chave do `i` na versao atual:

- `iFocusRef`: halo focal suave
- `iCoreRef`: ponto luminoso central
- `iStemRef`: haste vertical energizada
- `iPrismRef`: prisma facetado principal
- `iEchoRef`: anel/eco de energia

Outras pecas importantes:

- escrita letra por letra com `writeHeadRef`
- trilho/progresso com `trackRef`, `fillRef` e `beamRef`
- glow de palco com `stageGlowRef`
- payoff final com `flashRef` e `apertureRef`

## Direcao de animacao

Quando alguem for refinar esta sequencia, a logica deve continuar assim:

1. mostrar o status e o nome sendo escrito lentamente;
2. destacar o `i` como pivot narrativo;
3. transmutar o `i` em um objeto luminoso/prismatico;
4. propagar energia do `i` para o restante do nome;
5. intensificar glow, foco e tensao de palco;
6. fazer o reveal final para entrada do site.

## Observacoes tecnicas

- GSAP continua sendo a ferramenta principal de coreografia.
- O efeito precisa parecer premium e controlado, nunca aleatorio.
- Glow seletivo funciona melhor do que brilho exagerado em tudo.
- O `i` deve parecer integrado ao lettering, nao um overlay independente.
- O climax final deve favorecer leitura de transicao, nao ruido visual.

## Debug / review

URLs uteis para revisar a sequencia:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/?loading-slow=0.3&loading-motion=1`
- `http://127.0.0.1:3000/?loading-slow=0.18&loading-motion=1`

## Instrucao para a proxima IA

Se voce estiver refinando esta sequencia:

- use o Canva como storyboard e clima geral;
- preserve o `i` como origem da energia;
- refine timing, glow, profundidade e reveal sem voltar para o conceito antigo de raio;
- valide sempre em runtime/localhost antes de declarar pronto.
