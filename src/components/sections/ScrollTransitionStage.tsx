import {useEffect, useRef} from 'react';
import type {CSSProperties} from 'react';
import type {HomeCopy} from '../../config/homeContent';

const stageVideoSrc = new URL('../../../fundo_site.mp4', import.meta.url).href;

export function ScrollTransitionStage({
  copy,
  stageProgress,
  stageStyle,
  mediaShellStyle,
  imageStyle,
  videoStyle,
}: {
  copy: HomeCopy;
  stageProgress: number;
  stageStyle: CSSProperties;
  mediaShellStyle: CSSProperties;
  imageStyle: CSSProperties;
  videoStyle: CSSProperties;
}) {
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const backdropVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    for (const video of [heroVideoRef.current, backdropVideoRef.current]) {
      if (!video) continue;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => undefined);
      }
    }
  }, [stageProgress]);

  return (
    <section className="transition-stage" style={stageStyle}>
      <div className="sticky-stage">
        <div className="transition-backdrop" aria-hidden="true">
          <img className="transition-backdrop-image" src="/media/hero-space.jpg" alt="" style={imageStyle} />
          <video
            ref={backdropVideoRef}
            className="transition-backdrop-video"
            src={stageVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/media/hero-space.jpg"
            style={videoStyle}
          />
          <div className="transition-backdrop-wash" />
        </div>

        <div className="transition-media-shell" style={mediaShellStyle}>
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
            <div className="transition-overlay" />
            <div className="transition-rim" aria-hidden="true" />
            <div className="transition-beam" aria-hidden="true" />
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
              <span className="future-shell-kicker">{copy.placeholderEyebrow}</span>
              <strong>{copy.placeholderTitle}</strong>
              <p>{copy.placeholderBody}</p>
              <div className="future-shell-preview">
                <span className="future-preview-line short" />
                <span className="future-preview-line" />
                <span className="future-preview-line faint" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
