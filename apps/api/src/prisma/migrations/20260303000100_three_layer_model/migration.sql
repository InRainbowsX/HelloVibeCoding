-- AlterTable
ALTER TABLE "App" DROP COLUMN "ahaMoment",
DROP COLUMN "corePromise",
DROP COLUMN "growthEngine",
DROP COLUMN "moat",
DROP COLUMN "monetization",
DROP COLUMN "painAndPersona",
DROP COLUMN "retentionLoop",
DROP COLUMN "triggerScene",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "hookAngle" TEXT NOT NULL,
ADD COLUMN     "saveTimeLabel" TEXT NOT NULL,
ADD COLUMN     "trustSignals" TEXT[],
ALTER COLUMN "targetPersona" SET NOT NULL;

-- CreateTable
CREATE TABLE "Teardown" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "painSummary" TEXT NOT NULL,
    "painScore" TEXT NOT NULL,
    "triggerScene" TEXT NOT NULL,
    "corePromise" TEXT NOT NULL,
    "coreLoop" TEXT NOT NULL,
    "keyConstraints" TEXT[],
    "mvpScope" TEXT NOT NULL,
    "dataInput" TEXT,
    "dataOutput" TEXT,
    "faultTolerance" TEXT,
    "coldStartStrategy" TEXT NOT NULL,
    "pricingLogic" TEXT NOT NULL,
    "competitorDelta" TEXT NOT NULL,
    "riskNotes" TEXT NOT NULL,
    "expansionSteps" TEXT[],
    "reverseIdeas" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teardown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAssetBundle" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "hasAgentsTemplate" BOOLEAN NOT NULL DEFAULT false,
    "hasSpecTemplate" BOOLEAN NOT NULL DEFAULT false,
    "hasPromptPack" BOOLEAN NOT NULL DEFAULT false,
    "agentsTemplate" TEXT,
    "specTemplate" TEXT,
    "promptPack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppAssetBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teardown_appId_key" ON "Teardown"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "AppAssetBundle_appId_key" ON "AppAssetBundle"("appId");

-- AddForeignKey
ALTER TABLE "Teardown" ADD CONSTRAINT "Teardown_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAssetBundle" ADD CONSTRAINT "AppAssetBundle_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;

