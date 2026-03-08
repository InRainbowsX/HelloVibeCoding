import { PrismaClient, ContentStatus, CommentStatus } from '@prisma/client';

const prisma = new PrismaClient();

// 模拟用户数据
const simulatedUsers = [
  { username: 'indie_builder_01', displayName: '林小北', persona: 'indie_hacker', bio: '正在打造自己的微小产品。相信好的设计能解决大问题。' },
  { username: 'pm_lisa', displayName: '李产品', persona: 'product_manager', bio: '产品设计是理性与感性的平衡。' },
  { username: 'designer_chen', displayName: '陈视觉', persona: 'designer', bio: '界面是产品的灵魂。' },
  { username: 'dev_zhang', displayName: '码农张', persona: 'developer', bio: '代码是我的画布。' },
  { username: 'founder_wang', displayName: '创业者刘', persona: 'startup_founder', bio: '二次创业中，专注产品方向。' },
  { username: 'techie_zhou', displayName: '极客钱', persona: 'tech_enthusiast', bio: '对新技术充满好奇。' },
  { username: 'side_projector', displayName: '副业陈', persona: 'side_project_lover', bio: '主业养生活，副业养梦想。' },
  { username: 'ninja_xu', displayName: '效率刘', persona: 'productivity_ninja', bio: '效率至上，工具为王。' },
  { username: 'builder_ming', displayName: '陈知行', persona: 'indie_hacker', bio: '独立开发者，专注小而美的工具。' },
  { username: 'ux_daisy', displayName: '周体验', persona: 'product_manager', bio: '关注用户体验背后的商业逻辑。' },
  { username: 'pixel_li', displayName: '林交互', persona: 'designer', bio: '相信细节决定体验。' },
  { username: 'fullstack_yang', displayName: '程序李', persona: 'developer', bio: '全栈开发，偏向前端体验。' },
];

// 评论模板
const commentTemplates = {
  product: [
    '刚下载试了一下，{first_impression}',
    '界面设计{design_opinion}，但是{design_issue}',
    '功能很完整，不过{missing_feature}',
    '定价策略{pricing_opinion}，对{target_user}来说{pricing_result}',
    '使用一周后的反馈：{long_term_feedback}',
    '希望开发者能考虑{suggestion}',
  ],
  idea: [
    '这个点子可以延伸到{extension_area}',
    '和{related_idea}结合起来会很有意思',
    '最大的风险可能是{risk}',
    '冷启动策略{launch_opinion}，建议{launch_suggestion}',
    '目标用户定义得{target_clarity}，可能需要{target_adjustment}',
    '如果做成{product_form}形式，会不会更有吸引力？',
  ],
  general: [
    '这个点子很有趣，让我想到{related_idea}',
    '用过类似的产品，这个的差异化在于{unique_point}',
    '如果能加上{feature}会更完善',
    '不太理解{confusion_point}，有人能解释一下吗？',
    '这正是我一直在找的解决方案！',
    '作为{user_type}，我觉得{opinion}',
  ],
};

const fillInTheBlanks: Record<string, string[]> = {
  first_impression: ['打开速度很快', '引导做得很贴心', '有点让人困惑', '上手比想象中容易'],
  design_opinion: ['很清爽', '有高级感', '符合直觉', '视觉层次分明'],
  design_issue: ['某些按钮位置不太合理', '配色可以再优化', '字体大小可以调整'],
  missing_feature: ['缺少搜索功能', '希望能有更多自定义选项', '同步功能待完善'],
  pricing_opinion: ['偏高', '合理', '很有竞争力', '对学生党友好'],
  target_user: ['个人用户', '小企业', '学生群体', '自由职业者'],
  pricing_result: ['有点贵', '可以接受', '物超所值', '值得付费'],
  long_term_feedback: ['已经成为日常工具', '新鲜感过了就没用了', '越用越顺手'],
  suggestion: ['增加快捷键支持', '优化移动端体验', '提供更多模板'],
  extension_area: ['企业服务', '教育场景', '健康管理', '社交功能'],
  related_idea: ['把地图社交化', '游戏化设计', '轻量级记录', '反差营销'],
  risk: ['市场教育成本', '用户习惯难以改变', '大厂入场', '政策风险'],
  launch_opinion: ['有点激进', '过于保守', '恰到好处', '值得尝试'],
  launch_suggestion: ['先在小圈子测试', '找一个垂直场景切入', '做内容营销'],
  target_clarity: ['比较清晰', '有些模糊', '需要进一步细分', '范围太广'],
  target_adjustment: ['做用户调研', '缩小初始范围', '找种子用户'],
  product_form: ['小程序', '浏览器插件', '桌面应用', 'PWA'],
  unique_point: ['更轻量', '更有趣味性', '解决了真实痛点', '价格更合理'],
  feature: ['数据导出', '社交分享', '深色模式', '离线功能'],
  confusion_point: ['用户留存策略', '盈利模式', '技术实现路径'],
  user_type: ['独立开发者', '产品经理', '设计师', '普通用户'],
  opinion: ['核心功能很清晰', '还需要更多场景验证', '这是个伪需求', '潜力巨大'],
};

