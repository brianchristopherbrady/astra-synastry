import type { AspectPatternType, Element, Modality, PointName, ZodiacSign } from "@astro/shared";

export interface GlossaryEntry {
  title: string;
  glyph?: string;
  body: string;
  implemented?: boolean;
}

export const ELEMENT_MEANINGS: Record<Element, string> = {
  fire: "Passionate, energetic, and action-oriented. Fire placements want to move, inspire, and act on instinct.",
  earth: "Practical, grounded, and results-driven. Earth placements want stability, tangible progress, and reliability.",
  air: "Mental, social, and idea-driven. Air placements want to think, communicate, and connect through concepts.",
  water: "Emotional, intuitive, and deeply feeling. Water placements want closeness, sensitivity, and emotional truth.",
};

export const MODALITY_MEANINGS: Record<Modality, string> = {
  cardinal: "Initiating energy \u2014 cardinal placements start things, lead, and prefer to act rather than wait.",
  fixed: "Sustaining energy \u2014 fixed placements hold steady, resist change, and see things through once committed.",
  mutable: "Adaptive energy \u2014 mutable placements adjust, blend, and thrive on flexibility and transition.",
};

export const SIGN_MEANINGS: Record<ZodiacSign, string> = {
  aries: "Bold, direct, and quick to act. Aries wants to initiate, compete, and lead.",
  taurus: "Steady, sensual, and grounded. Taurus wants comfort, stability, and to build things that last.",
  gemini: "Curious, talkative, and quick-witted. Gemini wants variety, information, and connection through words.",
  cancer: "Nurturing, protective, and emotionally attuned. Cancer wants safety, home, and deep belonging.",
  leo: "Warm, expressive, and proud. Leo wants to create, be seen, and lead from the heart.",
  virgo: "Precise, practical, and helpful. Virgo wants to improve, organize, and be genuinely useful.",
  libra: "Diplomatic, aesthetic, and relationship-oriented. Libra wants fairness, harmony, and partnership.",
  scorpio: "Intense, private, and transformative. Scorpio wants depth, truth, and emotional intimacy.",
  sagittarius: "Adventurous, philosophical, and optimistic. Sagittarius wants freedom, meaning, and the big picture.",
  capricorn: "Disciplined, ambitious, and patient. Capricorn wants achievement, structure, and long-term mastery.",
  aquarius: "Independent, inventive, and idealistic. Aquarius wants progress, individuality, and community.",
  pisces: "Dreamy, empathetic, and imaginative. Pisces wants to dissolve boundaries and connect to something bigger.",
};

export const POINT_MEANINGS: Partial<Record<PointName, string>> = {
  sun: "Your core identity, ego, and sense of purpose \u2014 who you're fundamentally trying to become.",
  moon: "Your emotional instincts, comfort needs, and gut reactions \u2014 how you feel and self-soothe.",
  mercury: "How you think, communicate, and process information.",
  venus: "What you're drawn to, how you love, and what you find beautiful or valuable.",
  mars: "How you assert yourself, pursue desire, and handle conflict or drive.",
  jupiter: "Where you seek growth, meaning, luck, and expansion.",
  saturn: "Where you face discipline, limits, and long-term responsibility \u2014 your growth through structure.",
  uranus: "Where you seek freedom, disruption, and sudden change or innovation.",
  neptune: "Where you dissolve boundaries \u2014 imagination, spirituality, illusion, or escapism.",
  pluto: "Where you experience deep transformation, power dynamics, and what you can't avoid confronting.",
  northNode: "The direction of growth this lifetime is pulling you toward \u2014 unfamiliar but developmental.",
  southNode: "Innate, familiar patterns and talents you're pulled to release or move beyond.",
  chiron: "The \"wounded healer\" \u2014 a core sensitivity that, once faced, becomes a source of healing for others.",
  lilith: "Raw, unfiltered instinct \u2014 what you were taught to suppress or feel shame about.",
  ascendant: "Your \"Rising sign\" \u2014 the mask/first impression you present and how you instinctively approach life.",
  midheaven: "Your public reputation, career direction, and life's aspirational \"peak.\"",
  vertex: "A more fated, less consciously chosen point of encounter or turning point.",
  partOfFortune: "A classical point of ease and good fortune, blending your Sun, Moon, and Ascendant.",
};

