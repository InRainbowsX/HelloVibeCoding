-- Add richer evidence display fields for icon/screenshot-first cards.
ALTER TABLE "IdeaEvidence"
ADD COLUMN "iconUrl" TEXT,
ADD COLUMN "screenshotUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "fetchStatus" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "fetchNote" TEXT;
