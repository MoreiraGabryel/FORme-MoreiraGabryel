import {useEffect, useState} from 'react';
import type {CSSProperties} from 'react';

const svgCache = new Map<string, string>();

function sanitizeSvgMarkup(markup: string) {
  let nextMarkup = markup;

  if (!/preserveAspectRatio=/.test(nextMarkup)) {
    nextMarkup = nextMarkup.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');
  }

  if (!/\swidth=/.test(nextMarkup)) {
    nextMarkup = nextMarkup.replace('<svg ', '<svg width="100%" ');
  }

  if (!/\sheight=/.test(nextMarkup)) {
    nextMarkup = nextMarkup.replace('<svg ', '<svg height="100%" ');
  }

  return nextMarkup;
}

export function TechnologyIcon({
  src,
  label,
  className,
  style,
}: {
  src: string;
  label: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [markup, setMarkup] = useState<string | null>(() => svgCache.get(src) ?? null);

  useEffect(() => {
    let cancelled = false;

    if (svgCache.has(src)) {
      setMarkup(svgCache.get(src) ?? null);
      return;
    }

    fetch(src)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(`Failed to load ${src}`))))
      .then((text) => {
        if (cancelled) return;
        const sanitized = sanitizeSvgMarkup(text);
        svgCache.set(src, sanitized);
        setMarkup(sanitized);
      })
      .catch(() => {
        if (cancelled) return;
        setMarkup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return markup ? (
    <span aria-hidden="true" className={className} style={style} dangerouslySetInnerHTML={{__html: markup}} />
  ) : (
    <span aria-hidden="true" className={`${className ?? ''} technology-icon-fallback`} style={style}>
      {label.slice(0, 2)}
    </span>
  );
}

