export const MOBILE_TECHNOLOGY_PAGE_SIZE = 8;

type FloatPoint = {left: number; top: number};

const MOBILE_FLOAT_POINTS: FloatPoint[] = [
  {left: 0.16, top: 0.18}, {left: 0.84, top: 0.18},
  {left: 0.1, top: 0.34}, {left: 0.9, top: 0.34},
  {left: 0.14, top: 0.58}, {left: 0.86, top: 0.58},
  {left: 0.18, top: 0.8}, {left: 0.82, top: 0.8},
];

export function getTechnologyFloatPoints(count: number, isMobile: boolean): FloatPoint[] {
  if (count <= 0) return [];
  if (isMobile) return MOBILE_FLOAT_POINTS.slice(0, count);

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
