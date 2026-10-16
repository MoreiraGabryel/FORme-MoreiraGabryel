import {useEffect} from 'react';
import Lenis from 'lenis';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll suave no estilo dos sites de vitrine (award / motion): a roda do mouse
 * deixa de saltar ~100px por entalhe e passa a mover a rolagem *real* do
 * documento de forma interpolada, quadro a quadro.
 *
 * O ponto sensível — e o motivo de existir como um relógio único — é a memória
 * de "dois relógios" do projeto. Isto NÃO reintroduz o defeito: o Lenis anima a
 * posição nativa de scroll, e tanto o `pin`/`scrub` do ScrollTrigger quanto as
 * contas de progresso do `App` (que leem `window.scrollY` e `rect.top`)
 * continuam lendo essa mesma posição — agora suave. Sem isto, cada entalhe da
 * roda saltava um naco do progresso e todas as CSS custom properties dirigidas
 * pelo scroll saltavam junto, que é o efeito lido como "20fps".
 *
 * Contrato:
 * - `enabled` só fica verdadeiro depois do Loading. Enquanto a tela de Loading
 *   está montada ela trava o scroll (`body{position:fixed}`); o Lenis entra
 *   depois que ela desmonta e devolve o body ao normal.
 * - Sob `prefers-reduced-motion` o Lenis não é criado: rolagem nativa, sem
 *   inércia — coerente com o resto do site.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      // Inércia da rolagem. ~1s dá o deslize sem virar "nado" preguiçoso.
      duration: 1.05,
      // easeOutCubic: começa respondendo já e assenta macio no fim.
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    // Dialogs and the final scene share ownership: one cannot restart Lenis
    // while the other still owns a lock. stop() cancels pending inertia.
    const technologyModals = new Set<HTMLDialogElement>();
    let footerSceneActive = false;
    let footerSceneRestoring = false;
    let resumeAfterScrollLock = false;
    const isScrollLocked = () => footerSceneActive || technologyModals.size > 0;
    const syncScrollLock = (wasLocked: boolean) => {
      const locked = isScrollLocked();
      if (!wasLocked && locked) {
        resumeAfterScrollLock = !lenis.isStopped;
        lenis.stop();
      } else if (wasLocked && !locked) {
        if (resumeAfterScrollLock) lenis.start();
        resumeAfterScrollLock = false;
      }
    };
    const setTechnologyModal = (dialog: HTMLDialogElement, open: boolean) => {
      const wasLocked = isScrollLocked();
      if (open) technologyModals.add(dialog);
      else technologyModals.delete(dialog);
      syncScrollLock(wasLocked);
    };
    const onTechnologyModalState = (event: Event) => {
      const {dialog, open} = (event as CustomEvent<{dialog: HTMLDialogElement; open: boolean}>).detail;
      setTechnologyModal(dialog, open);
    };
    const onFooterSceneState = (event: Event) => {
      const {active, resetToTop, scrollY} = (event as CustomEvent<{active: boolean; resetToTop?: boolean; scrollY?: number}>).detail;
      const wasLocked = isScrollLocked();
      const wasFooterActive = footerSceneActive;
      footerSceneActive = active;
      footerSceneRestoring = active && (footerSceneRestoring || Boolean(resetToTop) || scrollY !== undefined);
      if (active && (resetToTop || scrollY !== undefined)) {
        lenis.resize();
        lenis.scrollTo(resetToTop ? 0 : scrollY!, {immediate: true, force: true});
      } else if (!active && wasFooterActive) lenis.resize();
      syncScrollLock(wasLocked);
    };
    document.addEventListener('technology-modal-state', onTechnologyModalState);
    document.addEventListener('footer-scene-scroll-state', onFooterSceneState);
    document.querySelectorAll<HTMLDialogElement>('dialog.technology-modal-backdrop[open]')
      .forEach((dialog) => setTechnologyModal(dialog, true));
    if (document.documentElement.dataset?.footerSceneActive === 'true') {
      const wasLocked = isScrollLocked();
      footerSceneActive = true;
      syncScrollLock(wasLocked);
    }

    // Um relógio: o ticker do GSAP avança o Lenis, e cada passo do Lenis
    // atualiza o ScrollTrigger. `lagSmoothing(0)` evita que o GSAP "engula"
    // quadros após uma paradinha, o que quebraria a suavidade.
    const updateScrollTrigger = () => {
      if (!footerSceneActive || footerSceneRestoring) ScrollTrigger.update();
    };
    lenis.on('scroll', updateScrollTrigger);
    const onTick = (time: number) => {
      if (!isScrollLocked()) lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Âncoras (#home no logo) deslizam pelo Lenis em vez de saltar. Só hashes;
    // links de página (/privacy-policy) seguem navegação normal.
    const onAnchorClick = (event: MouseEvent) => {
      if (isScrollLocked() || event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const hash = anchor?.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement);
    };
    document.addEventListener('click', onAnchorClick);

    return () => {
      document.removeEventListener('technology-modal-state', onTechnologyModalState);
      document.removeEventListener('footer-scene-scroll-state', onFooterSceneState);
      document.removeEventListener('click', onAnchorClick);
      lenis.off('scroll', updateScrollTrigger);
      gsap.ticker.remove(onTick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [enabled]);
}
