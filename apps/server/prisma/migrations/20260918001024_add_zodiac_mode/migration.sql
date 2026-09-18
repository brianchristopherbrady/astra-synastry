-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "houseSystem" TEXT NOT NULL,
    "zodiacMode" TEXT NOT NULL DEFAULT 'tropical',
    "ayanamsa" TEXT NOT NULL DEFAULT 'lahiri',
    "dataJson" TEXT NOT NULL,
    "aiProvider" TEXT,
    "aiAnalysisMarkdown" TEXT,
    "aiPromptVersion" TEXT,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chart_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Chart" ("aiAnalysisMarkdown", "aiPromptVersion", "aiProvider", "computedAt", "dataJson", "houseSystem", "id", "personId") SELECT "aiAnalysisMarkdown", "aiPromptVersion", "aiProvider", "computedAt", "dataJson", "houseSystem", "id", "personId" FROM "Chart";
DROP TABLE "Chart";
ALTER TABLE "new_Chart" RENAME TO "Chart";
CREATE UNIQUE INDEX "Chart_personId_houseSystem_zodiacMode_ayanamsa_key" ON "Chart"("personId", "houseSystem", "zodiacMode", "ayanamsa");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
