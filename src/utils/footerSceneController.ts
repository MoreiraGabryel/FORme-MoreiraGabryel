import {FOOTER_MAX_VISITS, isFooterSceneFullyVisible} from './footerScenePolicy';
import type {createFooterVisitCounter} from './footerScenePolicy';

export type FooterSceneState = 'idle' | 'loading' | 'playing' | 'blackout' | 'revealing' | 'exhausted' | 'disposed';
export type FooterSceneLock = {returnToTop: (signal?: AbortSignal) => void | Promise<void>; release: () => void};
export type FooterSceneClock = {now: () => number; set: (callback: () => void, delay: number) => unknown; clear: (id: unknown) => void};
type Options = {
  video: HTMLVideoElement;
  counter: ReturnType<typeof createFooterVisitCounter>;
  acquireLock: () => FooterSceneLock;
  onState: (state: FooterSceneState) => void;
  onTime?: (mediaTime: number) => void;
  clock?: FooterSceneClock;
};

export function createFooterSceneController(options: Options) {
  const {video, counter} = options;
  const clock = options.clock ?? {
    now: () => performance.now(),
    set: (callback: () => void, delay: number) => setTimeout(callback, delay),
    clear: (id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>),
  };
  let state: FooterSceneState = counter.read() >= FOOTER_MAX_VISITS ? 'exhausted' : 'idle';
  let armed = true;
  let counted = false;
  let admission: AbortController | undefined;
  let restoration: AbortController | undefined;
  let retryRestoration: (() => void) | undefined;
  let restorationDeadline: {remaining: number; due: number; callback: () => void; handle?: unknown} | undefined;
  const pauseRestorationDeadline = () => {
    if (!restorationDeadline || restorationDeadline.handle === undefined) return;
    clock.clear(restorationDeadline.handle);
    restorationDeadline.remaining = Math.max(0, restorationDeadline.due - clock.now());
    restorationDeadline.handle = undefined;
  };
  const resumeRestorationDeadline = () => {
    if (!visible || !restorationDeadline || restorationDeadline.handle !== undefined) return;
    const task = restorationDeadline;
    task.due = clock.now() + task.remaining;
    task.handle = clock.set(task.callback, task.remaining);
  };
  let lock: FooterSceneLock | undefined;
  let visible = true;
  let playAttempt = 0;
  let phase: {callback: () => void; remaining: number; due: number; handle?: unknown} | undefined;
  let frame: number | undefined;
  let watchdog: unknown;
  let lastMediaTime = 0;
  let lastProgressAt = 0;
  const active = () => state === 'loading' || state === 'playing' || state === 'blackout' || state === 'revealing';
  const setState = (next: FooterSceneState) => {state = next;options.onState(next);};
  const abortAdmission = () => {admission?.abort();admission = undefined;};
  const release = () => {
    clock.clear(restorationDeadline?.handle);restorationDeadline = undefined;retryRestoration = undefined;
    restoration?.abort();restoration = undefined;lock?.release();lock = undefined;
  };
  const stopWatchdog = () => {clock.clear(watchdog);watchdog = undefined;};
  const startWatchdog = () => {
    if (!visible || watchdog !== undefined || (state !== 'loading' && state !== 'playing')) return;
    watchdog = clock.set(() => {
      watchdog = undefined;
      if (clock.now() - lastProgressAt >= 8000) finish();
      else startWatchdog();
    }, 500);
  };
  const resumePhase = () => {
    if (!phase || !visible) return;
    const task = phase;
    task.due = clock.now() + task.remaining;
    task.handle = clock.set(() => {
      if (phase !== task) return;
      phase = undefined;
      task.callback();
    }, task.remaining);
  };
  const pausePhase = () => {
    if (!phase) return;
    clock.clear(phase.handle);
    phase.remaining = Math.max(0, phase.due - clock.now());
    phase.handle = undefined;
  };
  const schedulePhase = (callback: () => void, delay: number) => {
    if (phase) clock.clear(phase.handle);
    phase = {callback, remaining: delay, due: clock.now() + delay};
    resumePhase();
  };
  const stopFrames = () => {
    if (frame !== undefined) video.cancelVideoFrameCallback?.(frame);
    frame = undefined;
  };
  const reportTime = (mediaTime: number) => {
    if (!visible || state !== 'playing' || !Number.isFinite(mediaTime)) return;
    if (mediaTime > lastMediaTime + .001) {
      lastMediaTime = mediaTime;
      lastProgressAt = clock.now();
    }
    options.onTime?.(Math.max(0, mediaTime));
  };
  const queueFrame = () => {
    if (!visible || state !== 'playing' || frame !== undefined || !video.requestVideoFrameCallback) return;
    frame = video.requestVideoFrameCallback((_now, metadata) => {
      frame = undefined;
      reportTime(metadata.mediaTime);
      queueFrame();
    });
  };
  const timeUpdated = () => {if (!video.requestVideoFrameCallback) reportTime(video.currentTime);};
  const finish = () => {
    if (state !== 'playing' && state !== 'loading') return;
    abortAdmission();
    playAttempt++;
    stopWatchdog();
    stopFrames();
    video.pause();
    setState('blackout');
    schedulePhase(() => {
      const restore = () => {
        if (phase) clock.clear(phase.handle);
        phase = undefined;
        restoration?.abort();
        const request = new AbortController();
        restoration = request;
        const complete = (success: boolean) => {
          if (restoration !== request || request.signal.aborted) return;
          pauseRestorationDeadline();
          if (phase) clock.clear(phase.handle);
          phase = undefined;
          if (!success || restorationDeadline?.remaining === 0) {
            release();
            setState(counter.read() >= FOOTER_MAX_VISITS ? 'exhausted' : 'idle');
            return;
          }
          setState('revealing');
          schedulePhase(() => {
            release();
            setState(counter.read() >= FOOTER_MAX_VISITS ? 'exhausted' : 'idle');
          }, 240);
        };
        try {
          const pending = lock?.returnToTop(request.signal);
          if (pending) {
            // Share one visible-time budget across retries; readiness is not a timeout.
            restorationDeadline ??= {remaining: 4000, due: clock.now(), callback: () => {}};
            restorationDeadline.callback = () => complete(false);
            resumeRestorationDeadline();
            const settled = (success: boolean) => {
              if (restoration !== request || request.signal.aborted) return;
              if (visible) complete(success);
              else schedulePhase(() => complete(success), 0);
            };
            pending.then(() => settled(true), () => settled(false));
          } else if (visible) complete(true);
          else schedulePhase(() => complete(true), 0);
        } catch {complete(false);}
      };
      retryRestoration = restore;
      restore();
    }, 180);
  };
  const playing = () => {
    if (!visible || (state !== 'loading' && state !== 'playing')) return;
    if (counted && !admission) {setState('playing');queueFrame();return;}
    // The playing event proves actual playback (not buffering). Keep it hidden
    // and paused until serialized admission completes, even if another tab waits.
    video.pause();
    if (admission) return;
    const request = new AbortController();
    admission = request;
    const admitted = (allowed: boolean) => {
      if (admission !== request || request.signal.aborted || !visible || state !== 'loading') return;
      admission = undefined;
      if (!allowed) {
        playAttempt++;
        stopWatchdog();
        stopFrames();
        video.pause();
        release();
        setState('exhausted');
        return;
      }
      lastProgressAt = clock.now();
      setState('playing');
      play();
      queueFrame();
    };
    counter.consume(request.signal, () => {
      // Ownership survives hiding; this acknowledgment must not play or publish UI.
      if (admission === request && state === 'loading') counted = true;
    }).then(admitted, () => admitted(false));
  };
  const play = () => {
    const attempt = ++playAttempt;
    const rejected = (error: unknown) => {
      if (attempt !== playAttempt || !visible || (state !== 'loading' && state !== 'playing')) return;
      if (!video.muted && (error as {name?: string})?.name === 'NotAllowedError') {
        video.muted = true;
        play();
      } else finish();
    };
    try {video.play().catch(rejected);}
    catch (error) {rejected(error);}
  };
  video.addEventListener('playing', playing);
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);
  video.addEventListener('timeupdate', timeUpdated);
  return {
    getState: () => state,
    checkViewport(rect: {top: number; bottom: number}, viewportHeight: number) {
      const full = isFooterSceneFullyVisible(rect, viewportHeight);
      if (!full) {if (!active()) armed = true;return;}
      if (!visible || state !== 'idle' || !armed) return;
      if (counter.read() >= FOOTER_MAX_VISITS) {setState('exhausted');return;}
      armed = false;
      counted = false;
      try {lock = options.acquireLock();}
      catch {return;}
      setState('loading');
      video.currentTime = 0;
      video.muted = false;
      video.loop = false;
      video.playsInline = true;
      video.playbackRate = 1;
      lastMediaTime = 0;
      lastProgressAt = clock.now();
      play();
      startWatchdog();
    },
    setVisible(next: boolean) {
      if (state === 'disposed' || next === visible) return;
      visible = next;
      if (!visible) {
        abortAdmission();
        playAttempt++;
        if (active()) video.pause();
        stopFrames();
        stopWatchdog();
        pausePhase();
        pauseRestorationDeadline();
        if (restoration && (state === 'blackout' || state === 'revealing')) {
          setState('blackout');
          retryRestoration?.();
        }
      } else if (state === 'loading' || state === 'playing') {
        lastProgressAt = clock.now();
        play();
        startWatchdog();
      }
      else {
        if (state === 'blackout') resumeRestorationDeadline();
        resumePhase();
      }
    },
    cancel() {
      if (state === 'disposed') return;
      abortAdmission();
      playAttempt++;
      if (phase) clock.clear(phase.handle);
      phase = undefined;
      stopWatchdog();
      stopFrames();
      video.pause();
      release();
      armed = false;
      setState(counter.read() >= FOOTER_MAX_VISITS ? 'exhausted' : 'idle');
    },
    dispose() {
      abortAdmission();
      playAttempt++;
      if (phase) clock.clear(phase.handle);
      phase = undefined;
      stopWatchdog();
      stopFrames();
      video.pause();
      release();
      video.removeEventListener('playing', playing);
      video.removeEventListener('ended', finish);
      video.removeEventListener('error', finish);
      video.removeEventListener('timeupdate', timeUpdated);
      state = 'disposed';
    },
  };
}
