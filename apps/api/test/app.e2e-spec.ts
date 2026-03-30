import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/modules/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hellovibecoding';

describe('Project-centered API e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.QWEN_API_KEY = '';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/projects returns a paginated project list', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/projects?page=1&pageSize=12');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty('slug');
    expect(response.body.items[0]).toHaveProperty('discussionCount');
    expect(response.body.items[0]).toHaveProperty('ideaBlockCount');
    expect(response.body.items[0]).toHaveProperty('incubationCount');
  });

  it('GET /api/v1/projects/:slug returns project tabs payload', async () => {
    const listResponse = await request(app.getHttpServer()).get('/api/v1/projects?page=1&pageSize=1');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);

    const project = listResponse.body.items[0] as { slug: string };
    const response = await request(app.getHttpServer()).get(`/api/v1/projects/${project.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.slug).toBe(project.slug);
    expect(response.body).toHaveProperty('overview');
    expect(response.body).toHaveProperty('teardown');
    expect(Array.isArray(response.body.discussions)).toBe(true);
    expect(Array.isArray(response.body.ideaBlocks)).toBe(true);
    expect(Array.isArray(response.body.incubations)).toBe(true);
    expect(Array.isArray(response.body.rooms)).toBe(true);
  });

  it('GET /api/v1/projects/:slug returns external entry links for the source product', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/projects/poop-map');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.entryLinks)).toBe(true);
    expect(response.body.entryLinks.length).toBeGreaterThan(0);
    expect(response.body.entryLinks[0]).toHaveProperty('label');
    expect(response.body.entryLinks[0]).toHaveProperty('url');
  });

  it('GET /api/v1/idea-blocks returns reusable block cards', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/idea-blocks?page=1&pageSize=20');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty('blockType');
    expect(response.body.items[0]).toHaveProperty('sourceProjects');
  });

  it('POST /api/v1/idea-blocks/recommendations returns 3 product recommendations from selected blocks', async () => {
    const blocksResponse = await request(app.getHttpServer()).get('/api/v1/idea-blocks?page=1&pageSize=10');
    expect(blocksResponse.status).toBe(200);
    expect(blocksResponse.body.items.length).toBeGreaterThan(1);

    const response = await request(app.getHttpServer()).post('/api/v1/idea-blocks/recommendations').send({
      blockSlugs: [blocksResponse.body.items[0].slug, blocksResponse.body.items[1].slug],
    });

    expect(response.status).toBe(201);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0]).toHaveProperty('title');
    expect(response.body.items[0]).toHaveProperty('summary');
  });

  it('GET /api/v1/incubations returns idea incubation list', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/incubations?page=1&pageSize=20');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty('title');
    expect(response.body.items[0]).toHaveProperty('blockCount');
  });

  it('GET /api/v1/rooms returns rooms linked to projects or incubations', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/rooms');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty('targetType');
    expect(response.body.items[0]).toHaveProperty('target');
  });

  it('POST /api/v1/incubations creates a new incubation from idea blocks and source projects', async () => {
    const suffix = Date.now().toString();
    const blocksResponse = await request(app.getHttpServer()).get('/api/v1/idea-blocks?page=1&pageSize=10');
    expect(blocksResponse.status).toBe(200);
    expect(blocksResponse.body.items.length).toBeGreaterThan(1);

    const projectsResponse = await request(app.getHttpServer()).get('/api/v1/projects?page=1&pageSize=10');
    expect(projectsResponse.status).toBe(200);
    expect(projectsResponse.body.items.length).toBeGreaterThan(1);

    const response = await request(app.getHttpServer()).post('/api/v1/incubations').send({
      slug: `commute-focus-deck-${suffix}`,
      title: '通勤专注任务卡',
      oneLiner: '把通勤时间拆成一轮轮小任务，并把完成结果前置到锁屏和桌面。',
      createdBy: '测试用户',
      blockSlugs: [blocksResponse.body.items[0].slug, blocksResponse.body.items[1].slug],
      sourceProjectSlugs: [projectsResponse.body.items[0].slug, projectsResponse.body.items[1].slug],
    });

    expect(response.status).toBe(201);
    expect(response.body.slug).toBe(`commute-focus-deck-${suffix}`);
    expect(response.body.blocks).toHaveLength(2);
    expect(response.body.sourceProjects).toHaveLength(2);
  });

  it('POST /api/v1/rooms creates a room under an incubation target', async () => {
    const suffix = Date.now().toString();
    const incubationsResponse = await request(app.getHttpServer()).get('/api/v1/incubations?page=1&pageSize=10');
    expect(incubationsResponse.status).toBe(200);
    expect(incubationsResponse.body.items.length).toBeGreaterThan(0);

    const incubation = incubationsResponse.body.items[0] as { id: string; slug: string; title: string };
    const response = await request(app.getHttpServer()).post('/api/v1/rooms').send({
      slug: `inc-room-test-${suffix}`,
      name: '孵化验证房',
      goal: '先验证这个方向的最小闭环和第一屏文案。',
      targetType: 'INCUBATION',
      targetId: incubation.id,
      createdBy: '测试用户',
    });

    expect(response.status).toBe(201);
    expect(response.body.slug).toBe(`inc-room-test-${suffix}`);
    expect(response.body.targetType).toBe('INCUBATION');
    expect(response.body.target).toEqual({ slug: incubation.slug, name: incubation.title });
  });

  it('GET /api/v1/rooms/:slug returns room detail with messages', async () => {
    const roomsResponse = await request(app.getHttpServer()).get('/api/v1/rooms');
    expect(roomsResponse.status).toBe(200);
    expect(roomsResponse.body.items.length).toBeGreaterThan(0);

    const room = roomsResponse.body.items[0] as { slug: string };
    const response = await request(app.getHttpServer()).get(`/api/v1/rooms/${room.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.slug).toBe(room.slug);
    expect(Array.isArray(response.body.messages)).toBe(true);
    expect(response.body).toHaveProperty('target');
  });

  it('POST /api/v1/rooms/:slug/messages appends a room message', async () => {
    const roomsResponse = await request(app.getHttpServer()).get('/api/v1/rooms');
    expect(roomsResponse.status).toBe(200);
    expect(roomsResponse.body.items.length).toBeGreaterThan(0);

    const room = roomsResponse.body.items[0] as { slug: string };
    const response = await request(app.getHttpServer()).post(`/api/v1/rooms/${room.slug}/messages`).send({
      userId: `msg-user-${Date.now()}`,
      userName: '消息测试用户',
      content: '先把第一屏和加入动作做顺。',
    });

    expect(response.status).toBe(201);
    expect(response.body.content).toBe('先把第一屏和加入动作做顺。');
  });

  it('POST /api/v1/discussions creates a project discussion thread', async () => {
    const projectList = await request(app.getHttpServer()).get('/api/v1/projects?page=1&pageSize=1');
    expect(projectList.status).toBe(200);
    expect(projectList.body.items.length).toBeGreaterThan(0);

    const target = projectList.body.items[0] as { id: string };
    const createResponse = await request(app.getHttpServer()).post('/api/v1/discussions').send({
      title: '这个项目最值得提炼的机制是什么？',
      targetType: 'PROJECT',
      targetId: target.id,
      authorName: '测试用户',
      content: '我觉得地图反馈和收集感是最核心的两个点。',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.targetType).toBe('PROJECT');
    expect(Array.isArray(createResponse.body.comments)).toBe(true);
    expect(createResponse.body.comments).toHaveLength(1);
  });

  it('POST /api/v1/discussions creates an incubation discussion thread', async () => {
    const incubationsResponse = await request(app.getHttpServer()).get('/api/v1/incubations?page=1&pageSize=1');
    expect(incubationsResponse.status).toBe(200);
    expect(incubationsResponse.body.items.length).toBeGreaterThan(0);

    const target = incubationsResponse.body.items[0] as { id: string };
    const createResponse = await request(app.getHttpServer()).post('/api/v1/discussions').send({
      title: '这个孵化方向最先该验证什么？',
      targetType: 'INCUBATION',
      targetId: target.id,
      authorName: '测试用户',
      content: '我会先验证第一屏的记录动作和反馈强度。',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.targetType).toBe('INCUBATION');
    expect(Array.isArray(createResponse.body.comments)).toBe(true);
    expect(createResponse.body.comments).toHaveLength(1);
  });

  it('POST /api/v1/auth/register returns token and assigns role based on existing admins', async () => {
    const suffix = Date.now().toString();
    const adminCountBefore = await prisma.user.count({
      where: { role: 'ADMIN', isSimulated: false },
    });

    const response = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      username: `auth_reg_${suffix}`,
      password: 'password123',
      displayName: '注册测试用户',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.username).toBe(`auth_reg_${suffix}`);
    expect(response.body.user.role).toBe(adminCountBefore === 0 ? 'ADMIN' : 'USER');
  });

  it('POST /api/v1/auth/login and GET /api/v1/auth/me return the current user', async () => {
    const suffix = `${Date.now()}_me`;
    const username = `auth_me_${suffix}`;
    const password = 'password123';

    const registerResponse = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      username,
      password,
      displayName: '登录测试用户',
    });

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      username,
      password,
    });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body).toHaveProperty('token');

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.username).toBe(username);
    expect(meResponse.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/v1/projects/:slug/like rejects unauthenticated requests', async () => {
    const projectList = await request(app.getHttpServer()).get('/api/v1/projects?page=1&pageSize=1');

    expect(projectList.status).toBe(200);
    expect(projectList.body.items.length).toBeGreaterThan(0);

    const project = projectList.body.items[0] as { slug: string };
    const response = await request(app.getHttpServer()).post(`/api/v1/projects/${project.slug}/like`).send({
      active: true,
    });

    expect(response.status).toBe(401);
  });

  it('authenticated users can like and favorite project / idea block / incubation', async () => {
    const suffix = `${Date.now()}_engagement`;
    const username = `auth_engage_${suffix}`;
    const password = 'password123';

    const registerResponse = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      username,
      password,
      displayName: '互动测试用户',
    });

    expect(registerResponse.status).toBe(201);

    const token = registerResponse.body.token as string;
    const userId = registerResponse.body.user.id as string;

    const [projectList, blockList, incubationList] = await Promise.all([
      request(app.getHttpServer()).get('/api/v1/projects?page=1&pageSize=1'),
      request(app.getHttpServer()).get('/api/v1/idea-blocks?page=1&pageSize=1'),
      request(app.getHttpServer()).get('/api/v1/incubations?page=1&pageSize=1'),
    ]);

    expect(projectList.status).toBe(200);
    expect(blockList.status).toBe(200);
    expect(incubationList.status).toBe(200);

    const project = projectList.body.items[0] as { slug: string };
    const block = blockList.body.items[0] as { slug: string };
    const incubation = incubationList.body.items[0] as { slug: string };

    const [projectLike, projectFavorite, blockLike, blockFavorite, incubationLike, incubationFavorite] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/projects/${project.slug}/like`)
        .set('Authorization', `Bearer ${token}`)
        .send({ active: true }),
      request(app.getHttpServer())
        .post(`/api/v1/projects/${project.slug}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ active: true }),
      request(app.getHttpServer())
        .post(`/api/v1/idea-blocks/${block.slug}/like`)
        .set('Authorization', `Bearer ${token}`)
        .send({ active: true }),
      request(app.getHttpServer())
        .post(`/api/v1/idea-blocks/${block.slug}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ active: true }),
      request(app.getHttpServer())
        .post(`/api/v1/incubations/${incubation.slug}/like`)
        .set('Authorization', `Bearer ${token}`)
        .send({ active: true }),
      request(app.getHttpServer())
        .post(`/api/v1/incubations/${incubation.slug}/favorite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ active: true }),
    ]);

    expect(projectLike.status).toBe(201);
    expect(projectLike.body.viewerHasLiked).toBe(true);
    expect(projectFavorite.status).toBe(201);
    expect(projectFavorite.body.viewerHasFavorited).toBe(true);

    expect(blockLike.status).toBe(201);
    expect(blockLike.body.viewerHasLiked).toBe(true);
    expect(blockFavorite.status).toBe(201);
    expect(blockFavorite.body.viewerHasFavorited).toBe(true);

    expect(incubationLike.status).toBe(201);
    expect(incubationLike.body.viewerHasLiked).toBe(true);
    expect(incubationFavorite.status).toBe(201);
    expect(incubationFavorite.body.viewerHasFavorited).toBe(true);

    const [projectDetail, blocksWithViewer, incubationDetail] = await Promise.all([
      request(app.getHttpServer()).get(`/api/v1/projects/${project.slug}`).set('X-Viewer-Id', userId),
      request(app.getHttpServer()).get('/api/v1/idea-blocks?page=1&pageSize=5').set('X-Viewer-Id', userId),
      request(app.getHttpServer()).get(`/api/v1/incubations/${incubation.slug}`).set('X-Viewer-Id', userId),
    ]);

    expect(projectDetail.status).toBe(200);
    expect(projectDetail.body.viewerHasLiked).toBe(true);
    expect(projectDetail.body.viewerHasFavorited).toBe(true);

    const updatedBlock = (blocksWithViewer.body.items as Array<{ slug: string; viewerHasLiked: boolean; viewerHasFavorited: boolean }>).find(
      (item) => item.slug === block.slug,
    );
    expect(updatedBlock).toBeDefined();
    expect(updatedBlock?.viewerHasLiked).toBe(true);
    expect(updatedBlock?.viewerHasFavorited).toBe(true);

    expect(incubationDetail.status).toBe(200);
    expect(incubationDetail.body.viewerHasLiked).toBe(true);
    expect(incubationDetail.body.viewerHasFavorited).toBe(true);
  });

  it('GET /api/v1/admin/users rejects unauthenticated requests', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/admin/users');

    expect(response.status).toBe(401);
  });

  it('GET /api/v1/admin/users rejects authenticated non-admin users', async () => {
    const suffix = `${Date.now()}_user`;
    const username = `auth_user_${suffix}`;
    const password = 'password123';

    const registerResponse = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      username,
      password,
      displayName: '普通用户',
    });

    expect(registerResponse.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { username } });
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'USER' },
    });

    const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      username,
      password,
    });

    expect(loginResponse.status).toBe(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(401);
  });

  it('GET /api/v1/admin/users allows authenticated admins', async () => {
    const suffix = `${Date.now()}_admin`;
    const username = `auth_admin_${suffix}`;
    const password = 'password123';

    const registerResponse = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      username,
      password,
      displayName: '管理员用户',
    });

    expect(registerResponse.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { username } });
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      username,
      password,
    });

    expect(loginResponse.status).toBe(201);

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('PATCH /api/v1/admin/comments/:id lets admins update comment content', async () => {
    const suffix = `${Date.now()}_comment_admin`;
    const username = `auth_comment_admin_${suffix}`;
    const password = 'password123';

    const registerResponse = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      username,
      password,
      displayName: '评论管理员',
    });

    expect(registerResponse.status).toBe(201);

    const admin = await prisma.user.findUniqueOrThrow({ where: { username } });
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'ADMIN' },
    });

    const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      username,
      password,
    });

    expect(loginResponse.status).toBe(201);

    const discussion = await prisma.discussion.findFirstOrThrow({
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
    expect(discussion.comments.length).toBeGreaterThan(0);

    const comment = discussion.comments[0];
    const nextContent = `管理员已修改评论内容 ${suffix}`;

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/admin/comments/${comment.id}`)
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .send({ content: nextContent });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe(nextContent);

    const updated = await prisma.comment.findUniqueOrThrow({ where: { id: comment.id } });
    expect(updated.content).toBe(nextContent);
  });
});
