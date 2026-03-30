import { PrismaClient } from '@prisma/client';
import { appSeeds, discussionSeeds, ideaBlockSeeds, incubationSeeds, roomSeeds, v2IdeaSeeds } from './content/v2-launch';

const prisma = new PrismaClient();

async function main() {
  await prisma.roomMessage.deleteMany();
  await prisma.roomJoinRequest.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.incubationBlock.deleteMany();
  await prisma.incubationProject.deleteMany();
  await prisma.ideaIncubation.deleteMany();
  await prisma.ideaBlockSource.deleteMany();
  await prisma.ideaBlock.deleteMany();
  await prisma.ideaMessage.deleteMany();
  await prisma.member.deleteMany();
  await prisma.joinRequest.deleteMany();
  await prisma.ideaEvidence.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.appAssetBundle.deleteMany();
  await prisma.teardown.deleteMany();
  await prisma.app.deleteMany();
  await prisma.pattern.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.digestIssue.deleteMany();

  const appMap = new Map<string, string>();
  const discussionMap = new Map<string, string>();
  const incubationMap = new Map<string, string>();
  const ideaBlockMap = new Map<string, string>();

  for (const app of appSeeds) {
    const created = await prisma.app.create({
      data: {
        slug: app.slug,
        name: app.name,
        tagline: app.tagline,
        saveTimeLabel: app.saveTimeLabel,
        category: app.category,
        pricing: app.pricing,
        channels: app.channels,
        targetPersona: app.targetPersona,
        hookAngle: app.hookAngle,
        trustSignals: app.trustSignals,
        difficulty: app.difficulty,
        heatScore: app.heatScore,
        screenshotUrls: app.screenshotUrls,
        primaryUrl: app.primaryUrl,
        primaryLabel: app.primaryLabel,
        secondaryUrl: app.secondaryUrl,
        secondaryLabel: app.secondaryLabel,
        teardown: { create: app.teardown },
        assetBundle: { create: app.assets },
      },
    });

    appMap.set(app.slug, created.id);
  }

  for (const idea of v2IdeaSeeds) {
    const created = await prisma.idea.create({
      data: {
        title: idea.title,
        note: idea.note,
        category: idea.category,
        tags: idea.tags,
        votes: idea.votes,
        featured: idea.featured,
        isNovel: idea.isNovel,
        novelReason: idea.novelReason,
        novelTicks: idea.novelTicks,
      },
    });

    for (const evidence of idea.evidence || []) {
      await prisma.ideaEvidence.create({
        data: {
          ideaId: created.id,
          sourceAppId: evidence.sourceAppSlug ? appMap.get(evidence.sourceAppSlug) || null : null,
          appTitle: evidence.appTitle,
          appUrl: evidence.appUrl,
          platform: evidence.platform,
          how: evidence.how,
          cpHook: evidence.cpHook,
          cpWow: evidence.cpWow,
          cpReturn: evidence.cpReturn,
        },
      });
    }
  }

  for (const incubation of incubationSeeds) {
    const created = await prisma.ideaIncubation.create({
      data: {
        slug: incubation.slug,
        title: incubation.title,
        oneLiner: incubation.oneLiner,
        status: incubation.status,
        createdBy: incubation.createdBy,
      },
    });

    incubationMap.set(incubation.slug, created.id);
  }

  for (const thread of discussionSeeds) {
    const targetId = thread.targetType === 'PROJECT' ? appMap.get(thread.targetSlug) : incubationMap.get(thread.targetSlug);
    if (!targetId) continue;

    const created = await prisma.discussion.create({
      data: {
        title: thread.title,
        summary: thread.summary,
        targetType: thread.targetType,
        targetId,
        createdBy: thread.createdBy,
        replyCount: 1,
        lastActivityAt: new Date(),
        ...(thread.targetType === 'PROJECT' ? { appId: targetId } : { incubationId: targetId }),
        comments: {
          create: {
            authorName: thread.createdBy,
            content: thread.openingComment,
          },
        },
      },
    });

    discussionMap.set(thread.title, created.id);
  }

  for (const block of ideaBlockSeeds) {
    const created = await prisma.ideaBlock.create({
      data: {
        slug: block.slug,
        title: block.title,
        summary: block.summary,
        blockType: block.blockType,
        tags: block.tags,
        noveltyNote: block.noveltyNote,
        sourceThreadId: block.sourceThreadTitle ? discussionMap.get(block.sourceThreadTitle) || null : null,
      },
    });

    ideaBlockMap.set(block.slug, created.id);

    for (const appSlug of block.sourceProjectSlugs) {
      const appId = appMap.get(appSlug);
      if (!appId) continue;

      await prisma.ideaBlockSource.create({
        data: {
          ideaBlockId: created.id,
          appId,
        },
      });
    }
  }

  for (const incubation of incubationSeeds) {
    const incubationId = incubationMap.get(incubation.slug);
    if (!incubationId) continue;

    for (const blockSlug of incubation.ideaBlockSlugs) {
      const ideaBlockId = ideaBlockMap.get(blockSlug);
      if (!ideaBlockId) continue;

      await prisma.incubationBlock.create({
        data: {
          incubationId,
          ideaBlockId,
          sortOrder: incubation.ideaBlockSlugs.indexOf(blockSlug),
        },
      });
    }

    for (const appSlug of incubation.sourceProjectSlugs) {
      const appId = appMap.get(appSlug);
      if (!appId) continue;

      await prisma.incubationProject.create({
        data: {
          incubationId,
          appId,
        },
      });
    }
  }

  for (const room of roomSeeds) {
    const targetId = room.targetType === 'PROJECT' ? appMap.get(room.targetSlug) : incubationMap.get(room.targetSlug);
    if (!targetId) continue;

    const created = await prisma.room.create({
      data: {
        slug: room.slug,
        name: room.name,
        goal: room.goal,
        targetType: room.targetType,
        targetId,
        createdBy: room.createdBy,
        ...(room.targetType === 'PROJECT' ? { appId: targetId } : { incubationId: targetId }),
      },
    });

    await prisma.roomMember.create({
      data: {
        roomId: created.id,
        userId: `${room.slug}-owner`,
        userName: room.createdBy,
      },
    });

    await prisma.roomMessage.create({
      data: {
        roomId: created.id,
        userId: `${room.slug}-owner`,
        userName: room.createdBy,
        content: room.goal,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
