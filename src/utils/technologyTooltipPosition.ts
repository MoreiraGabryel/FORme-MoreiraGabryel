type Rect = {left: number; top: number; width: number; height: number};
type Size = {width: number; height: number};

export function getTechnologyTooltipPosition(anchor: Rect, card: Size, viewport: Size) {
  const padding = 14;
  const gap = 16;
  const clamp = (value: number, max: number) => Math.max(padding, Math.min(value, max));
  const above = anchor.top - card.height - gap;

  return {
    left: clamp(anchor.left + (anchor.width - card.width) / 2, viewport.width - card.width - padding),
    top: clamp(above >= padding ? above : anchor.top + anchor.height + gap, viewport.height - card.height - padding),
  };
}
