import { signForLongitude, ZODIAC_SIGNS } from "@astro/shared";
import type {
  ChartData,
  HellenisticProfile,
  LotName,
  LotPosition,
  PointName,
  ProfectionInfo,
  SectInfo,
  ZodiacSign,
} from "@astro/shared";
import { normalizeDegrees } from "./ephemeris.js";
import { houseOfLongitude } from "./chart-utils.js";

/** Traditional (7-planet) rulerships used throughout Hellenistic technique \u2014 deliberately distinct
 * from the modern outer-planet rulerships used elsewhere in this app (ZODIAC_SIGNS.ruler), since
 * Hellenistic astrology predates Uranus/Neptune/Pluto. */
const CLASSICAL_RULERSHIPS: Record<ZodiacSign, PointName> = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "mars",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "saturn",
  pisces: "jupiter",
};

export function classicalRulerOf(sign: ZodiacSign): PointName {
  return CLASSICAL_RULERSHIPS[sign];
}

/** A chart is "day" (diurnal) if the Sun is above the horizon \u2014 i.e. in houses 7-12. Requires a known
 * birth time (houses); returns null otherwise. */
export function determineSect(chart: ChartData): SectInfo | null {
  const sun = chart.points.sun;
  if (!sun || sun.house === null) return null;

  if (sun.house >= 7 && sun.house <= 12) {
    return { sect: "day", sectLight: "sun", benefic: "jupiter", malefic: "saturn", contraryBenefic: "venus", contraryMalefic: "mars" };
  }
  return { sect: "night", sectLight: "moon", benefic: "venus", malefic: "mars", contraryBenefic: "jupiter", contraryMalefic: "saturn" };
}

const LOT_LABELS: Record<LotName, string> = {
  spirit: "Lot of Spirit",
  eros: "Lot of Eros",
  necessity: "Lot of Necessity",
  courage: "Lot of Courage",
  victory: "Lot of Victory",
  nemesis: "Lot of Nemesis",
};

function toLotPosition(name: LotName, longitude: number, houses: ChartData["houses"]): LotPosition {
  const norm = normalizeDegrees(longitude);
  const signInfo = signForLongitude(norm);
  return {
    name,
    label: LOT_LABELS[name],
    longitude: norm,
    sign: signInfo.sign,
    signDegree: norm - signInfo.startLongitude,
    house: houses ? houseOfLongitude(norm, houses) : null,
  };
}

/**
 * The classical Hellenistic lots beyond Fortune (already computed as `partOfFortune` elsewhere).
 * Formulas follow the day/night-reversing pattern documented in Vettius Valens' Anthologies, as
 * commonly republished in modern Hellenistic astrology texts (e.g. Chris Brennan's "Hellenistic
 * Astrology"). Some lots beyond Spirit have minor variations across historical sources; these are the
 * most widely cited versions. Requires a known birth time (Ascendant + houses); returns null otherwise.
 */
export function computeHellenisticLots(chart: ChartData): LotPosition[] | null {
  const asc = chart.points.ascendant?.longitude;
  const sun = chart.points.sun;
  const moon = chart.points.moon;
  const venus = chart.points.venus;
  const mercury = chart.points.mercury;
  const mars = chart.points.mars;
  const jupiter = chart.points.jupiter;
  const saturn = chart.points.saturn;
  const fortune = chart.points.partOfFortune?.longitude;
  const sect = determineSect(chart);

  if (asc === undefined || fortune === undefined || !sun || !moon || !venus || !mercury || !mars || !jupiter || !saturn || !sect) {
    return null;
  }
  const isDay = sect.sect === "day";

  // Spirit: the day/night-reversed counterpart of Fortune (Sun and Moon swapped).
  const spirit = isDay ? asc + sun.longitude - moon.longitude : asc + moon.longitude - sun.longitude;
  const eros = isDay ? asc + venus.longitude - spirit : asc + spirit - venus.longitude;
  const necessity = isDay ? asc + mercury.longitude - spirit : asc + spirit - mercury.longitude;
  const courage = isDay ? asc + mars.longitude - fortune : asc + fortune - mars.longitude;
  const victory = isDay ? asc + jupiter.longitude - spirit : asc + spirit - jupiter.longitude;
  const nemesis = isDay ? asc + saturn.longitude - fortune : asc + fortune - saturn.longitude;

  return [
    toLotPosition("spirit", spirit, chart.houses),
    toLotPosition("eros", eros, chart.houses),
    toLotPosition("necessity", necessity, chart.houses),
    toLotPosition("courage", courage, chart.houses),
    toLotPosition("victory", victory, chart.houses),
    toLotPosition("nemesis", nemesis, chart.houses),
  ];
}

const DAY_MS = 86_400_000;

/**
 * Annual profections: a whole-sign technique where age 0 activates the 1st house/rising sign, and each
 * completed year of life advances exactly one whole sign, regardless of the chart's actual house
 * system. The traditional ruler of the profected sign becomes that year's "lord of the year".
 * Requires a known birth time (Ascendant); returns null otherwise.
 */
export function computeAnnualProfection(chart: ChartData, asOfDate: Date = new Date()): ProfectionInfo | null {
  const ascendant = chart.points.ascendant;
  if (!ascendant) return null;

  const birthUtc = new Date(chart.utcDateTime).getTime();
  const age = Math.max(0, Math.floor((asOfDate.getTime() - birthUtc) / (365.25 * DAY_MS)));

  const ascSignIndex = ZODIAC_SIGNS.findIndex((s) => s.sign === ascendant.sign);
  const profectedHouse = (age % 12) + 1;
  const profectedSign = ZODIAC_SIGNS[(ascSignIndex + age) % 12]!.sign;
  const lordOfYear = classicalRulerOf(profectedSign);
  const lordPos = chart.points[lordOfYear];

  return {
    asOfDate: asOfDate.toISOString(),
    age,
    profectedHouse,
    profectedSign,
    lordOfYear,
    lordNatalSign: lordPos?.sign ?? profectedSign,
    lordNatalHouse: lordPos?.house ?? null,
  };
}

/** Bundles sect, lots, and the current annual profection. Requires a known birth time; returns null
 * otherwise (mirrors the houses/Ascendant gate used throughout the rest of the engine). */
export function computeHellenisticProfile(chart: ChartData, asOfDate: Date = new Date()): HellenisticProfile | null {
  const sect = determineSect(chart);
  const lots = computeHellenisticLots(chart);
  const profection = computeAnnualProfection(chart, asOfDate);
  if (!sect || !lots || !profection) return null;
  return { sect, lots, profection };
}