const personaTone: Record<string, { prefix: string[]; suffix: string[] }> = {
  indie_hacker: {
    prefix: ['从开发者角度', '作为一个build in public的人', '个人经验'],
    suffix: ['值得尝试MVP', '周末可以hack一下', '代码实现应该不难'],
  },
  product_manager: {
    prefix: ['从PM视角看', '产品逻辑上', '用户需求层面'],
    suffix: ['需要验证核心假设', '建议先做MVP验证', '关注北极星指标'],
  },
  designer: {
    prefix: ['视觉上', '交互层面', '从体验角度'],
    suffix: ['可以优化信息架构', '动效可以更丰富', '一致性很重要'],
  },
  developer: {
    prefix: ['技术上', '从实现角度', '代码层面'],
    suffix: ['可以用现有框架', 'API设计要合理', '性能需要考虑'],
  },
  startup_founder: {
    prefix: ['创业角度', '商业化视角', '从0到1'],
    suffix: ['关注PMF', '融资角度要考虑', '团队执行力关键'],
  },
  tech_enthusiast: {
    prefix: ['作为早期用户', '从尝鲜角度', '科技爱好者'],
    suffix: ['期待更多功能', '愿意付费支持', '会推荐给朋友'],
  },
  side_project_lover: {
    prefix: ['副业角度', '周末项目', 'side hustle'],
    suffix: ['时间成本要考虑', 'ROI很重要', '先跑通MRR'],
  },
  productivity_ninja: {
    prefix: ['效率角度', '工作流优化', '时间管理'],
    suffix: ['可以整合进我的系统', '减少上下文切换', '自动化是关键'],
  },
};

function generateCommentContent(persona: string, category: 'product' | 'idea' | 'general'): string {
  const templates = commentTemplates[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const tone = personaTone[persona] || { prefix: [], suffix: [] };

  let content = template;

  // 填充模板变量
  const matches = content.match(/\{([^}]+)\}/g);
  if (matches) {
    for (const match of matches) {
      const key = match.slice(1, -1);
      const options = fillInTheBlanks[key];
      if (options) {
        const value = options[Math.floor(Math.random() * options.length)];
        content = content.replace(match, value);
      }
    }
  }

  // 添加个性化前缀/后缀
  const hasPrefix = Math.random() > 0.5 && tone.prefix.length > 0;
  const hasSuffix = Math.random() > 0.5 && tone.suffix.length > 0;

  if (hasPrefix) {
    const prefix = tone.prefix[Math.floor(Math.random() * tone.prefix.length)];
    content = `${prefix}，${content}`;
  }

  if (hasSuffix) {
    const suffix = tone.suffix[Math.floor(Math.random() * tone.suffix.length)];
    content = `${content}。${suffix}。`;
  }

  // 偶尔添加emoji
  if (Math.random() > 0.7) {
    const emojis = ['👍', '💡', '🤔', '✨', '🚀', '👀', '💪', '🔥'];
    content = `${content} ${emojis[Math.floor(Math.random() * emojis.length)]}`;
  }

  return content;
}

async function main() {
  console.log('开始生成模拟数据...');

  // 1. 创建模拟用户
  console.log('创建模拟用户...');
  const createdUsers = [];
  for (const userData of simulatedUsers) {
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        ...userData,
        isSimulated: true,
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ ${user.displayName} (${user.persona})`);
  }

  // 2. 获取所有讨论
  const discussions = await prisma.discussion.findMany({
    select: { id: true, title: true, targetType: true },
  });
  console.log(`\n找到 ${discussions.length} 个讨论主题`);

  // 3. 为每个讨论生成评论
  console.log('生成模拟评论...');
  let totalComments = 0;

  for (const discussion of discussions) {
    const category = discussion.targetType === 'PROJECT' ? 'product' : 'idea';
    const commentCount = Math.floor(Math.random() * 4) + 2; // 2-5条评论

    for (let i = 0; i < commentCount; i++) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const content = generateCommentContent(user.persona || 'general', category);

      try {
        await prisma.comment.create({
          data: {
            discussionId: discussion.id,
            authorId: user.id,
            authorName: user.displayName,
            content,
            isSimulated: true,
            status: CommentStatus.APPROVED,
          },
        });
        totalComments++;
      } catch (error) {
        console.error(`创建评论失败: ${error}`);
      }
    }

    // 更新讨论的评论计数
    const count = await prisma.comment.count({
      where: { discussionId: discussion.id },
    });
    
    await prisma.discussion.update({
      where: { id: discussion.id },
      data: { 
        replyCount: count,
        lastActivityAt: new Date(),
      },
    });
  }

  console.log(`  ✓ 成功创建 ${totalComments} 条模拟评论`);

  // 4. 输出统计
  console.log('\n=== 模拟数据生成完成 ===');
  console.log(`模拟用户: ${createdUsers.length} 个`);
  console.log(`模拟评论: ${totalComments} 条`);
  
  const stats = await prisma.comment.groupBy({
    by: ['status'],
    where: { isSimulated: true },
    _count: { id: true },
  });
  
  console.log('\n评论状态分布:');
  for (const stat of stats) {
    console.log(`  ${stat.status}: ${stat._count.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
