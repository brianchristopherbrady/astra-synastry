-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SynastryReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "houseSystem" TEXT NOT NULL,
    "zodiacMode" TEXT NOT NULL DEFAULT 'tropical',
    "ayanamsa" TEXT NOT NULL DEFAULT 'lahiri',
    "dataJson" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'romantic',
    "readingStyle" TEXT NOT NULL DEFAULT 'clever',
    "customStyleText" TEXT NOT NULL DEFAULT '',
    "archetypeName" TEXT,
    "aiProvider" TEXT,
    "aiAnalysisMarkdown" TEXT,
    "aiPromptVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SynastryReport_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SynastryReport_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SynastryReport" ("aiAnalysisMarkdown", "aiPromptVersion", "aiProvider", "archetypeName", "createdAt", "customStyleText", "dataJson", "houseSystem", "id", "personAId", "personBId", "readingStyle", "relationshipType") SELECT "aiAnalysisMarkdown", "aiPromptVersion", "aiProvider", "archetypeName", "createdAt", "customStyleText", "dataJson", "houseSystem", "id", "personAId", "personBId", "readingStyle", "relationshipType" FROM "SynastryReport";
DROP TABLE "SynastryReport";
ALTER TABLE "new_SynastryReport" RENAME TO "SynastryReport";
CREATE UNIQUE INDEX "SynastryReport_personAId_personBId_houseSystem_zodiacMode_ayanamsa_relationshipType_readingStyle_customStyleText_key" ON "SynastryReport"("personAId", "personBId", "houseSystem", "zodiacMode", "ayanamsa", "relationshipType", "readingStyle", "customStyleText");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
