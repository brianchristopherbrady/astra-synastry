import type { PointName, ZodiacSign } from "./points.js";

/** Whether the Sun is above the horizon at birth ("day"/diurnal) or below it ("night"/nocturnal) \u2014
 * the foundational division of Hellenistic astrology that determines which planets act as benefics
 * or malefics for this chart. */
export type Sect = "day" | "night";

export interface SectInfo {
  sect: Sect;
  /** Sun by day, Moon by night \u2014 the chart's "luminary of sect". */
  sectLight: PointName;
  /** The benefic that is "of sect" (more favorable): Jupiter by day, Venus by night. */
  benefic: PointName;
  /** The malefic that is "of sect" (more gentle): Saturn by day, Mars by night. */
  malefic: PointName;
  /** The benefic "contrary to sect" (less favorable): Venus by day, Jupiter by night. */
  contraryBenefic: PointName;
  /** The malefic "contrary to sect" (harsher): Mars by day, Saturn by night. */
  contraryMalefic: PointName;
}

/** The classical Hellenistic lots beyond the Lot of Fortune (which is already a core chart point). */
export type LotName = "spirit" | "eros" | "necessity" | "courage" | "victory" | "nemesis";

export interface LotPosition {
  name: LotName;
  label: string;
  longitude: number;
  sign: ZodiacSign;
  signDegree: number;
  house: number | null;
}

export interface ProfectionInfo {
  asOfDate: string;
  /** Whole completed years since birth. */
  age: number;
  /** The whole-sign house (1-12) activated this year, counted from the 1st house at birth. */
  profectedHouse: number;
  /** The sign occupying that whole-sign house, counted from the rising sign. */
  profectedSign: ZodiacSign;
  /** The traditional (7-planet) ruler of the profected sign \u2014 the "lord of the year". */
  lordOfYear: PointName;
  lordNatalSign: ZodiacSign;
  lordNatalHouse: number | null;
}

export interface HellenisticProfile {
  sect: SectInfo;
  lots: LotPosition[];
  profection: ProfectionInfo;
}