export const HOUSE_MEANINGS: Record<number, GlossaryEntry> = {
  1: { title: "1st House \u2014 Self", body: "Identity, appearance, first impressions, how you initiate." },
  2: { title: "2nd House \u2014 Resources", body: "Money, possessions, self-worth, and what you value." },
  3: { title: "3rd House \u2014 Communication", body: "Siblings, everyday communication, learning, short trips." },
  4: { title: "4th House \u2014 Home", body: "Family, roots, home life, and your emotional foundation." },
  5: { title: "5th House \u2014 Expression", body: "Romance, creativity, pleasure, children, and play." },
  6: { title: "6th House \u2014 Routine", body: "Work, health, daily habits, and being of service." },
  7: { title: "7th House \u2014 Partnership", body: "Marriage, business partners, and one-on-one relationships." },
  8: { title: "8th House \u2014 Transformation", body: "Intimacy, shared resources, death/rebirth, and deep change." },
  9: { title: "9th House \u2014 Expansion", body: "Travel, higher education, philosophy, and belief systems." },
  10: { title: "10th House \u2014 Career", body: "Public reputation, career, and life direction (ruled by the Midheaven)." },
  11: { title: "11th House \u2014 Community", body: "Friendships, groups, and hopes for the future." },
  12: { title: "12th House \u2014 The Unseen", body: "The subconscious, solitude, release, and hidden strengths." },
};

export const PATTERN_MEANINGS: Record<AspectPatternType, string> = {
  stellium: "Three or more points clustered in one sign or house \u2014 a concentration of energy and emphasis there.",
  grandTrine: "Three points in mutual trine (120\u00b0), forming a triangle \u2014 an easy, flowing talent that can go underused without effort.",
  tSquare: "Two points in opposition, both square a third \u2014 built-in tension that drives action through the apex point.",
  yod: "Two points in sextile, both quincunx a third (\"Finger of Fate\") \u2014 a specialized, sometimes awkward-feeling life purpose.",
  grandCross: "Four points in a cross of oppositions and squares \u2014 significant tension across every area of life, but with real driving power.",
  mysticRectangle: "Two oppositions linked by trines and sextiles \u2014 tension balanced by real resources to resolve it.",
  kite: "A grand trine with a fourth point opposing one corner \u2014 a natural gift given focus and direction.",
};

export const GENERAL_TERMS: GlossaryEntry[] = [
  {
    title: "Natal chart",
    body: "A snapshot of the sky at the exact moment and place you were born. It's the foundation everything else (synastry, transits, progressions) builds on.",
    implemented: true,
  },
  {
    title: "Synastry",
    body: "Comparing two people's natal charts by looking at the aspects between them \u2014 how one person's planets interact with the other's.",
    implemented: true,
  },
  {
    title: "Composite chart",
    body: "A single chart representing the relationship itself, built from the midpoint between each of the two people's placements. See it on any synastry report.",
    implemented: true,
  },
  {
    title: "Davison chart",
    body: "Like a composite, but computed as a real chart for the midpoint moment in time AND the midpoint location \u2014 a more literal \"third entity\" chart. See it on any synastry report.",
    implemented: true,
  },
  {
    title: "Transits",
    body: "Where the planets are right now (or on a chosen date), compared against a natal or composite chart \u2014 used to time current experiences. See it on your natal chart or synastry report.",
    implemented: true,
  },
  {
    title: "Secondary progressions",
    body: "A symbolic technique where each day after birth represents one year of life, showing how your chart slowly \"grows up\" with you. See it on your natal chart page.",
    implemented: true,
  },
  {
    title: "Aspect",
    body: "A meaningful angular relationship between two points (e.g. 0\u00b0, 90\u00b0, 120\u00b0). Aspects describe how two energies interact \u2014 easily, tensely, or somewhere between.",
    implemented: true,
  },
  {
    title: "Orb",
    body: "How many degrees away from an aspect's exact angle it can be and still \"count.\" A tighter orb means a stronger, more exact aspect.",
    implemented: true,
  },
  {
    title: "Retrograde",
    body: "When a planet appears to move backward from Earth's point of view (an optical effect, not literal). Traditionally associated with review, delay, or turning inward.",
    implemented: true,
  },
  {
    title: "House system",
    body: "The mathematical method used to divide the sky into 12 houses (e.g. Placidus, Whole Sign, Equal). Different systems can shift exact house cusps, especially at high latitudes.",
    implemented: true,
  },
  {
    title: "Element & modality",
    body: "Every sign has an element (fire/earth/air/water \u2014 its basic temperament) and a modality (cardinal/fixed/mutable \u2014 how it engages: starting, sustaining, or adapting).",
    implemented: true,
  },
];
