export const MOBILE_TECHNOLOGY_PAGE_SIZE = 8;

type FloatPoint = {left: number; top: number};
type FloatBounds = {
  width: number;
  height: number;
  iconSize?: number;
  content?: {left: number; right: number; top: number; bottom: number};
};

export function getTechnologyFloatPoints(count: number, isMobile: boolean, bounds?: FloatBounds): FloatPoint[] {
  if (count <= 0) return [];
  if (isMobile) {
    if (bounds?.content && bounds.width > 0 && bounds.height > 0) {
      const {width, height, content} = bounds;
      const size = Math.min(bounds.iconSize ?? 60, width, height);
      const gap = 12;
      const edge = size / 2 + 8;
      const usableWidth = Math.max(size, Math.min(width - 16, 560));
      const maxColumns = Math.max(1, Math.min(4, Math.floor((usableWidth + gap) / (size + gap))));
      const bottomStart = Math.max(edge, content.bottom + size / 2 + gap);
      const bottomEnd = height - edge;
      const topStart = edge;
      const topEnd = Math.min(height - edge, content.top - size / 2 - gap);
      const capacityRows = (start: number, end: number) => end < start ? 0 : Math.floor((end - start) / (size + gap)) + 1;
      const bottomRows = capacityRows(bottomStart, bottomEnd);
      const topRows = capacityRows(topStart, topEnd);
      const columns = Math.min(maxColumns, Math.max(count > 1 ? 2 : 1, Math.ceil(count / Math.max(bottomRows + topRows, 1))));
      const grid = (amount: number, start: number, end: number) => {
        const region: FloatPoint[] = [];
        const rows = Math.ceil(amount / columns);
        for (let row = 0; row < rows; row++) {
          const length = Math.min(columns, amount - row * columns);
          const span = (length - 1) * (size + gap);
          const y = rows === 1 ? (start + end) / 2 : start + row / (rows - 1) * (end - start);
          for (let column = 0; column < length; column++) {
            region.push({left: (width / 2 - span / 2 + column * (size + gap)) / width, top: y / height});
          }
        }
        return region;
      };
      // Share the field above/below the copy; use spare capacity only when needed.
      let above = Math.min(Math.floor(count / 2), topRows * columns);
      const below = Math.min(count - above, bottomRows * columns);
      above = Math.min(count - below, topRows * columns);
      const upper = grid(above, topStart, topEnd);
      const lower = grid(below, bottomStart, bottomEnd);
      const points: FloatPoint[] = [];
      for (let index = 0; index < Math.max(upper.length, lower.length); index++) {
        if (upper[index]) points.push(upper[index]);
        if (lower[index]) points.push(lower[index]);
      }

      // Short viewports may need the side gutters, but never as the default layout.
      const sideStart = Math.max(edge, content.top);
      const sideEnd = Math.min(height - edge, content.bottom);
      const sideRows = capacityRows(sideStart, sideEnd);
      for (const x of [edge, width - edge]) {
        if (x + size / 2 + gap > content.left && x - size / 2 - gap < content.right) continue;
        const remaining = Math.min(count - points.length, sideRows);
        for (let row = 0; row < remaining; row++) {
          const y = remaining === 1 ? (sideStart + sideEnd) / 2 : sideStart + row / (remaining - 1) * (sideEnd - sideStart);
          points.push({left: x / width, top: y / height});
        }
      }
      if (points.length === count) return points;
    }
    const wide = bounds !== undefined && bounds.width > bounds.height * 1.3;
    const columns = count === 1 ? 1 : wide ? Math.ceil(count / 2) : 2;
    const rows = Math.ceil(count / columns);
    return Array.from({length: count}, (_, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const rowLength = Math.min(columns, count - row * columns);
      return {
        left: rowLength === 1 ? 0.5 : 0.08 + column / (rowLength - 1) * 0.84,
        top: rows === 1 ? 0.88 : 0.1 + row / (rows - 1) * 0.8,
      };
    });
  }

  // Topo e laterais recebem a stack; a leitura central fica livre.
  const columns = Math.max(7, Math.ceil((count - 5) / 3));
  const row = (top: number, length: number, edge: number): FloatPoint[] =>
    Array.from({length}, (_, index) => ({
      left: edge + (index / (length - 1)) * (1 - edge * 2),
      top,
    }));
  const points = [
    ...row(0.16, columns, 0.08),
    ...row(0.33, columns, 0.08),
    ...[0.52, 0.72].flatMap((top) => [0.08, 0.22, 0.78, 0.92].map((left) => ({left, top}))),
    ...row(0.88, columns - 4, 0.22),
  ];
  return Array.from({length: count}, (_, index) => points[Math.floor(index * points.length / count)]);
}

export function getTechnologyPages<T>(items: readonly T[], isMobile: boolean): T[][] {
  if (!isMobile || items.length === 0) return [[...items]];

  const pageCount = Math.ceil(items.length / MOBILE_TECHNOLOGY_PAGE_SIZE);
  const baseSize = Math.floor(items.length / pageCount);
  const remainder = items.length % pageCount;
  let offset = 0;

  return Array.from({length: pageCount}, (_, index) => {
    const size = baseSize + (index < remainder ? 1 : 0);
    const page = items.slice(offset, offset + size);
    offset += size;
    return page;
  });
}
