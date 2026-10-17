import {useEffect, useLayoutEffect, useRef} from 'react';
import type {RefObject} from 'react';
import {gsap} from 'gsap';
import {getPointerDepthTarget} from '../utils/pointerDepthMotion';

/** Mouse owns only an inner image plane; ScrollTrigger retains the outer scene. */
export function usePointerDepth(
  surfaceRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
  strength: number,
) {
  const strengthRef = useRef(strength);
  const updateRef = useRef<() => void>(() => undefined);

  useLayoutEffect(() => {
    strengthRef.current = strength;
    updateRef.current();
  }, [strength]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const target = targetRef.current;
    if (!surface || !target) return;

    const media = gsap.matchMedia();
    media.add({
      desktop: '(min-width: 768px) and (hover: hover) and (pointer: fine)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, (context) => {
      if (!context.conditions?.desktop || context.conditions.reduced) return;

      gsap.set(target, {x: 0, y: 0, scale: 1, force3D: true, willChange: 'transform'});
      const options = {duration: 0.55, ease: 'power3.out'};
      const xTo = gsap.quickTo(target, 'x', options);
      const yTo = gsap.quickTo(target, 'y', options);
      const scaleTo = gsap.quickTo(target, 'scale', options);
      let pointer: {x: number; y: number; width: number; height: number} | null = null;

      const neutral = (immediate = false) => {
        pointer = null;
        if (immediate) {
          // quickTo caches its own current value, not later gsap.set writes.
          // Reset the cached start and end as well as the rendered plane.
          xTo(0, 0);yTo(0, 0);scaleTo(1, 1);
          [xTo, yTo, scaleTo].forEach(tween => tween.tween.pause().progress(1));
        } else {
          xTo(0);yTo(0);scaleTo(1);
        }
      };
      const update = () => {
        if (document.hidden || strengthRef.current <= 0) {neutral(true);return;}
        if (!pointer) return;
        const destination = getPointerDepthTarget({...pointer, strength: strengthRef.current});
        xTo(destination.x);yTo(destination.y);scaleTo(destination.scale);
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || document.hidden || strengthRef.current <= 0) return;
        const rect = surface.getBoundingClientRect();
        pointer = {x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height};
        update();
      };
      const leave = () => neutral();
      const suspend = () => neutral(true);
      const visibility = () => {if (document.hidden) suspend();};
      updateRef.current = update;
      surface.addEventListener('pointermove', move, {passive: true});
      surface.addEventListener('pointerleave', leave);
      document.addEventListener('visibilitychange', visibility);
      window.addEventListener('blur', suspend);
      window.addEventListener('resize', suspend);

      return () => {
        // GSAP reverts/kills context tweens before this cleanup runs.
        // Calling quickTo here would resurrect them on the global timeline.
        pointer = null;
        [xTo, yTo, scaleTo].forEach(tween => tween.tween.kill());
        updateRef.current = () => undefined;
        surface.removeEventListener('pointermove', move);
        surface.removeEventListener('pointerleave', leave);
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('blur', suspend);
        window.removeEventListener('resize', suspend);
      };
    });
    return () => media.revert();
  }, [surfaceRef, targetRef]);
}
