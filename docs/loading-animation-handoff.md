# Loading Animation Handoff

Data: `2026-06-11`

## Objetivo

Este documento orienta a proxima pessoa/IA responsavel por manter ou refinar a animacao de loading do portfolio.

A direcao atual ja nao usa mais o conceito literal de raio. O loading foi traduzido para uma linguagem mais premium/optica, tratando o wordmark inteiro como protagonista e evitando qualquer evento especial isolado na letra `i`.

## Fonte de verdade visual

- Design Canva: `MoreiraGabryel`
- ID do design: `DAHMSNgrySM`
- Link de edicao conhecido: `https://www.canva.com/d/t-1jIGiZez60yHn`

## Regra principal

O Canva continua definindo o clima geral e a ordem dos beats, mas a implementacao atual traduziu a sequencia para uma linguagem mais limpa, premium e controlada.

A implementacao no site deve:

- preservar a ordem dos beats visuais;
- preservar o nome `MoreiraGabryel` como protagonista absoluto;
- preservar a sensacao de glow/flash antes da abertura do site;
- preservar a energia percorrendo o lettering como um todo, sem transformar uma letra isolada em efeito separado;
- usar os slides como storyboard, nao como copia literal.

Nao fazer nesta etapa:

- nao voltar para um raio literal ou clipart;
- nao copiar tipografia, composicao ou assinatura visual de referencia externa;
- nao simplificar a sequencia para uma animacao generica;
- nao reintroduzir prisma, cristal, stem, core ou eco isolados na letra `i`.

## Sequencia aprovada

### Beat 1

`MoreiraGabryel` aparece como protagonista, escrito letra por letra, com trilho de progresso e status tecnico.

Leitura:

- tela inicial limpa e controlada;
- loading com sensacao de sistema premium;
- foco total no nome.

### Beat 2

O wordmark entra em escrita controlada, com reveal sequencial e flare discreto por letra.

Leitura:

- cada letra sai de baixa opacidade e blur leve para branco limpo;
- o `writeHead` avanca junto da escrita;
- nao existe evento especial isolado no `i`.

### Beat 3

O nome completo estabiliza e a barra consolida o progresso.

Leitura:

- o brilho permanece contido e tecnico;
- o lettering ganha presenca sem perder legibilidade;
- a barra e o percentual parecem conectados ao mesmo sistema visual.

### Beat 4

O palco inteiro entra em tensao para o payoff final.

Leitura:

- glow de palco aumenta;
- o wordmark ganha presenca e micro aproximacao;
- o status/trilho cedem protagonismo para o reveal.

### Beat 5

Flash, abertura luminosa e saida para a interface principal.

Leitura:

- o flash acontece de forma breve e controlada;
- o aperture abre a transicao;
- o loading entrega a tela principal com sensacao cinematica/premium.

## Implementacao atual

Arquivo principal:

- `src/components/sections/LoadingScreen.tsx`

Elementos que NAO fazem mais parte da versao atual:

- `iFocusRef`
- `iCoreRef`
- `iStemRef`
- `iPrismRef`
- `iEchoRef`

Outras pecas importantes:

- escrita letra por letra com `writeHeadRef`
- trilho/progresso com `trackRef`, `fillRef` e `beamRef`
- glow de palco com `stageGlowRef`
- payoff final com `flashRef` e `apertureRef`

## Direcao de animacao

Quando alguem for refinar esta sequencia, a logica deve continuar assim:

1. mostrar o status e o nome sendo escrito lentamente;
2. revelar `MoreiraGabryel` letra por letra como um wordmark unico;
3. sincronizar `writeHead`, barra e percentual com a escrita;
4. intensificar glow e tensao de palco no pre-reveal;
5. fazer o reveal final com flash curto + aperture;
6. entregar a home sem residuos visuais nem bloqueio de interacao.

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
- preserve o wordmark como protagonista;
- refine timing, glow, profundidade e reveal sem voltar para o conceito antigo de raio nem reintroduzir um efeito isolado no `i`;
- valide sempre em runtime/localhost antes de declarar pronto.
