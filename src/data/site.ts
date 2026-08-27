// 站点唯一配置源。换域名只改 url（外加 public/CNAME 与 astro.config.mjs 的 site）。

export const site = {
  url: 'https://gameknife.github.io',
  title: 'gameKnife',
  name_zh: '易恺铭',
  name_en: 'Kaiming Yi',

  // 首页三行定位语。OG 图、<meta>、英文版都复用这里，避免三处各自漂移。
  headline: '用 C++20 与 Vulkan 造引擎的图形工程师',
  headline_en: 'Graphics engineer building a renderer from scratch, in C++20 and Vulkan.',
  credentials: '15 年实时图形研发 · 腾讯天美 T11 · 完美世界技术专家 · 自研 gkNextEngine',
  credentials_en:
    '15 years in real-time graphics · Tencent TiMi T11 · Technical Expert at Perfect World',
  description:
    '易恺铭 / gameKnife —— 图形与游戏引擎工程师。自研 C++20 + Vulkan 混合渲染引擎 gkNextEngine，写实时渲染、引擎架构与性能优化。',

  location: 'Chengdu, China',
  email: 'kaimingyi@gmail.com',

  social: [
    { id: 'github',   label: 'GitHub',   href: 'https://github.com/gameknife',            note: '引擎源码与开源项目' },
    { id: 'zhihu',    label: '知乎',     href: 'https://www.zhihu.com/people/yi-kai-ming',  note: '技术长文同步' },
    { id: 'bilibili', label: 'B 站',     href: 'https://space.bilibili.com/17002466',      note: '引擎演示与录屏' },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/kaimingyi',   note: '职业履历' },
    { id: 'email',    label: 'Email',    href: 'mailto:kaimingyi@gmail.com',              note: '合作与咨询' },
    { id: 'rss',      label: 'RSS',      href: '/rss.xml',                                note: '全文订阅' },
  ],

  nav: [
    { label: '首页',   href: '/' },
    { label: '引擎',   href: '/engine/' },
    { label: '博客',   href: '/blog/' },
    { label: '作品',   href: '/works/' },
    { label: '简历',   href: '/resume/' },
    { label: '关于',   href: '/about/' },
  ],

  categories: {
    tech: { label: '技术', note: '渲染、引擎、性能' },
    life: { label: '随笔', note: '工作与生活' },
    art:  { label: '美术', note: '绘画与静帧' },
  } as const,

  // /resume/ 头部那段自我介绍。原 _config.yml 的 name / job / languages / location。
  resumeIntro: {
    name: 'Yi Kaiming',
    job: 'game develop engineer',
    languages: 'Game & Graphics Development, and an enthusiastic gamer, definitely.',
    location: 'Chengdu, China',
  },

  // Giscus（GitHub Discussions 评论）。留空则文章页不渲染评论区。
  giscus: {
    repo: '' as `${string}/${string}` | '',
    repoId: 'MDEwOlJlcG9zaXRvcnkzMTk2MzMxMA==',
    category: 'Announcements',
    categoryId: 'DIC_kwDOAee4rs4DEUgU',
  },

  // Cloudflare Web Analytics token，留空则不注入脚本。
  analyticsToken: '6dc8e06fb314426eb46a3e1b106a58bc',
} as const;

export type SocialLink = (typeof site.social)[number];
