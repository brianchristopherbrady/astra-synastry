import type { Element, Modality, PointName } from "./points.js";
import type { AspectHit, ChartData } from "./chart.js";

/** How to frame a synastry reading \u2014 changes both the AI's interpretive lens and which sections it writes. */
export type RelationshipType = "romantic" | "friendship";

/** Requested tone/voice for the AI-generated reading. "other" pairs with a free-text description. */
export type ReadingStyle = "clever" | "flirty" | "funny" | "mythic" | "brutal" | "other";

export interface HouseOverlayEntry {
  point: PointName;
  house: number;
}

export interface CompatibilityCategoryScores {
  communication: number;
  emotional: number;
  passion: number;
  stability: number;
  growth: number;
  conflict: number;
}

export interface BalanceBreakdown<K extends string> {
  counts: Record<K, number>;
  dominant: K;
}

export interface CompatibilityScore {
  /** 0-100 overall compatibility index. */
  overall: number;
  categories: CompatibilityCategoryScores;
  elementBalance: BalanceBreakdown<Element>;
  modalityBalance: BalanceBreakdown<Modality>;
}

export interface SynastryData {
  personAChart: ChartData;
  personBChart: ChartData;
  /** Aspects between A's points (pointA) and B's points (pointB). */
  crossAspects: AspectHit[];
  /** Where each of A's points falls in B's houses. */
  houseOverlayAtoB: HouseOverlayEntry[];
  /** Where each of B's points falls in A's houses. */
  houseOverlayBtoA: HouseOverlayEntry[];
  compositeChart: ChartData;
  davisonChart: ChartData;
  compatibilityScore: CompatibilityScore;
}

export interface TransitHit extends AspectHit {
  /** ISO date the transit becomes exact. */
  exactDate: string;
  ingressDate: string | null;
  egressDate: string | null;
}

export interface TransitReport {
  generatedAt: string;
  transitingChart: ChartData;
  hitsToPersonA: TransitHit[];
  hitsToPersonB: TransitHit[];
  hitsToComposite: TransitHit[];
}

/** Transits to a single natal chart (used outside synastry, e.g. an individual's own chart page). */
export interface NatalTransitReport {
  generatedAt: string;
  transitingChart: ChartData;
  hits: TransitHit[];
  /** Which natal house each transiting point currently occupies. */
  houseOverlay: HouseOverlayEntry[];
}

export interface ProgressedChart {
  forDate: string;
  personId: string;
  chart: ChartData;
}

/** A progressed chart plus its aspects back to the natal chart (e.g. "progressed Moon trine natal Sun"). */
export interface ProgressedChartReport extends ProgressedChart {
  crossAspectsToNatal: AspectHit[];
}
