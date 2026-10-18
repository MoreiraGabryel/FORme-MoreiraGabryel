import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {gsap} from 'gsap';
import type {Locale} from '../../i18n/useTranslation';
import {createFooterVisitCounter, FOOTER_MAX_VISITS} from '../../utils/footerScenePolicy';
import {createFooterSceneController} from '../../utils/footerSceneController';
import type {FooterSceneState} from '../../utils/footerSceneController';
import {acquireFooterSceneInputLock} from '../../utils/footerSceneInputLock';
import './FinalFooterStage.css';
import {readIsMobileViewport} from '../../utils/mobileViewport';

type Props = {enabled: boolean; locale: Locale; onRestore?: (signal: AbortSignal) => Promise<void>};
const isActive = (state: FooterSceneState) => state === 'loading' || state === 'playing' || state === 'blackout' || state === 'revealing';
// Decorative source/trace samples only: never execute these or read browser logs.
const codeStreams = [
  ['0x0000ff40  FRAME_BUFFER / READ_FAULT', 'function present(frame: VideoFrame) {', '  const surface = compositor.acquire();', '  surface.attach(frame.texture);', '  queue.flush(frame.timestamp);', '  return surface.commit();', '}', 'Uncaught TypeError: surface is undefined', '    at present (render/frame.ts:184:17)', '    at flush (runtime/queue.ts:92:8)', '    at tick (runtime/clock.ts:41:12)', 'E_FRAME_COMMIT :: fence not signaled'],
  ['[render.worker] sequence = 0x00007fff', 'const pipeline = device.createPipeline({', '  vertex: shaders.vertex,', '  fragment: shaders.fragment,', '  target: swapchain.current,', '});', 'pipeline.bind(framebuffer);', 'InvalidStateError: context is lost', '    at bind (gpu/pipeline.ts:207:9)', '    at submit (gpu/commands.ts:66:4)', 'GPU_QUEUE / COMMAND_BUFFER_REJECTED', '0x001af04c  00 ff 00 00 7e 3a ff 00'],
  ['[scheduler] pending_jobs = 0x01ff', 'while (queue.length > 0) {', '  const task = queue.shift();', '  task.resolve(scene.current);', '  scheduler.flushMicrotasks();', '}', 'RangeError: Maximum call stack size exceeded', '    at reconcile (scene/tree.ts:318:14)', '    at reconcile (scene/tree.ts:318:14)', '    at reconcile (scene/tree.ts:318:14)', 'E_REENTRY / INVALID_RENDER_PHASE', 'stack_pointer = 0x00000000'],
  ['struct FrameHeader {', '  uint32_t sequence;', '  uint64_t timestamp;', '  uint8_t payload[4096];', '};', 'frame->sequence ^= 0x0000ffff;', 'memcpy(surface, frame->payload, stride);', 'ACCESS_VIOLATION / READ 0x00000000', '#00 compositor::copy_frame + 0x002a', '#01 compositor::submit + 0x00c4', '#02 scene::render_loop + 0x001f', 'FRAME_INTEGRITY / CHECKSUM_MISMATCH'],
  ['const graph = scene.resolve(root);', 'const nodes = graph.flatten();', 'for (const node of nodes) {', '  node.matrix = parent.world * node.local;', '  renderPass.attach(node.surface);', '}', 'ReferenceError: parent is not defined', '    at traverse (scene/graph.ts:109:22)', '    at render (scene/pass.ts:73:11)', 'E_GRAPH_CYCLE :: root -> root', 'node[0x003c] state = DETACHED', 'recovery_queue = [null, null, null]'],
  ['[wasm] function[184] offset=0x00af', '(func $copy_frame (param $ptr i32)', '  local.get $ptr', '  i32.load offset=16', '  call $submit_surface', ')', 'RuntimeError: memory access out of bounds', '    at wasm-function[184]:0x00af', '    at wasm-function[42]:0x091c', 'linear_memory[0x00ff] = ?? ?? ?? ??', 'E_SURFACE_MAP / INVALID_BYTE_OFFSET', 'abort_pending = true;'],
  ['[sync] expected=0x104a received=0xffff', 'Promise.all(renderTasks).then(commit);', 'const fence = await queue.onSubmitted();', 'if (fence.sequence !== frame.sequence) {', '  renderer.invalidate(frame.id);', '}', 'AbortError: frame submission interrupted', '    at commit (render/surface.ts:86:6)', '    at flush (runtime/queue.ts:92:8)', 'E_TIMESTAMP / NON_MONOTONIC_SEQUENCE', '>> 00 7a ff 18 00 00 ?? ?? 6c 01', 'reconcile(root, UNKNOWN_FRAME);'],
  ['const layout = root.getSnapshot();', 'const next = compose(layout, frame);', 'scene.swap(next);', 'viewport.invalidate(ALL_LAYERS);', 'transaction.commit();', 'DOMException: The operation was aborted', '    at swap (scene/compositor.ts:51:19)', '    at update (scene/runtime.ts:128:3)', 'E_SURFACE_OWNERSHIP / OWNER_MISSING', '[panic] render_tree != snapshot_tree', '0x00000000 -> 0xdeadbeef -> null', 'return_to_origin();'],
];

