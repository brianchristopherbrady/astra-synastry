import type { AspectHit, AspectPattern, PointName, PointPosition } from "@astro/shared";

function aspectKey(a: PointName, b: PointName): string {
  return [a, b].sort().join("|");
}

function buildAspectMap(aspects: AspectHit[]): Map<string, AspectHit> {
  const map = new Map<string, AspectHit>();
  for (const hit of aspects) {
    map.set(aspectKey(hit.pointA, hit.pointB), hit);
  }
  return map;
}

function aspectBetween(map: Map<string, AspectHit>, a: PointName, b: PointName): AspectHit | undefined {
  return map.get(aspectKey(a, b));
}

function combinations<T>(items: T[], size: number): T[][] {
  const results: T[][] = [];
  const combo: T[] = [];
  function helper(start: number): void {
    if (combo.length === size) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      combo.push(items[i]!);
      helper(i + 1);
      combo.pop();
    }
  }
  helper(0);
  return results;
}

function detectStelliums(points: Partial<Record<PointName, PointPosition>>, names: PointName[]): AspectPattern[] {
  const bySign = new Map<string, PointName[]>();
  for (const name of names) {
    if (name === "ascendant" || name === "midheaven" || name === "vertex") continue;
    const pos = points[name];
    if (!pos) continue;
    const list = bySign.get(pos.sign) ?? [];
    list.push(name);
    bySign.set(pos.sign, list);
  }
  const patterns: AspectPattern[] = [];
  for (const [sign, list] of bySign) {
    if (list.length >= 3) {
      patterns.push({ type: "stellium", points: list, description: `${list.length} points concentrated in ${sign}` });
    }
  }
  return patterns;
}

function detectGrandTrine(map: Map<string, AspectHit>, combo: PointName[]): AspectPattern | null {
  const [a, b, c] = combo as [PointName, PointName, PointName];
  if (
    aspectBetween(map, a, b)?.aspect === "trine" &&
    aspectBetween(map, b, c)?.aspect === "trine" &&
    aspectBetween(map, a, c)?.aspect === "trine"
  ) {
    return { type: "grandTrine", points: combo, description: `Grand trine linking ${a}, ${b}, ${c}` };
  }
  return null;
}

function detectTSquare(map: Map<string, AspectHit>, combo: PointName[]): AspectPattern | null {
  const [p1, p2, p3] = combo as [PointName, PointName, PointName];
  const rotations: [PointName, PointName, PointName][] = [
    [p1, p2, p3],
    [p2, p3, p1],
    [p1, p3, p2],
  ];
  for (const [x, y, apex] of rotations) {
    if (
      aspectBetween(map, x, y)?.aspect === "opposition" &&
      aspectBetween(map, x, apex)?.aspect === "square" &&
      aspectBetween(map, y, apex)?.aspect === "square"
    ) {
      return { type: "tSquare", points: [x, y, apex], description: `T-square apex at ${apex}, opposition ${x}-${y}` };
    }
  }
  return null;
}

function detectYod(map: Map<string, AspectHit>, combo: PointName[]): AspectPattern | null {
  const [p1, p2, p3] = combo as [PointName, PointName, PointName];
  const rotations: [PointName, PointName, PointName][] = [
    [p1, p2, p3],
    [p2, p3, p1],
    [p1, p3, p2],
  ];
  for (const [x, y, apex] of rotations) {
    if (
      aspectBetween(map, x, y)?.aspect === "sextile" &&
      aspectBetween(map, x, apex)?.aspect === "quincunx" &&
      aspectBetween(map, y, apex)?.aspect === "quincunx"
    ) {
      return { type: "yod", points: [x, y, apex], description: `Yod apex at ${apex}, sextile base ${x}-${y}` };
    }
  }
  return null;
}

function detectGrandCross(map: Map<string, AspectHit>, combo: PointName[]): AspectPattern | null {
  const pairs = combinations(combo, 2) as [PointName, PointName][];
  const oppositions: [PointName, PointName][] = [];
  let squareCount = 0;
  for (const [x, y] of pairs) {
    const aspect = aspectBetween(map, x, y)?.aspect;
    if (aspect === "opposition") oppositions.push([x, y]);
    else if (aspect === "square") squareCount++;
    else return null;
  }
  if (oppositions.length === 2 && squareCount === 4) {
    const [first, second] = oppositions as [[PointName, PointName], [PointName, PointName]];
    const shared = first.some((p) => second.includes(p));
    if (!shared) {
      return { type: "grandCross", points: combo, description: `Grand cross among ${combo.join(", ")}` };
    }
  }
  return null;
}

function detectMysticRectangle(map: Map<string, AspectHit>, combo: PointName[]): AspectPattern | null {
  const pairs = combinations(combo, 2) as [PointName, PointName][];
  const oppositions: [PointName, PointName][] = [];
  let trineCount = 0;
  let sextileCount = 0;
  for (const [x, y] of pairs) {
    const aspect = aspectBetween(map, x, y)?.aspect;
    if (aspect === "opposition") oppositions.push([x, y]);
    else if (aspect === "trine") trineCount++;
    else if (aspect === "sextile") sextileCount++;
    else return null;
  }
  if (oppositions.length === 2 && trineCount === 2 && sextileCount === 2) {
    const [first, second] = oppositions as [[PointName, PointName], [PointName, PointName]];
    const shared = first.some((p) => second.includes(p));
    if (!shared) {
      return { type: "mysticRectangle", points: combo, description: `Mystic rectangle among ${combo.join(", ")}` };
    }
  }
  return null;
}

function detectKites(map: Map<string, AspectHit>, grandTrines: AspectPattern[], names: PointName[]): AspectPattern[] {
  const kites: AspectPattern[] = [];
  for (const trine of grandTrines) {
    for (const candidate of names) {
      if (trine.points.includes(candidate)) continue;
      for (const vertex of trine.points) {
        if (aspectBetween(map, vertex, candidate)?.aspect !== "opposition") continue;
        const others = trine.points.filter((p) => p !== vertex);
        const bothSextile = others.every((o) => aspectBetween(map, o, candidate)?.aspect === "sextile");
        if (bothSextile) {
          kites.push({
            type: "kite",
            points: [...trine.points, candidate],
            description: `Kite off grand trine (${trine.points.join(", ")}) via ${candidate}`,
          });
        }
      }
    }
  }
  return kites;
}

export function detectPatterns(
  points: Partial<Record<PointName, PointPosition>>,
  aspects: AspectHit[],
): AspectPattern[] {
  const names = Object.keys(points) as PointName[];
  const map = buildAspectMap(aspects);
  const patterns: AspectPattern[] = [...detectStelliums(points, names)];

  for (const combo of combinations(names, 3)) {
    const grandTrine = detectGrandTrine(map, combo);
    if (grandTrine) patterns.push(grandTrine);
    const tSquare = detectTSquare(map, combo);
    if (tSquare) patterns.push(tSquare);
    const yod = detectYod(map, combo);
    if (yod) patterns.push(yod);
  }

  for (const combo of combinations(names, 4)) {
    const grandCross = detectGrandCross(map, combo);
    if (grandCross) patterns.push(grandCross);
    const mysticRectangle = detectMysticRectangle(map, combo);
    if (mysticRectangle) patterns.push(mysticRectangle);
  }

  patterns.push(...detectKites(map, patterns.filter((p) => p.type === "grandTrine"), names));

  return patterns;
}
