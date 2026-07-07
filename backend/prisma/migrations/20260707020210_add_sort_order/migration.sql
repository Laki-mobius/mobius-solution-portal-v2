-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Collateral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "linkedSolutionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Collateral_linkedSolutionId_fkey" FOREIGN KEY ("linkedSolutionId") REFERENCES "Solution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Collateral" ("createdAt", "fileUrl", "id", "linkedSolutionId", "title", "type", "updatedAt") SELECT "createdAt", "fileUrl", "id", "linkedSolutionId", "title", "type", "updatedAt" FROM "Collateral";
DROP TABLE "Collateral";
ALTER TABLE "new_Collateral" RENAME TO "Collateral";
CREATE TABLE "new_Solution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "iconUrl" TEXT,
    "thumbnailUrl" TEXT,
    "targetUrl" TEXT NOT NULL,
    "solutionType" TEXT NOT NULL,
    "practice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'live',
    "upcomingEta" DATETIME,
    "defaultUsername" TEXT,
    "defaultPasswordEncrypted" TEXT,
    "credentialsNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Solution" ("createdAt", "credentialsNote", "defaultPasswordEncrypted", "defaultUsername", "description", "iconUrl", "id", "practice", "solutionType", "status", "targetUrl", "thumbnailUrl", "title", "upcomingEta", "updatedAt") SELECT "createdAt", "credentialsNote", "defaultPasswordEncrypted", "defaultUsername", "description", "iconUrl", "id", "practice", "solutionType", "status", "targetUrl", "thumbnailUrl", "title", "upcomingEta", "updatedAt" FROM "Solution";
DROP TABLE "Solution";
ALTER TABLE "new_Solution" RENAME TO "Solution";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
