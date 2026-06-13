import {useEffect, useRef} from 'react';
import type {CSSProperties} from 'react';
import type {HomeCopy} from '../../config/homeContent';

const stageVideoSrc = new URL('../../../fundo_site.mp4', import.meta.url).href;

export function ScrollTransitionStage({
  copy,
  stageProgress,
  stageStyle,
  imageStyle,
  backdropImageStyle,
  videoStyle,
  backdropVideoStyle,
  focusVideoStyle,
}: {
  copy: HomeCopy;
  stageProgress: number;
  stageStyle: CSSProperties;
  imageStyle: CSSProperties;
  backdropImageStyle: CSSProperties;
  videoStyle: CSSProperties;
  backdropVideoStyle: CSSProperties;
  focusVideoStyle: CSSProperties;
}) {
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const backdropVideoRef = useRef<HTMLVideoElement | null>(null);
  const focusVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const leader = heroVideoRef.current;
    const followers = [backdropVideoRef.current, focusVideoRef.current].filter(Boolean) as HTMLVideoElement[];
    const videos = [leader, ...followers].filter(Boolean) as HTMLVideoElement[];

    for (const video of videos) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = video === leader ? 'auto' : 'metadata';
    }

    const safePlay = (video: HTMLVideoElement) => {
      const playPromise = video.play();
      if (playPromise) playPromise.catch(() => undefined);
    };

    for (const video of videos) safePlay(video);

    if (!leader || followers.length === 0) return;

    const syncFollowers = () => {
      for (const follower of followers) {
        if (!Number.isFinite(leader.currentTime)) continue;
        if (Math.abs((follower.currentTime || 0) - leader.currentTime) > 0.08) {
          follower.currentTime = leader.currentTime;
        }
        if (follower.paused) safePlay(follower);
      }
    };

    const onLeaderPlay = () => syncFollowers();
    const onLeaderSeek = () => syncFollowers();
    const onLeaderTimeUpdate = () => syncFollowers();
    const onLeaderRateChange = () => {
      for (const follower of followers) follower.playbackRate = leader.playbackRate;
      syncFollowers();
    };

    leader.addEventListener('play', onLeaderPlay);
    leader.addEventListener('seeked', onLeaderSeek);
    leader.addEventListener('timeupdate', onLeaderTimeUpdate);
    leader.addEventListener('ratechange', onLeaderRateChange);
    leader.addEventListener('loadeddata', onLeaderPlay);

    syncFollowers();

    return () => {
      leader.removeEventListener('play', onLeaderPlay);
      leader.removeEventListener('seeked', onLeaderSeek);
      leader.removeEventListener('timeupdate', onLeaderTimeUpdate);
      leader.removeEventListener('ratechange', onLeaderRateChange);
      leader.removeEventListener('loadeddata', onLeaderPlay);
    };
  }, []);

  useEffect(() => {
    const leader = heroVideoRef.current;
    const followers = [backdropVideoRef.current, focusVideoRef.current].filter(Boolean) as HTMLVideoElement[];
    const videos = [leader, ...followers].filter(Boolean) as HTMLVideoElement[];
    if (!leader || videos.length === 0) return;

    const freezeRamp = Math.min(Math.max((stageProgress - 0.78) / 0.18, 0), 1);
    const shouldFreeze = stageProgress >= 0.965;
    const playbackRate = 1 - freezeRamp * 0.82;

    for (const video of videos) {
      video.playbackRate = Math.max(0.18, playbackRate);
    }

    if (shouldFreeze) {
      for (const follower of followers) {
        if (Number.isFinite(leader.currentTime)) {
          follower.currentTime = leader.currentTime;
        }
      }

      for (const video of videos) video.pause();
      return;
    }

    for (const follower of followers) {
      if (Number.isFinite(leader.currentTime) && Math.abs((follower.currentTime || 0) - leader.currentTime) > 0.08) {
        follower.currentTime = leader.currentTime;
      }
    }

    for (const video of videos) {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise) playPromise.catch(() => undefined);
      }
    }
  }, [stageProgress]);

  return (
    <section className="transition-stage" style={stageStyle}>
      <div className="sticky-stage">
        <div className="transition-backdrop" aria-hidden="true">
          <img className="transition-backdrop-image" src="/media/hero-space.jpg" alt="" style={backdropImageStyle} />
          <video
            ref={backdropVideoRef}
            className="transition-backdrop-video"
            src={stageVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
              poster="/media/hero-space.jpg"
              style={backdropVideoStyle}
          />
          <div className="transition-backdrop-wash" />
        </div>

        <div className="transition-stage-media" aria-hidden="true">
          <div className="transition-media">
            <img className="transition-image" src="/media/hero-space.jpg" alt="" style={imageStyle} />
            <video
              ref={heroVideoRef}
              className="transition-video"
              src={stageVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/media/hero-space.jpg"
              style={videoStyle}
            />
            <div className="transition-video-focus" aria-hidden="true">
              <div className="transition-video-focus-aura" />
              <video
                ref={focusVideoRef}
                className="transition-video-focus-media"
                src={stageVideoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/media/hero-space.jpg"
                style={focusVideoStyle}
              />
              <div className="transition-video-focus-vignette" />
            </div>
            <div className="transition-overlay" />
          </div>
        </div>

        <div className="transition-copy">
          <div className="transition-headline">
            <p className="editorial-kicker">{copy.stageTwo}</p>
            <h2>{copy.stageTwoTitle}</h2>
          </div>

          <div className="transition-details">
            <p>{copy.stageTwoBody}</p>
            <div className="progress-card">
              <div className="panel-heading">
                <span>{copy.motionMeter}</span>
                <span>{String(Math.round(stageProgress * 100)).padStart(2, '0')}%</span>
              </div>
              <div className="progress-rail">
                <span className="progress-fill" style={{transform: `scaleX(${stageProgress})`}} />
              </div>
            </div>

            <div className="future-shell" aria-hidden="true">
              <div className="future-shell-header">
                <span className="future-shell-kicker">{copy.placeholderEyebrow}</span>
                <span className="future-shell-badge">Live layout</span>
              </div>

              <strong>{copy.placeholderTitle}</strong>
              <p>{copy.placeholderBody}</p>

              <div className="future-shell-preview">
                <div className="future-preview-stage">
                  <div className="future-preview-orb" />
                  <div className="future-preview-grid" />
                  <div className="future-preview-panel primary">
                    <span className="future-panel-label">Scene core</span>
                    <strong>Vídeo central com área limpa para módulo principal</strong>
                    <p>Bloco central preparado para conteúdo, CTA, cards ou interação futura.</p>
                  </div>

                  <div className="future-preview-stats">
                    <div className="future-mini-card">
                      <span>Signal</span>
                      <strong>{String(Math.round(stageProgress * 100)).padStart(2, '0')}%</strong>
                    </div>
                    <div className="future-mini-card">
                      <span>Field</span>
                      <strong>Video-led</strong>
                    </div>
                  </div>

                  <div className="future-preview-panel secondary">
                    <span className="future-panel-label">Future module</span>
                    <strong>Cards, showcases ou UI do próximo bloco entram aqui.</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
