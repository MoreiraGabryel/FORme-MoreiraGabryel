/**
 * Geometria das cenas dirigidas por scroll.
 *
 * Cada cena é fixada por um ScrollTrigger e, ao mesmo tempo, lida pelo `App`
 * para derivar as CSS custom properties. Os dois lados precisam concordar sobre
 * onde a cena começa e quanto ela dura, então os números vivem aqui em vez de
 * duplicados em cada componente.
 *
 * `lengthInViewports` é o comprimento do trecho fixado, em alturas de viewport;
 * é o mesmo valor que alimenta o `end` do ScrollTrigger.
 *
 * `leadInViewports` desloca o início do progresso em relação ao momento em que o
 * topo da seção encosta no topo da tela: negativo começa antes (a cena já está
 * respirando na aproximação), positivo começa depois.
 */
export type SceneGeometry = {
  lengthInViewports: number;
  leadInViewports: number;
};

/**
 * Os comprimentos foram alongados em 2026-08-31 porque as cenas saíam rápido
 * demais: pouca rolagem para muita animação faz cada entalhe da roda pular um
 * naco grande do progresso, e o efeito lido na tela é salto, não movimento.
 *
 * Nada de animação mudou junto — os mesmos beats, distribuídos em mais scroll.
 *
 * A âncora do número é o rodapé falso, porque lá existe uma medida objetiva: o
 * vídeo de entrada tem 123 quadros e ocupa os primeiros 63% da cena, então dá
 * para calcular pixels de rolagem por quadro. Um entalhe de roda de mouse anda
 * ~100px. Antes, a 14px/quadro, um entalhe pulava 7 quadros — 0,29s de vídeo de
 * uma vez, que é exatamente o salto percebido. O alvo passou a ser ~20px/quadro,
 * onde o entalhe anda 5 quadros (0,2s) e a passagem ainda lê como contínua.
 *
 * As outras duas cenas seguem a mesma direção, com aumento proporcional ao
 * aperto de cada uma: o hero era o mais curto de todos e recebeu o maior ganho;
 * a cena de tecnologia já era longa e precisou de pouco.
 */

/**
 * O hero é medido a partir de `scrollY` puro, e não por `rect.top` como as
 * outras: ele começa fixado no topo, então seu `rect.top` fica preso em 0 e não
 * serve de origem. Por isso `leadInViewports` aqui é sempre 0.
 *
 * Este comprimento estava escrito à mão em dois lugares — no `end` do
 * ScrollTrigger e na conta do `App` — o que é justamente o que o cabeçalho deste
 * arquivo existe para impedir. Pior: o `App` usava 1.6 mesmo sob
 * `prefers-reduced-motion`, enquanto o timeline terminava em 1.1, então nesse
 * modo o GSAP acabava com o progresso das CSS custom properties ainda subindo.
 */
export const HERO_SCENE: SceneGeometry = {
  lengthInViewports: 2.3,
  leadInViewports: 0,
};

export const HERO_SCENE_REDUCED_MOTION: SceneGeometry = {
  lengthInViewports: 1.5,
  leadInViewports: 0,
};

/**
 * `leadInViewports` é 0 nas duas cenas desde 2026-08-31, e isso é deliberado.
 *
 * Ele deslocava o progresso do `App` em relação ao `pin` do GSAP, e o resultado
 * medido era que os dois sistemas cobriam trechos de rolagem diferentes: a cena
 * de tecnologia tinha o pin em [2307, 8172] e o progresso em [2457, 8172]; o
 * rodapé tinha pin em [8854, 11446] e progresso começando 286px antes, em 8568.
 *
 * Esses 286px eram o pior caso: o rodapé animava por dentro enquanto ainda
 * deslizava para o lugar. Duas coisas se movendo pelo mesmo scroll, que é
 * exatamente a sobreposição que se via.
 *
 * A "respiração na aproximação" que o valor negativo tentava dar não sumiu —
 * mudou de lugar. Agora vem de `resolveApproach` no `App`, que mede a entrada
 * da seção em campo e é uma fase própria, antes do pin, em vez de um
 * deslocamento embutido no progresso da cena.
 */

export const TECHNOLOGY_SCENE: SceneGeometry = {
  lengthInViewports: 8.6,
  leadInViewports: 0,
};

export const TECHNOLOGY_SCENE_REDUCED_MOTION: SceneGeometry = {
  lengthInViewports: 6.4,
  leadInViewports: 0,
};

export const FAKE_FOOTER_SCENE: SceneGeometry = {
  lengthInViewports: 3.8,
  leadInViewports: 0,
};
