import {useEffect, useLayoutEffect, useRef} from 'react';
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
  {active, prepare, onReady}: {active: boolean; prepare?: boolean; onReady?: (ready: boolean) => void},
) {
  const readyCallbackRef = useRef(onReady);
  useLayoutEffect(() => {readyCallbackRef.current = onReady;}, [onReady]);
  useLayoutEffect(() => {
    if (prepare === undefined || !ref.current) return;
    const video = ref.current;
    if (!prepare) {video.pause();readyCallbackRef.current?.(false);return;}
    if (active) {
      try {video.play()?.catch(() => undefined);} catch { /* Retain the decoded opening frame. */ }
      return () => video.pause();
    }
    let cancelled = false;
    video.pause();
    readyCallbackRef.current?.(false);
    const ready = () => {
      // This hidden layer needs decoded opening data, not compositor visibility.
      if (!cancelled && !video.seeking && video.readyState >= 2 && video.videoWidth > 0 &&
        video.videoHeight > 0 && video.currentTime <= 1 / 48) readyCallbackRef.current?.(true);
    };
    const failed = () => {if (!cancelled) readyCallbackRef.current?.(false);};
    video.addEventListener('seeked', ready);
    video.addEventListener('loadeddata', ready);
    video.addEventListener('error', failed);
    try {if (video.currentTime > 0) video.currentTime = 0;} catch { /* Metadata may not yet be available. */ }
    ready();
    return () => {
      cancelled = true;
      video.pause();
      video.removeEventListener('seeked', ready);
      video.removeEventListener('loadeddata', ready);
      video.removeEventListener('error', failed);
    };
  }, [ref, active, prepare]);

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

    if (prepare !== undefined) return;
    if (!active) {
      video.pause();
      if (video.currentTime > 0) video.currentTime = 0;
      return;
    }

    const played = video.play();
    if (played) played.catch(() => undefined);
  }, [ref, active, prepare]);
}
