-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "localDateTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "locationName" TEXT NOT NULL,
    "timeUnknown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "houseSystem" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "aiProvider" TEXT,
    "aiAnalysisMarkdown" TEXT,
    "aiPromptVersion" TEXT,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chart_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SynastryReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "houseSystem" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "aiProvider" TEXT,
    "aiAnalysisMarkdown" TEXT,
    "aiPromptVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SynastryReport_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SynastryReport_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Chart_personId_houseSystem_key" ON "Chart"("personId", "houseSystem");

-- CreateIndex
CREATE UNIQUE INDEX "SynastryReport_personAId_personBId_houseSystem_key" ON "SynastryReport"("personAId", "personBId", "houseSystem");
