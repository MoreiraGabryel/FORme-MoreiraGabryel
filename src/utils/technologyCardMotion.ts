import {gsap} from 'gsap';

type CardTargets = {
  root: gsap.TweenTarget;
  blades: gsap.TweenTarget[];
  seam: gsap.TweenTarget;
  content: gsap.TweenTarget[];
  shade?: gsap.TweenTarget;
};

export function createTechnologyCardTimeline(targets: CardTargets, kind: 'hover' | 'dialog', reducedMotion: boolean) {
  const {root, blades, seam, content, shade} = targets;
  const timeline = gsap.timeline({paused: true, defaults: {ease: 'power3.out', force3D: true}});

  if (reducedMotion) {
    gsap.set(root, {opacity: 1});
    gsap.set(blades, {x: 0, y: 0, rotationY: 0, opacity: 1});
    gsap.set(seam, {scaleY: 1, opacity: 0.32});
    gsap.set(content, {y: 0, opacity: 1});
    if (shade) gsap.set(shade, {opacity: 1});
    return timeline;
  }

  const isDialog = kind === 'dialog';
  const duration = isDialog ? 0.42 : 0.24;
  const offset = isDialog ? 24 : 10;

  timeline
    .fromTo(root, {opacity: 0}, {opacity: 1, duration: 0.08}, 0)
    .fromTo(seam, {scaleY: 0, opacity: 0}, {scaleY: 1, opacity: 0.65, duration: duration * 0.62, ease: 'power2.inOut'}, 0)
    .fromTo(blades[0], {x: offset, y: -4, rotationY: -9, opacity: 0}, {x: 0, y: 0, rotationY: 0, opacity: 1, duration}, 0.035)
    .fromTo(blades[1], {x: -offset, y: 4, rotationY: 9, opacity: 0}, {x: 0, y: 0, rotationY: 0, opacity: 1, duration}, 0.06)
    .fromTo(content, {y: isDialog ? 9 : 5, opacity: 0}, {y: 0, opacity: 1, duration: duration * 0.68, stagger: isDialog ? 0.035 : 0.025}, duration * 0.35)
    .to(seam, {opacity: 0.28, duration: duration * 0.5}, duration * 0.65);

  if (shade) timeline.fromTo(shade, {opacity: 0}, {opacity: 1, duration: 0.18}, 0);
  return timeline;
}

export function closeTechnologyCardTimeline(timeline: gsap.core.Timeline, onClosed: () => void, reducedMotion: boolean) {
  if (reducedMotion || timeline.time() <= 0) {
    timeline.pause();
    onClosed();
    return;
  }
  timeline.eventCallback('onReverseComplete', onClosed);
  timeline.timeScale(1.45).reverse();
}
