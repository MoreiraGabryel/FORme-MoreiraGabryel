import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {gsap} from 'gsap';

type AboutCard = {
  id: string;
  title: string;
  tag: string;
  contentType: 'paragraph' | 'list';
  placeholder: string;
};

const ABOUT_CARDS: AboutCard[] = [
  {id: 'who', title: 'Quem sou', tag: 'SOBRE', contentType: 'paragraph', placeholder: '[TEXTO_QUEM_SOU]'},
  {id: 'experience', title: 'Experiências & Freelances', tag: 'TRABALHO', contentType: 'list', placeholder: '[LISTA_EXPERIENCIAS]'},
  {id: 'education', title: 'Formação', tag: 'EDUCAÇÃO', contentType: 'list', placeholder: '[LISTA_FORMACAO]'},
  {id: 'goals', title: 'Objetivos', tag: 'VISÃO', contentType: 'paragraph', placeholder: '[TEXTO_OBJETIVOS]'},
  {id: 'languages', title: 'Idiomas', tag: 'IDIOMAS', contentType: 'list', placeholder: '[LISTA_IDIOMAS]'},
];

function wrapIndex(index: number) {
  const total = ABOUT_CARDS.length;
  return (index + total) % total;
}

function AboutCardIcon({cardId}: {cardId: string}) {
  switch (cardId) {
    case 'who':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'experience':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="6.5" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9 6.5V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4 11.5h16" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case 'education':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m3 9 9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M7 11.1v4.2c0 .5.28.96.73 1.2 2.8 1.53 5.74 1.53 8.54 0 .45-.24.73-.7.73-1.2v-4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'goals':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M12 2.8v2.4M21.2 12h-2.4M12 18.8v2.4M5.2 12H2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'languages':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4.5 6.5h8M8.5 6.5c0 5.6-1.88 9.16-4 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M5 13h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M14 17.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="m16.5 7.5-3 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="m16.5 7.5 3 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function AboutCardContent({card}: {card: AboutCard}) {
  if (card.contentType === 'paragraph') {
    return <p>{card.placeholder}</p>;
  }

  return (
    <ul>
      <li>{card.placeholder}</li>
    </ul>
  );
}

export function AboutStage({
  reducedMotion = false,
  isActive = false,
}: {
  reducedMotion?: boolean;
  isActive?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const touchStartRef = useRef<{x: number; y: number; time: number} | null>(null);

  const activeCard = ABOUT_CARDS[activeIndex] ?? ABOUT_CARDS[0];

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const cards = ABOUT_CARDS.map((card) => cardRefs.current[card.id]).filter(Boolean) as HTMLDivElement[];
    if (!cards.length) return;

    const viewportWidth = viewport.getBoundingClientRect().width || window.innerWidth;
    const isMobileViewport = viewportWidth <= 720;
    const adjacentX = isMobileViewport ? viewportWidth * 0.56 : Math.min(340, viewportWidth * 0.285);
    const farX = isMobileViewport ? viewportWidth * 0.92 : Math.min(560, viewportWidth * 0.47);

    cards.forEach((cardNode, index) => {
      const total = ABOUT_CARDS.length;
      let offset = index - activeIndex;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      const absOffset = Math.abs(offset);
      const direction = offset === 0 ? 0 : offset > 0 ? 1 : -1;

      let x = 0;
      let z = 0;
      let rotateY = 0;
      let scale = 1;
      let opacity = 1;
      let y = 0;

      if (absOffset === 1) {
        x = direction * adjacentX;
        z = reducedMotion ? 0 : -150;
        rotateY = reducedMotion ? 0 : -direction * 25;
        scale = isMobileViewport ? 0.82 : 0.78;
        opacity = 0.55;
        y = 10;
      } else if (absOffset >= 2) {
        x = direction * farX;
        z = reducedMotion ? 0 : -280;
        rotateY = reducedMotion ? 0 : -direction * 34;
        scale = isMobileViewport ? 0.68 : 0.62;
        opacity = 0.18;
        y = 16;
      }

      gsap.set(cardNode, {zIndex: 40 - absOffset});
      gsap.set(cardNode, {willChange: 'transform, opacity'});
      gsap.to(cardNode, {
        duration: reducedMotion ? 0.22 : 0.72,
        ease: reducedMotion ? 'power1.out' : 'power3.out',
        xPercent: -50,
        yPercent: -50,
        x,
        y,
        z,
        rotateY,
        scale,
        opacity,
        onComplete: () => {
          gsap.set(cardNode, {clearProps: 'willChange'});
        },
      });
    });
  }, [activeIndex, reducedMotion]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setFlippedCardId(null);
        setActiveIndex((current) => wrapIndex(current + 1));
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setFlippedCardId(null);
        setActiveIndex((current) => wrapIndex(current - 1));
      }

      if (event.key === 'Escape') {
        setFlippedCardId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  const activeCardId = activeCard.id;

  const cardStates = useMemo(
    () =>
      ABOUT_CARDS.map((card, index) => ({
        card,
        index,
        isActiveCard: index === activeIndex,
        isOpen: flippedCardId === card.id,
      })),
    [activeIndex, flippedCardId],
  );

  const handleNavigate = (direction: -1 | 1) => {
    setFlippedCardId(null);
    setActiveIndex((current) => wrapIndex(current + direction));
  };

  const handleCardSelect = (index: number) => {
    if (index !== activeIndex) {
      setFlippedCardId(null);
      setActiveIndex(index);
      return;
    }

    setFlippedCardId((current) => (current === activeCardId ? null : activeCardId));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = {x: touch.clientX, y: touch.clientY, time: Date.now()};
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!start || flippedCardId) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const elapsed = Date.now() - start.time;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY) || elapsed > 600) return;
    handleNavigate(deltaX < 0 ? 1 : -1);
  };

  return (
    <div className={`about-stage${reducedMotion ? ' is-reduced-motion' : ''}`}>
      <div className="about-stage-shell">
        <div
          ref={viewportRef}
          className="about-coverflow-viewport"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="about-coverflow-track" aria-live="polite">
            {cardStates.map(({card, index, isActiveCard, isOpen}) => {
              const isHintVisible = isActiveCard && !isOpen && hoveredCardId === card.id;

              return (
                <div
                  key={card.id}
                  ref={(node) => {
                    cardRefs.current[card.id] = node;
                  }}
                  className={`about-coverflow-card${isActiveCard ? ' is-active' : ''}${isOpen ? ' is-open' : ''}`}
                  data-card-id={card.id}
                  aria-current={isActiveCard ? 'true' : undefined}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId((current) => (current === card.id ? null : current))}
                  onClick={() => handleCardSelect(index)}
                >
                  <div className="about-coverflow-card-shell">
                    <div className="about-coverflow-card-flip">
                      <div className="about-coverflow-card-face about-coverflow-card-front" aria-hidden={isOpen}>
                        <div className="about-coverflow-card-media" aria-hidden="true">
                          <div className="about-coverflow-card-media-placeholder">
                            <span className="about-coverflow-card-media-icon">
                              <AboutCardIcon cardId={card.id} />
                            </span>
                          </div>
                          <div className="about-coverflow-card-media-overlay" />
                        </div>
                        <span className="about-coverflow-card-tag">{card.tag}</span>
                        <span className="about-coverflow-card-corner-icon" aria-hidden="true">
                          <AboutCardIcon cardId={card.id} />
                        </span>
                        <div className="about-coverflow-card-copy">
                          <h3>{card.title}</h3>
                        </div>
                        <span className={`about-coverflow-card-open-hint${isHintVisible ? ' is-visible' : ''}`}>Abrir</span>
                      </div>

                      <div className="about-coverflow-card-face about-coverflow-card-back" aria-hidden={!isOpen}>
                        <button
                          type="button"
                          className="about-coverflow-card-close"
                          aria-label={`Fechar ${card.title}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setFlippedCardId(null);
                          }}
                        >
                          ×
                        </button>
                        <span className="about-coverflow-card-tag">{card.tag}</span>
                        <div className="about-coverflow-card-back-copy">
                          <h3>{card.title}</h3>
                          <AboutCardContent card={card} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="about-coverflow-nav">
            <button type="button" className="about-coverflow-arrow about-coverflow-arrow-left" aria-label="Card anterior" onClick={() => handleNavigate(-1)}>
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" className="about-coverflow-arrow about-coverflow-arrow-right" aria-label="Próximo card" onClick={() => handleNavigate(1)}>
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
