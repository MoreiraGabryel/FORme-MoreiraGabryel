import {useEffect, useRef} from 'react';
import type {RefObject} from 'react';
import {gsap} from 'gsap';
import {
  CODE_FRAGMENTS,
  getCodeBurstMotion,
  shouldCreateCodeBurst,
} from '../../utils/codeBurstMotion';

type BurstPointerOrigin = {
  x: number;
  y: number;
  target: EventTarget | null;
};

const NON_BURST_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  '[role="button"]',
  '[role="dialog"]',
  '[contenteditable="true"]',
  '[data-no-code-burst]',
  'video',
  'iframe',
  '.technology-float-anchor',
  '.technology-modal-backdrop',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
].join(', ');

function isElement(value: EventTarget | null): value is Element {
  return value instanceof Element;
}

function isInteractiveTarget(target: EventTarget | null) {
  return isElement(target) && Boolean(target.closest(NON_BURST_SELECTOR));
}

function isBurstSurface(target: EventTarget | null) {
  return isElement(target) && Boolean(target.closest('[data-code-burst-surface]'));
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function CodeBurstLayer({hostRef}: {hostRef: RefObject<HTMLElement | null>}) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const activeParticlesRef = useRef<HTMLElement[]>([]);
  const pointerOriginsRef = useRef(new Map<number, BurstPointerOrigin>());

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    if (!host || !layer) return;

    const removeParticle = (particle: HTMLElement) => {
      particle.remove();
      activeParticlesRef.current = activeParticlesRef.current.filter((active) => active !== particle);
    };

    const createBurst = (x: number, y: number) => {
      const motion = getCodeBurstMotion({
        isMobile: window.matchMedia('(max-width: 640px)').matches,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      });
      if (motion.count === 0) return;

      const overflow = activeParticlesRef.current.length + motion.count - motion.maxActive;
      if (overflow > 0) {
        activeParticlesRef.current.slice(0, overflow).forEach((particle) => {
          gsap.killTweensOf(particle);
          removeParticle(particle);
        });
      }

      for (let index = 0; index < motion.count; index += 1) {
        const particle = document.createElement('span');
        const angle = Math.random() * Math.PI * 2;
        const distance = randomBetween(motion.minDistance, motion.maxDistance);

        particle.className = 'code-burst-particle';
        particle.textContent = CODE_FRAGMENTS[Math.floor(Math.random() * CODE_FRAGMENTS.length)];
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        layer.appendChild(particle);
        activeParticlesRef.current.push(particle);

        gsap.fromTo(
          particle,
          {x: 0, y: 0, autoAlpha: 1, scale: 0.82, rotation: 0},
          {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            autoAlpha: 0,
            scale: 1,
            rotation: randomBetween(-24, 24),
            duration: randomBetween(motion.minDuration, motion.maxDuration),
            ease: 'power2.out',
            force3D: motion.force3D,
            onComplete: () => removeParticle(particle),
          },
        );
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerOriginsRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        target: event.target,
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const origin = pointerOriginsRef.current.get(event.pointerId);
      pointerOriginsRef.current.delete(event.pointerId);
      if (!origin) return;

      const movement = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
      const target = origin.target;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (
        !shouldCreateCodeBurst({
          isBurstSurface: isBurstSurface(target),
          isInteractiveTarget: isInteractiveTarget(target),
          pointerType: event.pointerType,
          movement,
          prefersReducedMotion,
        })
      ) {
        return;
      }

      createBurst(event.clientX, event.clientY);
    };

    const clearPointer = (event: PointerEvent) => {
      pointerOriginsRef.current.delete(event.pointerId);
    };

    host.addEventListener('pointerdown', handlePointerDown);
    host.addEventListener('pointerup', handlePointerUp);
    host.addEventListener('pointercancel', clearPointer);

    return () => {
      host.removeEventListener('pointerdown', handlePointerDown);
      host.removeEventListener('pointerup', handlePointerUp);
      host.removeEventListener('pointercancel', clearPointer);
      activeParticlesRef.current.forEach((particle) => {
        gsap.killTweensOf(particle);
        particle.remove();
      });
      activeParticlesRef.current = [];
    };
  }, [hostRef]);

  return <div ref={layerRef} className="code-burst-layer" aria-hidden="true" />;
}
