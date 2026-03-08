import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface CommentTemplate {
  patterns: string[];
  templates: string[];
}

@Injectable()
export class AdminCommentSeedService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly commentTemplates: Record<string, CommentTemplate> = {
    general: {
      patterns: ['positive', 'critical', 'curious', 'suggestive'],
      templates: [
        '这个点子很有趣，让我想到{related_idea}',
        '用过类似的产品，这个的差异化在于{unique_point}',
        '如果能加上{feature}会更完善',
        '不太理解{confusion_point}，有人能解释一下吗？',
        '这正是我一直在找的解决方案！',
        '商业模式看起来不太清晰，{concern}',
        '体验过，{experience_feedback}',
        '作为{user_type}，我觉得{opinion}',
      ],
    },
    product: {
      patterns: ['feature_request', 'bug_report', 'praise', 'comparison'],
      templates: [
        '刚下载试了一下，{first_impression}',
        '和{competitor}相比，这个产品{comparison_result}',
        '界面设计{design_opinion}，但是{design_issue}',
        '功能很完整，不过{missing_feature}',
        '定价策略{pricing_opinion}，对{target_user}来说{pricing_result}',
        '使用一周后的反馈：{long_term_feedback}',
        '推荐给{recommendation_target}使用',
        '希望开发者能考虑{suggestion}',
      ],
    },
    idea: {
      patterns: ['validation', 'challenge', 'extension', 'connection'],
      templates: [
        '这个点子可以延伸到{extension_area}',
        '和{related_idea}结合起来会很有意思',
        '我之前也想过类似的方向，{similar_experience}',
        '最大的风险可能是{risk}',
        '冷启动策略{launch_opinion}，建议{launch_suggestion}',
        '目标用户定义得{target_clarity}，可能需要{target_adjustment}',
        '这个机制在{scenario}场景下特别适用',
        '如果做成{product_form}形式，会不会更有吸引力？',
      ],
    },
  };

  private readonly fillInTheBlanks: Record<string, string[]> = {
    related_idea: ['把地图社交化', '游戏化设计', '轻量级记录', '反差营销'],
    unique_point: ['更轻量', '更有趣味性', '解决了真实痛点'],
    feature: ['数据导出', '社交分享', '深色模式', '离线功能'],
    confusion_point: ['用户留存策略', '盈利模式', '技术实现'],
    experience_feedback: ['流畅度不错', '有些功能藏得太深', '上手门槛比预期低'],
    user_type: ['独立开发者', '产品经理', '设计师', '普通用户'],
    opinion: ['核心功能很清晰', '还需要更多场景验证', '这是个伪需求'],
    first_impression: ['打开速度很快', '引导做得很贴心', '有点让人困惑'],
    competitor: ['竞品A', '同类产品B', '传统解决方案'],
    comparison_result: ['更简洁', '功能更全面', '体验更流畅'],
    design_opinion: ['很清爽', '有高级感', '符合直觉'],
    design_issue: ['某些按钮位置不太合理', '配色可以再优化'],
    missing_feature: ['缺少搜索功能', '希望能有更多自定义选项'],
    pricing_opinion: ['偏高', '合理', '很有竞争力'],
    target_user: ['个人用户', '小企业', '学生群体'],
    pricing_result: ['有点贵', '可以接受', '物超所值'],
    long_term_feedback: ['已经成为日常工具', '新鲜感过了就没用了'],
    recommendation_target: ['做效率工具的朋友', '喜欢尝鲜的人'],
    suggestion: ['增加快捷键支持', '优化移动端体验', '提供更多模板'],
    extension_area: ['企业服务', '教育场景', '健康管理'],
    similar_experience: ['但后来放弃了', '正在验证中'],
    risk: ['市场教育成本', '用户习惯难以改变', '大厂入场'],
    launch_opinion: ['有点激进', '过于保守', '恰到好处'],
    launch_suggestion: ['先在小圈子测试', '找一个垂直场景切入'],
    target_clarity: ['比较清晰', '有些模糊', '需要进一步细分'],
    target_adjustment: ['做用户调研', '缩小初始范围'],
    scenario: ['职场效率', '个人成长', '家庭管理'],
    product_form: ['小程序', '浏览器插件', '桌面应用'],
  };

  private readonly personaTone: Record<string, { prefix: string[]; suffix: string[] }> = {
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
      prefix: ['副业角度', '周末项目', ' side hustle'],
      suffix: ['时间成本要考虑', 'ROI很重要', '先跑通MRR'],
    },
    productivity_ninja: {
      prefix: ['效率角度', '工作流优化', '时间管理'],
      suffix: ['可以整合进我的系统', '减少上下文切换', '自动化是关键'],
    },
  };

  async generateSimulatedComments(options: {
    discussionIds?: string[];
    countPerDiscussion?: number;
    userIds?: string[];
  }) {
    const countPerDiscussion = options.countPerDiscussion || 3;
    
    // 获取模拟用户
    let users = options.userIds?.length 
      ? await this.prisma.user.findMany({ where: { id: { in: options.userIds } } })
      : await this.prisma.user.findMany({ where: { isSimulated: true } });

    if (users.length === 0) {
      throw new Error('No simulated users found. Please create simulated users first.');
    }

    // 获取讨论
    let discussions: Array<{ id: string; title: string; targetType: string }>;
    if (options.discussionIds?.length) {
      discussions = await this.prisma.discussion.findMany({
        where: { id: { in: options.discussionIds } },
        select: { id: true, title: true, targetType: true },
      });
    } else {
      discussions = await this.prisma.discussion.findMany({
        take: 20,
        select: { id: true, title: true, targetType: true },
      });
    }

    const created: Array<{ id: string; discussionId: string; authorName: string }> = [];

    for (const discussion of discussions) {
      const category = discussion.targetType === 'PROJECT' ? 'product' : 'idea';
      const templateGroup = this.commentTemplates[category] || this.commentTemplates.general;

      for (let i = 0; i < countPerDiscussion; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const content = this.generateCommentContent(user.persona || 'general', templateGroup);

        try {
          const comment = await this.prisma.comment.create({
            data: {
              discussionId: discussion.id,
              authorId: user.id,
              authorName: user.displayName,
              content,
              isSimulated: true,
              status: 'APPROVED',
            },
          });
          created.push({ id: comment.id, discussionId: discussion.id, authorName: user.displayName });
        } catch (error) {
          console.error('Failed to create comment:', error);
        }
      }

      // 更新讨论的评论计数
      const commentCount = await this.prisma.comment.count({
        where: { discussionId: discussion.id },
      });
      
      await this.prisma.discussion.update({
        where: { id: discussion.id },
        data: { 
          replyCount: commentCount,
          lastActivityAt: new Date(),
        },
      });
    }

    return { count: created.length, comments: created };
  }

  private generateCommentContent(persona: string, templateGroup: CommentTemplate): string {
    const template = templateGroup.templates[Math.floor(Math.random() * templateGroup.templates.length)];
    const tone = this.personaTone[persona] || { prefix: [], suffix: [] };

    let content = template;

    // 填充模板变量
    const matches = content.match(/\{([^}]+)\}/g);
    if (matches) {
      for (const match of matches) {
        const key = match.slice(1, -1);
        const options = this.fillInTheBlanks[key];
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
      const emojis = ['👍', '💡', '🤔', '✨', '🚀', '👀', '💪'];
      content = `${content} ${emojis[Math.floor(Math.random() * emojis.length)]}`;
    }

    return content;
  }

  async clearSimulatedComments() {
    const result = await this.prisma.comment.deleteMany({
      where: { isSimulated: true },
    });

    // 重置讨论的回复计数
    const discussions = await this.prisma.discussion.findMany({
      select: { id: true },
    });

    for (const discussion of discussions) {
      const count = await this.prisma.comment.count({
        where: { discussionId: discussion.id },
      });
      await this.prisma.discussion.update({
        where: { id: discussion.id },
        data: { replyCount: count },
      });
    }

    return { deleted: result.count };
  }
}