/** The black section remains in the journey; playback lives outside the inert app. */
export function FinalFooterStage({enabled, locale, onRestore}: Props) {
  // Prefer the existing black composite on mobile; keep the decoder stable through orientation changes.
  const [preferMobileMedia] = useState(readIsMobileViewport);
  const restoreRef = useRef(onRestore);
  useLayoutEffect(() => {restoreRef.current = onRestore;}, [onRestore]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<FooterSceneState>('idle');

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!enabled || !section || !video || !overlay) return;
    const effects = overlay.querySelector<HTMLElement>('.footer-scene-effects');
    const composition = overlay.querySelector<HTMLElement>('.footer-scene-composition');
    const streams = Array.from(overlay.querySelectorAll<HTMLElement>('.footer-scene-code-stream'));
    const tracks = Array.from(overlay.querySelectorAll<HTMLElement>('.footer-scene-code-track'));
    const dropout = overlay.querySelector<HTMLElement>('.footer-scene-dropout');
    const collapseLine = overlay.querySelector<HTMLElement>('.footer-scene-collapse-line');
    const ruptures = Array.from(overlay.querySelectorAll<HTMLElement>('.footer-scene-rupture'));
    const canvas = overlay.querySelector<HTMLCanvasElement>('.footer-scene-torn-frame');
    let drawing: CanvasRenderingContext2D | null = null;
    try {drawing = canvas?.getContext('2d') ?? null;} catch { /* CSS rupture remains available without canvas. */ }

    const signal = overlay.querySelector<HTMLElement>('.footer-scene-signal');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let mediaTime = 0;
    let effectContext: gsap.Context | undefined;
    let interference: gsap.core.Timeline | undefined;
    const drawRupture = (time: number) => {
      overlay.dataset.torn = 'false';
      if (reduced.matches || time < 0.35 || time >= 9.7 || !canvas || !drawing || video.readyState < 2) return;
      const {width, height} = canvas;
      const strength = time < 6.4 ? 0.12 : Math.min(1, 0.35 + (time - 6.4) / 2);
      try {
        drawing.clearRect(0, 0, width, height);
        // Slice the current decoded frame, never start extra video decoders.
        for (let band = 0; band < 8; band++) {
          const top = band * height / 8;
          const offset = Math.sin((time - 6.4) * 8 + band * 1.7) * 32 * strength;
          drawing.drawImage(video, 0, band * video.videoHeight / 8, video.videoWidth, video.videoHeight / 8,
            offset, top, width, height / 8);
        }
        overlay.dataset.torn = 'true';
      } catch { /* Keep the original video if the frame cannot be copied. */ }
    };
    const updateMotionPreference = () => {
      overlay.dataset.reducedMotion = String(reduced.matches);
      effectContext?.revert();
      if (!effects || !signal || !composition || !dropout || !collapseLine) return;
      effectContext = gsap.context(() => {
        const quiet = reduced.matches;
        gsap.set(composition, {opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, force3D: true});
        gsap.set(effects, {opacity: 0});
        gsap.set(streams, {opacity: 0, x: quiet ? 0 : (index) => index % 2 ? 48 : -48, y: 0, rotation: 0, force3D: true});
        gsap.set(tracks, {yPercent: 0, force3D: true});
        gsap.set(dropout, {opacity: 0});
        gsap.set(ruptures, {opacity: 0, xPercent: 0, skewX: 0});
        gsap.set(collapseLine, {opacity: 0, scaleX: 1});
        gsap.set(signal, {opacity: 0, xPercent: 0, scaleX: 1});
        interference = gsap.timeline({paused: true})
          .to(effects, {opacity: 1, duration: quiet ? 0.8 : 0.35}, 0.15)
          .to(streams, {opacity: (index) => index > 5 ? 0.28 : quiet ? 0.32 : 0.58,
            x: 0, duration: quiet ? 0.8 : 0.45, stagger: quiet ? 0 : 0.16, ease: 'power2.out'}, 0.2)
          .to(streams, {opacity: (index) => index > 5 ? quiet ? 0.25 : 0.46 : quiet ? 0.45 : 0.88,
            duration: quiet ? 0.8 : 0.3}, 6.4);
        if (!quiet) {
          interference
            .to(tracks, {yPercent: -100 / 3, duration: 3.1, repeat: 1, ease: 'none'}, 0.2)
            .to(tracks, {yPercent: -200 / 3, duration: 2.45, ease: 'power2.in'}, 6.4)
            .to(signal, {opacity: 0.16, duration: 0.5}, 0.35)
            .to(composition, {x: -12, y: 5, rotation: -0.6, duration: 0.08, ease: 'power2.out'}, 6.4)
            .to(composition, {x: 7, y: -3, rotation: 0.3, duration: 0.12}, 6.48)
            .to(composition, {x: 0, y: 0, rotation: 0, duration: 0.2}, 6.6)
            .to(ruptures, {opacity: 0.65, xPercent: (index) => index % 2 ? 9 : -9, skewX: (index) => index % 2 ? 7 : -7, duration: 0.2, stagger: 0.06}, 6.4)
            .to(ruptures, {xPercent: (index) => index % 2 ? -15 : 15, opacity: 0.85, duration: 0.65, stagger: 0.08}, 7.35)
            .to(signal, {opacity: 0.35, xPercent: 15, duration: 1.8, ease: 'power2.inOut'}, 6.4)
            .to(streams, {x: (index) => index % 2 ? -90 : 90, y: (index) => index % 2 ? 24 : -24,
              rotation: (index) => index % 2 ? -2 : 2, duration: 0.45, stagger: 0.025, ease: 'power2.in'}, 8.2)
            .to(composition, {scale: 0.7, duration: 0.24, ease: 'power3.in'}, 8.85)
            .to(composition, {scaleY: 0.018, scaleX: 0.88, duration: 0.32, ease: 'power4.in'}, 9.09)
            .to(collapseLine, {opacity: 0.75, scaleX: 0.7, duration: 0.12}, 9.29)
            .to(composition, {scaleX: 0, opacity: 0, duration: 0.24, ease: 'power3.in'}, 9.41)
            .to(collapseLine, {scaleX: 0, opacity: 0, duration: 0.24, ease: 'power3.in'}, 9.41);
          // Sparse dark signal losses, never an independent or white/black strobe.
          for (const beat of [0.65, 2.05, 3.45, 4.85, 6.45, 7.75, 8.65]) {
            interference.to(dropout, {opacity: beat < 6.4 ? 0.7 : 0.86, duration: 0.1, ease: 'power2.in'}, beat)
              .to(dropout, {opacity: 0, duration: 0.22, ease: 'power2.out'}, beat + 0.1);
          }
        } else {
          interference.to(composition, {opacity: 0, duration: 0.55}, 9.1);
        }
        interference.time(mediaTime, true);
      }, overlay);
      drawRupture(mediaTime);
    };
    updateMotionPreference();
    reduced.addEventListener('change', updateMotionPreference);
    let storage: Storage | undefined;
    try {storage = window.localStorage;} catch { /* Local-only fallback when site storage is denied. */ }
    const counter = createFooterVisitCounter(storage);
    const applyState = (next: FooterSceneState) => {
      overlay.dataset.state = next;
      overlay.hidden = !isActive(next);
      if (next === 'revealing') document.documentElement.dataset.footerSceneReturning = 'true';
      else delete document.documentElement.dataset.footerSceneReturning;
      if (next === 'loading') {
        mediaTime = 0;
        interference?.pause(0);
        overlay.dataset.frameReady = 'false';
        overlay.dataset.torn = 'false';
        overlay.dataset.mediaPhase = 'entrance';
      }
      setState(next);
    };
    const controller = createFooterSceneController({
      video, counter,
      acquireLock: () => acquireFooterSceneInputLock(document, window, signal => {
        if (!restoreRef.current) return Promise.reject(new Error('Scene restoration owner is missing'));
        return restoreRef.current(signal);
      }),
      onState: applyState,
      onTime(time) {
        mediaTime = time;
        // The presented video frame is the only clock; no free-running glitch timers.
        interference?.time(time, true);
        drawRupture(time);
        overlay.dataset.frameReady = String(!preferMobileMedia || time > 0 && video.readyState >= 2 && !video.seeking);
        const phase = time < 2.8 ? 'entrance' : time < 6.4 ? 'character' : time < 9.1 ? 'interference' : 'collapse';
        if (overlay.dataset.mediaPhase !== phase) overlay.dataset.mediaPhase = phase;
      },
    });
    applyState(controller.getState());
    controller.setVisible(!document.hidden);


    let prepared = false;
    let request: number | undefined;
    const check = () => {
      request = undefined;
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      const rect = section.getBoundingClientRect();
      if (!prepared && !document.hidden && counter.read() < FOOTER_MAX_VISITS && rect.top < offset + height * 2 && rect.bottom > offset) {
        prepared = true;
        video.preload = 'auto';
        video.load();
      }
      controller.checkViewport({top: rect.top - offset, bottom: rect.bottom - offset}, height);
    };
    const requestCheck = () => {if (request === undefined) request = window.requestAnimationFrame(check);};
    const visibilityChanged = () => {controller.setVisible(!document.hidden);requestCheck();};
    const pageHidden = () => controller.cancel();
    const pageRestored = () => {controller.setVisible(!document.hidden);requestCheck();};
    window.addEventListener('scroll', requestCheck, {passive: true});
    window.addEventListener('resize', requestCheck);
    window.visualViewport?.addEventListener('resize', requestCheck);
    window.visualViewport?.addEventListener('scroll', requestCheck);
    window.addEventListener('pagehide', pageHidden);
    window.addEventListener('pageshow', pageRestored);
    document.addEventListener('visibilitychange', visibilityChanged);
    check();
    return () => {
      window.removeEventListener('scroll', requestCheck);
      window.removeEventListener('resize', requestCheck);
      window.visualViewport?.removeEventListener('resize', requestCheck);
      window.visualViewport?.removeEventListener('scroll', requestCheck);
      window.removeEventListener('pagehide', pageHidden);
      window.removeEventListener('pageshow', pageRestored);
      document.removeEventListener('visibilitychange', visibilityChanged);
      reduced.removeEventListener('change', updateMotionPreference);
      if (request !== undefined) window.cancelAnimationFrame(request);
      controller.dispose();
      effectContext?.revert();
      delete document.documentElement.dataset.footerSceneReturning;
      overlay.hidden = true;
    };
  }, [enabled, preferMobileMedia]);

  const active = enabled && isActive(state);
  return (
    <>
      <section ref={sectionRef} className="final-blackout-stage" data-section="final-blackout" aria-hidden="true" />
      {typeof document !== 'undefined' && createPortal(
        <div
          ref={overlayRef}
          className="footer-scene-overlay"
          data-footer-scene-overlay=""
          data-state={state}
          hidden={!active}
          aria-busy={active}
        >
          <span className="sr-only" role="status">{locale === 'en' ? 'Final sequence in progress.' : 'Cena de encerramento em andamento.'}</span>
          <div className="footer-scene-composition">
          <video
            ref={videoRef}
            className="footer-scene-character"
            preload="none"
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
          >
            <source src={preferMobileMedia ? '/media/footer-character-mobile.mp4' : '/media/footer-character.webm'} type={preferMobileMedia ? 'video/mp4' : 'video/webm'} />
            <source src={preferMobileMedia ? '/media/footer-character.webm' : '/media/footer-character.mp4'} type={preferMobileMedia ? 'video/webm' : 'video/mp4'} />
          </video>
          <canvas className="footer-scene-torn-frame" width={720} height={1148} aria-hidden="true" />
          <div className="footer-scene-effects" aria-hidden="true">
            <div className="footer-scene-signal" />
            <div className="footer-scene-ruptures">
              {[0, 1, 2, 3].map(band => <div key={band} className="footer-scene-rupture" />)}
            </div>
            {codeStreams.map((lines, index) => (
              <pre className="footer-scene-code-stream" data-stream={index} key={index}>
                <code className="footer-scene-code-track">
                  {[0, 1, 2].map(copy => <span key={copy}>{[...lines, ...codeStreams[(index + 3) % codeStreams.length]].join('\n') + '\n'}</span>)}
                </code>
              </pre>
            ))}
          </div>
          <div className="footer-scene-dropout" aria-hidden="true" />
          </div>
          <div className="footer-scene-collapse-line" aria-hidden="true" />
        </div>,
        document.body,
      )}
    </>
  );
}
