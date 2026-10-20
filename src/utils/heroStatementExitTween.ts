import {gsap} from 'gsap';
import type {HeroScrollExitMotion} from './heroScrollExitMotion';

/**
 * Swaps only the character exit tween inside the Hero scroll timeline. Rotating
 * the phrase must not tear down the pinned ScrollTrigger or force a global refresh.
 */
export function replaceHeroStatementExit({
  timeline,
  previous,
  chars,
  motion,
}: {
  timeline: gsap.core.Timeline;
  previous: gsap.core.Tween | null;
  chars: gsap.TweenTarget;
  motion: HeroScrollExitMotion['statement'];
}) {
  if (previous) {
    timeline.remove(previous);
    previous.kill();
  }

  const tween = gsap.to(chars, {
    autoAlpha: 0,
    y: motion.y,
    duration: motion.duration,
    ease: 'power3.in',
    force3D: true,
    stagger: {amount: motion.staggerAmount, from: motion.from},
  });
  timeline.add(tween, motion.start);
  return tween;
}
