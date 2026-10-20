# Fake-footer mobile: adaptação do fluxo desktop

Escopo: ida e volta entre Hero → tecnologias → sequência de imagens → túnel/fake-footer. A mesma consulta é usada no JS e no CSS: telas abaixo de 768 px, ou dispositivos touch sem hover até 1024 px, incluindo celulares em paisagem. O desktop de ponteiro fino mantém seu caminho existente. Não há proporção fixa: a composição se adapta a 16:9, 9:16 e telas alongadas sem esticar ou cortar a mídia.

## Rolagem e imagens

- O touch permanece nativo e livre. O site se adapta ao gesto: não limita velocidade, não prende o visitante, não impõe snap e não aumenta o percurso para obrigar a assistir aos efeitos. Lenis mantém a configuração original de wheel, ticker, âncoras e locks de modal/footer, sem um novo controlador touch.
- A sequência reutiliza as mesmas timelines, fontes, ordem, crossfades e pins do desktop. No mobile, o scrub de Hero/tecnologias acompanha diretamente o scroll, em vez de continuar assentando depois que o pin já avançou. Os atrasos numéricos calibrados no desktop permanecem intactos.
- A aproximação da seção solicita a decodificação antecipada das imagens mobile existentes, sem aguardar a promessa nem bloquear o scroll. O gesto mobile também cancela uma revelação de Loading ainda ativa na Hero, evitando duas timelines concorrentes sobre seus elementos.
- O percurso do fake-footer volta à fórmula desktop aplicada à altura estável do aparelho. O piso artificial de 1040 px foi retirado.
- No mobile, a saída dos ícones acompanha o progresso em ambos os sentidos, sem concluir por um temporizador independente. Voltar das imagens preserva a revelação do grupo selecionado.
- O pin externo continua sob responsabilidade do ScrollTrigger, sem um segundo sticky interno. A geometria de scroll e os deslocamentos dos efeitos usam a altura estável capturada; a apresentação usa uma medida separada da área atualmente visível.
- A camada GSAP é a única responsável pelo deslocamento de saída do texto mobile; foram retirados o segundo deslocamento e as transições CSS concorrentes desse texto.
- Cruzar a fronteira entre ícones e imagens não recria mais o RAF de ícones no mobile. A fase do movimento continua nos dois sentidos enquanto a cena permanece ativa.
- No mobile, o progresso publicado para o App e para o RAF de ícones vem da mesma timeline, sem a ref mobile ser sobrescrita por um efeito React atrasado. A publicação de progresso desktop permanece como estava.
- Hero, tecnologias e fake-footer se ajustam à área visível ao abrir/recolher as barras. Isso não redefine os progressos, a fase dos efeitos, os comprimentos de scroll ou os pins. A reconstrução estrutural continua reservada às mudanças de largura/orientação.

## Entrada do túnel: mesmo caminho desktop

O desktop usa `/media/portal-entrada.mp4` scrubbado pelo progresso do pin, seguido da dissolução para `/media/portal-tunel-loop.mp4`. O mobile agora usa os mesmos hooks, target de seek, opacidades e beats de troca: deixa de passar `maxSeekStep`, `onPresented`, `prepare` ou `onReady`. Não há um gate de apresentação ou cursor de dois frames exclusivo do mobile segurando a entrada ou a passagem para o loop. Ao voltar, o mesmo progresso rebobina a entrada e desativa/rebobina o loop pelo caminho já usado no desktop.

O overlap estável, a reserva externa de viewport grande e a compensação de fluxo do fake-footer continuam isolados ao mobile. A preparação antecipada e a suspensão de mídia quando a página está oculta ou o fake-footer está encerrado permanecem mobile-only.

## Safari/Firefox mobile: barras e saída

- A altura pequena é medida uma vez na inicialização e novamente nas mudanças estruturais de largura/orientação, com fallback quando `svh` não é suportado. `--stable-vh` continua sendo a base em pixels para a geometria de scroll.
- Uma medida separada publica `--mobile-visual-vh` e `--mobile-visual-top` a partir do VisualViewport, com fallback para `innerHeight`. O centro dos letreiros e o enquadramento dos fundos acompanham essa apresentação. O letreiro da Hero não depende da diferença de altura entre cabeçalho e rodapé, e o fake-footer não subtrai uma faixa somente abaixo do centro.
- Mudanças apenas de altura, como recolher/expandir as barras, não mudam a base do ScrollTrigger. Não adicionamos `normalizeScroll`, fullscreen por API, locks, reinícios de timeline ou refresh em cada resize de toolbar.
- Os deslocamentos e o parallax conservam a altura capturada e os coeficientes existentes. Os callbacks da área visível apenas atualizam apresentação; não solicitam refresh ou scroll programático. Pinch zoom continua nativo, sem rearranjo durante a ampliação. Os estilos desktop permanecem em suas unidades anteriores.
- O blackout de saída do fake-footer cobre também os controles de utilidade e não tem um segundo fade CSS atrasado. O callback do pin marca a seção como encerrada antes do paint; o conteúdo permanece invisível depois de liberar o pin e volta a ficar disponível quando o progresso retorna abaixo do fim. A marca também é reconciliada em refresh e removida no cleanup.
- A composição do easter egg (vídeo, canvas, códigos e linha de colapso) mantém a mesma base estável, mas sua cobertura preta e a seção usada para admissão continuam cobrindo o viewport real. Áudio, relógio por tempo de mídia, gatilhos, restauração e contador não são alterados.

