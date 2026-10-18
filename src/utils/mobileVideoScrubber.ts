const FRAME = 1 / 24;
const EPSILON = FRAME / 2;

/** A bounded, presentation-acknowledged cursor for the mobile portal only. */
export function createMobileVideoScrubber(video: HTMLVideoElement, maxSeekStep: number, onPresented: (progress: number | null) => void) {
  let active = false;
  let disposed = false;
  let generation = 0;
  let desired = 0;
  let presented: number | null = null;
  let requested: number | undefined;
  let primed = false;
  let priming = false;
  let raf: number | undefined;
  let frame: number | undefined;
  const step = Number.isFinite(maxSeekStep) && maxSeekStep > 0 ? Math.max(FRAME, maxSeekStep) : FRAME;
  const supportsFrames = typeof video.requestVideoFrameCallback === 'function';
  const visible = () => typeof document === 'undefined' || !document.hidden;
  const available = () => active && !disposed && visible();
  const cancel = () => {
    generation++;
    if (raf !== undefined) window.cancelAnimationFrame(raf);
    if (frame !== undefined) video.cancelVideoFrameCallback?.(frame);
    raf = frame = requested = undefined;
    priming = false;
    video.pause();
  };
  const accept = (time: number, owner: number) => {
    if (!available() || owner !== generation || requested === undefined || video.seeking ||
      video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) return false;
    // Priming can leave currentTime off-grid; rVFC reports the containing frame's start.
    const expected = supportsFrames ? Math.floor(requested / FRAME + 0.000001) * FRAME : requested;
    if (Math.abs(time - expected) > EPSILON + 0.000001) return false;
    const reachable = Math.max(0, video.duration - FRAME);
    presented = Math.min(Math.max(time, 0), reachable);
    requested = undefined;
    onPresented(reachable === 0 || Math.abs(presented - reachable) < EPSILON ? 1 : presented / reachable);
    // Let this frame paint before asking the decoder for the following one.
    if (raf === undefined) raf = window.requestAnimationFrame(() => {
      if (disposed || owner !== generation) return;
      raf = undefined;
      flush();
    });
    return true;
  };
  const watchFrame = (owner: number) => {
    frame = video.requestVideoFrameCallback((_now, metadata) => {
      if (!available() || owner !== generation || requested === undefined) return;
      frame = undefined;
      if (!accept(metadata.mediaTime, owner)) watchFrame(owner);
    });
  };
  const prime = () => {
    const owner = generation;
    primed = true;
    priming = true;
    const settled = () => {
      // A retired play promise must not seek or pause a newer owner.
      if (disposed || owner !== generation || !active) return;
      video.pause();
      priming = false;
      flush();
    };
    try {Promise.resolve(video.play()).then(settled, settled);}
    catch {settled();}
  };
  const flush = () => {
    if (!available() || priming || raf !== undefined || requested !== undefined || video.seeking) return;
    if (!primed) {prime();return;}
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const reachable = Math.max(0, video.duration - FRAME);
    const target = desired === 1 ? reachable : Math.min(reachable, Math.floor(desired * reachable / FRAME + 0.000001) * FRAME);
    const cursor = presented ?? Math.min(Math.max(video.currentTime, 0), reachable);
    if (presented !== null && Math.abs(cursor - target) < EPSILON) return;
    if (presented !== null) onPresented(null);
    requested = cursor + Math.min(Math.max(target - cursor, -step), step);
    const owner = generation;
    if (supportsFrames) watchFrame(owner);
    try {
      video.currentTime = requested;
      if (!supportsFrames && !video.seeking) accept(video.currentTime, owner);
    } catch {
      if (frame !== undefined) video.cancelVideoFrameCallback?.(frame);
      frame = requested = undefined;
    }
  };
  const ready = () => {
    if (!supportsFrames && requested !== undefined) accept(video.currentTime, generation);
    else flush();
  };
  const visibilityChanged = () => {
    if (!active || disposed) return;
    cancel();
    presented = null;
    primed = false;
    onPresented(null);
    if (visible()) flush();
  };
  video.muted = video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = video.loop = false;
  video.preload = 'auto';
  video.addEventListener('seeked', ready);
  video.addEventListener('loadedmetadata', ready);
  video.addEventListener('loadeddata', ready);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visibilityChanged);
  return {
    update(progress: number, enabled: boolean) {
      desired = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
      if (!enabled) {
        active = false;
        cancel();
        primed = false;
        presented = null;
        onPresented(null);
        return;
      }
      if (!active) {
        active = true;
        generation++;
        primed = false;
        presented = null;
        onPresented(null);
      }
      flush();
    },
    dispose() {
      disposed = true;
      active = false;
      cancel();
      video.removeEventListener('seeked', ready);
      video.removeEventListener('loadedmetadata', ready);
      video.removeEventListener('loadeddata', ready);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', visibilityChanged);
    },
  };
}
