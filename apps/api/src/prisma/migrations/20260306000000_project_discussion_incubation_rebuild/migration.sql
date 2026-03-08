ALTER TYPE "TargetType" ADD VALUE IF NOT EXISTS 'PROJECT';
ALTER TYPE "TargetType" ADD VALUE IF NOT EXISTS 'INCUBATION';

CREATE TYPE "IdeaBlockType" AS ENUM ('FORMULA', 'FEATURE', 'WORKFLOW', 'CHANNEL');
CREATE TYPE "IncubationStatus" AS ENUM ('OPEN', 'VALIDATING', 'BUILDING', 'ARCHIVED');
CREATE TYPE "RoomTargetType" AS ENUM ('PROJECT', 'INCUBATION');
CREATE TYPE "RoomStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED');

ALTER TABLE "Discussion"
  ADD COLUMN IF NOT EXISTS "summary" TEXT,
  ADD COLUMN IF NOT EXISTS "replyCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "incubationId" TEXT;

CREATE TABLE "IdeaBlock" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "blockType" "IdeaBlockType" NOT NULL,
  "tags" TEXT[],
  "noveltyNote" TEXT,
  "sourceThreadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdeaBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdeaBlockSource" (
  "id" TEXT NOT NULL,
  "ideaBlockId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  CONSTRAINT "IdeaBlockSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdeaIncubation" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "oneLiner" TEXT NOT NULL,
  "status" "IncubationStatus" NOT NULL DEFAULT 'OPEN',
  "createdBy" TEXT NOT NULL,
  "discussionCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdeaIncubation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IncubationBlock" (
  "id" TEXT NOT NULL,
  "incubationId" TEXT NOT NULL,
  "ideaBlockId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "IncubationBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IncubationProject" (
  "id" TEXT NOT NULL,
  "incubationId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  CONSTRAINT "IncubationProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Room" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "targetType" "RoomTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "status" "RoomStatus" NOT NULL DEFAULT 'OPEN',
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "appId" TEXT,
  "incubationId" TEXT,
  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomMember" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomJoinRequest" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "q1Contrib" TEXT NOT NULL,
  "q2Improve" TEXT NOT NULL,
  "q3FirstStep" TEXT NOT NULL,
  "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoomJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomMessage" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoomMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdeaBlock_slug_key" ON "IdeaBlock"("slug");
CREATE UNIQUE INDEX "IdeaBlockSource_ideaBlockId_appId_key" ON "IdeaBlockSource"("ideaBlockId", "appId");
CREATE UNIQUE INDEX "IdeaIncubation_slug_key" ON "IdeaIncubation"("slug");
CREATE UNIQUE INDEX "IncubationBlock_incubationId_ideaBlockId_key" ON "IncubationBlock"("incubationId", "ideaBlockId");
CREATE UNIQUE INDEX "IncubationProject_incubationId_appId_key" ON "IncubationProject"("incubationId", "appId");
CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");
CREATE UNIQUE INDEX "RoomJoinRequest_roomId_userId_key" ON "RoomJoinRequest"("roomId", "userId");

ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_incubationId_fkey" FOREIGN KEY ("incubationId") REFERENCES "IdeaIncubation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IdeaBlock" ADD CONSTRAINT "IdeaBlock_sourceThreadId_fkey" FOREIGN KEY ("sourceThreadId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IdeaBlockSource" ADD CONSTRAINT "IdeaBlockSource_ideaBlockId_fkey" FOREIGN KEY ("ideaBlockId") REFERENCES "IdeaBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdeaBlockSource" ADD CONSTRAINT "IdeaBlockSource_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncubationBlock" ADD CONSTRAINT "IncubationBlock_incubationId_fkey" FOREIGN KEY ("incubationId") REFERENCES "IdeaIncubation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncubationBlock" ADD CONSTRAINT "IncubationBlock_ideaBlockId_fkey" FOREIGN KEY ("ideaBlockId") REFERENCES "IdeaBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncubationProject" ADD CONSTRAINT "IncubationProject_incubationId_fkey" FOREIGN KEY ("incubationId") REFERENCES "IdeaIncubation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncubationProject" ADD CONSTRAINT "IncubationProject_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_incubationId_fkey" FOREIGN KEY ("incubationId") REFERENCES "IdeaIncubation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomJoinRequest" ADD CONSTRAINT "RoomJoinRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomMessage" ADD CONSTRAINT "RoomMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
