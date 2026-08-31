import {useEffect} from 'react';
import type {RefObject} from 'react';

/**
 * Loop ambiente: velocidade normal, `loop` nativo do elemento, sem nenhum
 * remendo de `timeupdate`.
 *
 * O clipe é gerado com o mesmo quadro no início e no fim, então a volta fecha
 * sozinha — a emenda mede RMSE 0,0179 contra 0,0139 de um passo comum entre
 * quadros vizinhos, ou seja, é da ordem do movimento normal do próprio clipe.
 *
 * Ao desligar, além de pausar, o clipe rebobina. Num loop fechado um quadro vale
 * o outro, e o primeiro é o único com garantia de casar com o que entrega a cena
 * para ele — é o que mantém a troca limpa também na subida do scroll.
 */
export function useAmbientVideo(
  ref: RefObject<HTMLVideoElement | null>,
  {active}: {active: boolean},
) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'auto';
    video.playbackRate = 1;
  }, [ref]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (!active) {
      video.pause();
      if (video.currentTime > 0) video.currentTime = 0;
      return;
    }

    const played = video.play();
    if (played) played.catch(() => undefined);
  }, [ref, active]);
}