## Ergonomia dos controles e distribuição

- A seção de tecnologias mantém somente as setas anterior/próximo, ancoradas ao rodapé da própria cena com espaço reservado no campo de ícones. A safe area inferior é capturada nos mesmos pontos estruturais da altura estável, sem ser reavaliada continuamente pelas barras do navegador. O texto visível de grupo/contador foi retirado; os botões continuam nomeados para acessibilidade e desabilitados nas extremidades.
- A distribuição mobile mede o campo e o bloco de texto e divide o grupo entre as regiões superior e inferior, sem concentrá-lo embaixo. A divisão procura equilíbrio, mas respeita a capacidade real de cada região para manter os ícones inteiros e o texto livre. A ordem alterna cima/baixo também na revelação. Laterais são uma alternativa para telas curtas, não o arranjo padrão. O limite final considera a interseção com a área visível, a escala/rotação do botão e a escala/offset do SVG. As leituras são agrupadas antes das escritas de transform; reorganizações do layout usam o RAF existente, sem alterar o touch.
- A oscilação mobile reutiliza o mesmo movimento do desktop, com maior amplitude lateral e vertical. O limite final também exclui o bloco central e a área das setas, com folga para o tamanho animado inteiro. Entrada e saída não conduzem mais os ícones através do centro; preservam posição segura, escala e fade. Se uma mudança transitória de viewport não oferecer posição válida, o ícone não fica visível/clicável sobre uma área protegida.
- No fake-footer, redes sociais, links legais e copyright ficam ancorados na faixa inferior. Os links aparecem na ordem Termos de Serviço — Política de Privacidade, lado a lado; o rótulo Legal não é renderizado no mobile. O desktop mantém sua ordem e rótulo anteriores.
- Português e inglês mantêm as linhas editoriais, a tipografia e a animação por caracteres existentes. O encaixe mobile mede as linhas reais depois da fonte carregar e em mudanças de espaço, limitando sua escala à largura disponível e à região livre acima dos controles. As camadas de saída e entrada são medidas separadamente, sem alterar o texto ou a formatação desktop.

## Vídeo e restauração mobile

- Os arquivos originais não foram reencodados: o WebM contém alpha e o MP4 existente já está compositado em preto. A inspeção offline de um quadro da fonte identificou transparência no WebM e cantos pretos no MP4. Isso não é validação do playback no navegador.
- No mobile, o vídeo final prefere `/media/footer-character-mobile.mp4` sobre o mesmo fundo preto da cena, evitando depender de alpha VP9. O desktop mantém os arquivos anteriores e sua ordem de fontes. A preferência é capturada na montagem para não trocar decoder/áudio ao girar o aparelho ou variar a barra do navegador.
- A variante mobile elimina o ruído retangular de fundo dos nove quadros iniciais sem personagem visível, mantendo os 362 quadros, 36 fps, dimensões, duração e timestamps. Os pacotes AAC foram copiados e comparados integralmente; o restante do vídeo foi reencodado sem cortes ou retiming. Os arquivos desktop não foram substituídos.
- A visibilidade inicial mobile também respeita o sinal de apresentação já existente: o elemento permanece preto/invisível até receber um quadro decodificado com avanço de tempo. `playing` sozinho não revela a superfície de carregamento.
- O retorno mobile volta ao mesmo caminho do desktop: `returnToTop` e a rotina compartilhada reconciliam os pins montados, o scroll e o estado antes de revelar a Hero. Foi retirada a remontagem exclusiva das cenas mobile durante esse processo, sem criar outro controlador ou temporizador de retorno. O componente final, o relógio do vídeo, a propriedade dos locks e o contador não são remontados nem zerados.
- O diagnóstico autorizado no aparelho confirmou que `ended` ocorria normalmente, mas `getTween()?.progress(1)` lançava TypeError: no modo `scrub: true`, a versão instalada retorna `0`, não null/undefined. O refresh agora conclui o tween somente quando ele existe, conservando a chamada desktop com suavização numérica. Duas execuções nativas posteriores confirmaram restauração concluída, `returnedToTop: true` e scroll em zero; o usuário também aprovou o resultado. A instrumentação temporária foi removida.

## Verificação desta rodada

Por solicitação do usuário, esta rodada não dispara agentes, não cria nem executa testes funcionais, probes de comportamento, navegação de site ou screenshots. A verificação fica restrita à compilação/build, inspeção estática do delta, leitura offline da mídia existente e transporte da prévia.

A validação visual fica com o usuário: repetir a ida e volta Hero ↔ ícones ↔ imagens ↔ entrada do túnel ↔ fake-footer, inclusive com a barra do navegador aberta/recolhida. Build e leitura de fonte não comprovam o comportamento nativo nem garantem ausência de defeitos em todas as visitas. Não há garantia de apresentação de todos os frames durante um gesto arbitrariamente rápido. A saída para o easter egg e sua contagem não são alteradas nesta rodada.
