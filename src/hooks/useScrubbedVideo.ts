import {useEffect, useRef} from 'react';
import type {RefObject} from 'react';

// Meio quadro a 24 fps: abaixo disso o seek não muda a imagem, só gasta decoder.
const SEEK_EPSILON = 1 / 48;
// `currentTime = duration` cai depois do último quadro e cada navegador reage de
// um jeito. Recuar um quadro garante que o fim do scroll pare exatamente na
// imagem que emenda no clipe seguinte.
const LAST_FRAME_GUARD = 1 / 24;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Amarra a posição de um vídeo ao progresso do scroll: escreve `currentTime` e
 * nunca chama `play()`. O clipe vira uma linha do tempo navegável — anda quando
 * o leitor desce, volta quando ele sobe.
 *
 * Um seek novo só sai depois que o anterior terminou. Sem essa fila o navegador
 * recebe pedidos mais rápido do que o decoder entrega quadros, descarta os do
 * meio e o movimento engasga justamente onde o scroll é mais rápido.
 *
 * @param progress posição desejada, 0 a 1, sobre a duração inteira do clipe.
 */
export function useScrubbedVideo(
  ref: RefObject<HTMLVideoElement | null>,
  progress: number,
  {enabled = true}: {enabled?: boolean} = {},
) {
  const targetRef = useRef(progress);
  const enabledRef = useRef(enabled);
  const pendingSeekRef = useRef(false);
  const primedRef = useRef(false);
  const flushRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.loop = false;
    video.preload = 'auto';

    // Parte dos navegadores móveis só engata o decoder depois de uma chamada de
    // reprodução; antes disso `currentTime` é aceito e ignorado. Um play seguido
    // de pause acorda o decoder sem deixar o clipe avançar. Roda uma vez só, e
    // no primeiro scrub de verdade — na montagem anularia o observador que
    // segura a decodificação enquanto a cena está longe.
    const primeDecoder = () => {
      const played = video.play();
      if (!played) {
        video.pause();
        return;
      }
      played
        .then(() => {
          video.pause();
          flush();
        })
        .catch(() => undefined);
    };

    const flush = () => {
      if (!enabledRef.current) return;

      if (!primedRef.current) {
        primedRef.current = true;
        primeDecoder();
      }

      const {duration} = video;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const reachable = Math.max(duration - LAST_FRAME_GUARD, 0);
      const target = clamp01(targetRef.current) * reachable;

      if (Math.abs(video.currentTime - target) < SEEK_EPSILON) return;

      if (video.seeking) {
        pendingSeekRef.current = true;
        return;
      }

      pendingSeekRef.current = false;
      video.currentTime = target;
    };

    flushRef.current = flush;

    const handleSeeked = () => {
      if (!pendingSeekRef.current) return;
      pendingSeekRef.current = false;
      flush();
    };

    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadedmetadata', flush);
    video.addEventListener('loadeddata', flush);

    flush();

    return () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadedmetadata', flush);
      video.removeEventListener('loadeddata', flush);
      flushRef.current = () => undefined;
    };
  }, [ref]);

  useEffect(() => {
    targetRef.current = progress;
    enabledRef.current = enabled;
    flushRef.current();
  }, [progress, enabled]);
}
