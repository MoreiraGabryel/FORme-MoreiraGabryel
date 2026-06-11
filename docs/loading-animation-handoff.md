# Loading Animation Handoff

Data: `2026-06-11`

## Objetivo

Este documento existe para orientar a proxima IA ou pessoa responsavel pela animacao do loading do portfolio.

O design no Canva ja foi usado para definir a sequencia visual estatica. A proxima etapa deve **apenas usar esses frames como referencia para animar no site**, sem redesenhar a ideia-base.

## Fonte de verdade visual

- Design Canva: `MoreiraGabryel`
- ID do design: `DAHMSNgrySM`
- Link de edicao conhecido: `https://www.canva.com/d/t-1jIGiZez60yHn`

## Regra principal

O Canva define a narrativa visual.

A implementacao no site deve:

- preservar a ordem dos frames;
- preservar o papel do raio no lugar da letra `i`;
- preservar o glow/flash antes da abertura do site;
- preservar a sensacao de energia percorrendo o lettering;
- usar esses slides como referencia de keyframes visuais.

Nao fazer nesta etapa:

- nao reinventar a composicao;
- nao trocar a identidade visual do loading;
- nao substituir o conceito do raio por outro simbolo;
- nao simplificar a sequencia para uma animacao generica.

## Sequencia aprovada

### Frame 1

`MoreiraGabryel` normal, centralizado.

Leitura:

- tela inicial limpa;
- foco total no nome;
- base antes da energia aparecer.

### Frame 2

A letra `i` vira um raio.

Leitura:

- o raio ocupa o lugar do `i`;
- o nome continua legivel;
- primeiro evento visual de transformacao.

### Frame 3

O raio energiza o nome.

Leitura:

- sensacao de eletricidade correndo pelas letras;
- nome em estado energizado;
- glow/amarelo mais presente.

### Frame 4

As letras sobem.

Leitura:

- o lettering sai da posicao central;
- o efeito aponta para transicao de encerramento do loading;
- o raio ainda e a origem visual da energia.

### Frame 5

Zoom do raio + luz expandida + abertura para entrada do site.

Leitura:

- raio cresce;
- glow central abre;
- o frame deve preparar a troca do loading para a interface principal;
- esse e o ultimo frame estatico antes da animacao revelar o site.

## Assets relevantes

Arquivos locais ja criados para apoio:

- [lightning-bolt.svg](F:/Repositório-Pessoal/public/icons/lightning-bolt.svg)
- [lightning-network.svg](F:/Repositório-Pessoal/public/icons/lightning-network.svg)

Uso esperado:

- `lightning-bolt.svg`: raio principal no lugar da letra `i`
- `lightning-network.svg`: ramificacoes eletricas e reforco de energia/glow

## Direcao de animacao

Quando a proxima IA implementar no site, a animacao deve seguir esta logica:

1. mostrar o nome limpo;
2. transformar o `i` em raio;
3. disparar energia pelas letras;
4. elevar o lettering;
5. ampliar o raio e o glow;
6. fazer a transicao para revelar o site.

## Observacoes tecnicas

- Pensar em GSAP como ferramenta principal de coreografia.
- O SVG deve continuar vetorial e separado do maximo possivel.
- O efeito precisa parecer premium e controlado, nao um efeito aleatorio.
- O timing deve ser progressivo: transformacao, energia, elevacao, explosao de luz, reveal.

## Instrucao para a proxima IA

Se voce estiver animando esta sequencia:

- use o Canva como storyboard;
- nao trate os slides como sugestao vaga;
- replique a intencao visual de cada frame;
- ajuste apenas o necessario para viabilidade tecnica no front-end.
