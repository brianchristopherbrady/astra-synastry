import rateLimit from "express-rate-limit";

/** Protects paid AI provider calls from abuse/runaway cost. */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please try again later." },
});

/** Keeps our server within OpenStreetMap Nominatim's usage policy (max ~1 request/sec). */
export const geoRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many place searches, please slow down." },
});
