import type {CSSProperties} from 'react';
import type {HomeCopy} from '../../config/homeContent';

export function ScrollTransitionStage({
  copy,
  stageProgress,
  rawStageProgress,
  stageStyle,
}: {
  copy: HomeCopy;
  stageProgress: number;
  rawStageProgress: number;
  stageStyle: CSSProperties;
}) {
  const freezeBlend = Math.min(Math.max((rawStageProgress - 0.84) / 0.08, 0), 1);
  const stageActive = rawStageProgress > 0.02 && rawStageProgress < 0.985;

  return (
    <section className={`transition-stage${stageActive ? ' is-active' : ''}`} style={stageStyle}>
      <div className="sticky-stage">
        <div className="transition-backdrop" aria-hidden="true">
          <div className="transition-backdrop-wash" />
          <div className="transition-bridge-tail" />
        </div>

        <div className="transition-stage-media" aria-hidden="true">
          <div className="transition-media">
            <div className="transition-image-focus" aria-hidden="true">
              <div className="transition-image-focus-aura" />
              <div className="transition-image-focus-vignette" />
            </div>
            <div className="transition-image-parallax-sheen" style={{opacity: 0.06 + stageProgress * 0.06}} />
            <div className="transition-image-orbitals" style={{opacity: 0.08 + stageProgress * 0.08 - freezeBlend * 0.03}} />
            <div className="transition-image-center-pulse" style={{opacity: 0.14 + stageProgress * 0.1 - freezeBlend * 0.04}} />
            <div className="transition-image-flow-lines" style={{opacity: 0.04 + stageProgress * 0.05}} />
            <div className="transition-bridge-core" />
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
                    <strong>Imagem viva com profundidade e espaço limpo para módulo principal</strong>
                    <p>Campo visual imersivo sustentado por scroll, sem custo de vídeo na transição.</p>
                  </div>

                  <div className="future-preview-stats">
                    <div className="future-mini-card">
                      <span>Signal</span>
                      <strong>{String(Math.round(stageProgress * 100)).padStart(2, '0')}%</strong>
                    </div>
                    <div className="future-mini-card">
                      <span>Field</span>
                      <strong>Image-led</strong>
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
