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

export const TECHNOLOGY_SCENE: SceneGeometry = {
  lengthInViewports: 7.2,
  leadInViewports: 0.22,
};

export const TECHNOLOGY_SCENE_REDUCED_MOTION: SceneGeometry = {
  lengthInViewports: 5.5,
  leadInViewports: 0.22,
};

export const FAKE_FOOTER_SCENE: SceneGeometry = {
  lengthInViewports: 2.65,
  leadInViewports: -0.42,
};
