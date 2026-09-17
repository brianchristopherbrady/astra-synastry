import express from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "./config.js";
import { peopleRouter } from "./routes/people.routes.js";
import { chartsRouter } from "./routes/charts.routes.js";
import { synastryRouter } from "./routes/synastry.routes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { geoRouter } from "./routes/geo.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp(): express.Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/people", peopleRouter);
  app.use("/charts", chartsRouter);
  app.use("/synastry", synastryRouter);
  app.use("/ai", aiRouter);
  app.use("/geo", geoRouter);

  app.use(errorHandler);
  return app;
}
