// 由 scripts/convert-data.mjs 从 _data/cv.yml 生成。
// 这份数据同时驱动 /cv/ 页面与 CI 导出的 PDF —— 改这里，两处一起变。
//
// 排版预算：正文约 2 页 A4。每加 3~4 行正文就会多出小半页。

export interface CvBasics {
  name_zh: string; name_en: string; headline: string;
  location: string; email: string; github: string; site: string;
}
export interface CvSkillGroup { group: string; group_en: string; items: string[] }
export interface CvExperience {
  title: string; company: string; period: string; summary: string; highlights: string[];
}
export interface CvProject {
  title: string; role: string; period: string; link?: string; highlights: string[];
}
export interface CvEducation { degree: string; school: string; period: string }
export interface CvAdditional { label: string; text: string }

export const basics: CvBasics = {
  "name_zh": "易恺铭",
  "name_en": "Kaiming Yi",
  "headline": "资深图形与游戏引擎工程师 · AI Native 工具链",
  "location": "Chengdu, China",
  "email": "kaimingyi@163.com",
  "github": "gameknife",
  "site": "gameknife.github.io"
};

export const summary = "15 年实时图形与引擎研发经验，横跨大型商业项目（腾讯天美 T11、完美世界）与前沿自研引擎，具备多款游戏产品上线与长线运营调优经验。精通 Modern C++20 与 Vulkan 跨平台底层架构；主导过多个大规模商业项目的图形效果落地与中低端机型专项性能优化，擅长定位与攻坚在线项目各类疑难 Crash 及性能瓶颈；深耕 AI Native 智能工具链与工程效能闭环，具备全栈开发与团队技术引领能力。";

export const skills: CvSkillGroup[] = [
  {
    "group": "图形与引擎",
    "group_en": "Graphics & Engine",
    "items": [
      "精通 Modern C++20 与 Vulkan 跨平台底层架构（Windows / Linux / macOS / iOS / Android）；具备坚实的数学功底，精通光栅管线推导、SIMD 加速与多线程 Task 调度，独立手写 CPU 软渲染器",
      "熟练运用 Slang / HLSL / GLSL 着色器语言；深入实践实时路径追踪（1/2 spp + 时域降噪）、Visibility Buffer、Full Bindless 资源管理、SHARC 辐射缓存、3D Gaussian Splatting 共渲染以及 DLSS / FSR / SGSR2 等主流超分方案",
      "熟练设计现代引擎基础设施：集成 EnTT ECS 模式、entt::meta 反射系统、Jolt 物理引擎以及 QuickJS / TypeScript 运行时热重载",
      "深入理解商业引擎架构：具备 Unreal Engine 4/5（C++ / 蓝图 / 渲染 / 运行时调试 / DS / 编辑器性能优化）、Unity（C# / Shader / 内存与 GC 优化 / ARKit）及 CryEngine 核心开发经验"
    ]
  },
  {
    "group": "AI Native 与工具链",
    "group_en": "AI Native & Toolchain",
    "items": [
      "熟练将 AI Agent（如 Claude Code / Codex）引入实际工程，实现“开发 - Headless 截图/脚本断言 - CI 视觉回归 - 差异校验”的 AI Agent 自动化闭环流程",
      "具备前沿的 AI 运行时整合能力：打通 llama.cpp / Gemma 本地 OpenAI 兼容推理服务与远程 WebRTC 渲染，探索 LLM 在游戏运行时的辅助决策与智能交互",
      "精通几何建模与资产管线：开发 OpenSCAD DSL 原生解析与 CSG 几何求值引擎，支持 LDraw 乐高资产导入及 glTF 2.0 格式规范",
      "完善的工程效能栈：自研跨平台 CLI 工具链（gnb），熟练使用 VulkanGpuTimer 与 Superluminal 进行性能 Profiling，具备 Node.js / Electron 开发及 GitHub Actions / GitLab CI 部署经验"
    ]
  },
  {
    "group": "技术美术",
    "group_en": "Technical Art",
    "items": [
      "具备专业美术绘画训练与写生基础，拥有良好的审美判断力；熟练使用 3ds Max / C4D / Blender 及 Substance 套件，无缝对接 TA 工作流与美术生产管线"
    ]
  }
];

export const experience: CvExperience[] = [
  {
    "title": "技术专家",
    "company": "完美世界·天智游工作室",
    "period": "2023.5 – Present",
    "summary": "负责工作室新项目的基础设施建设、技术选型与关键技术攻关。",
    "highlights": [
      "主导大规模多人协作地形编辑方案与性能优化落地（<a href=\"https://www.bilibili.com/video/BV1sx421U75D\" target=\"_blank\">B 站演示视频</a>）",
      "针对大型团队优化 Perforce 分支协同与版本流控制，解决网络同步瓶颈，保障编辑器高帧率与稳定性",
      "设计基于 UE5 的并行化打包与分布式 Cook 方案，显著缩短 CI 自动出档时间"
    ]
  },
  {
    "title": "高级工程师 (T11)",
    "company": "腾讯·天美工作室群",
    "period": "2015.7 – 2023.5",
    "summary": "供职于研发部与天美工作室群，负责重要前端系统开发、图形效果实现与项目整体性能优化。",
    "highlights": [
      "Project X（BR 手游，TiMi L2）：构建全平台并行 CI 出档与蓝图静态编译检查；基于 GeometryScript 实现过程化关卡 Blockout 流程；落地基于 Puerts 的局外 MVC UI 架构与局内高性能 HUD 渲染",
      "Project M（MOBA 手游，TiMi L2）：实现帧同步启发式 A* 动态寻路与局部导航规避；针对 MOBA 视点深度定制 CSM 阴影渲染以降低 DrawCall；负责中低端机型内存、Fragment 及 Scalability 专项调优，保障海外顺利发行",
      "SSKGame《圣斗士星矢》（TiMi L1）：开发 GPU 加速伤害数字系统及描边/假实时阴影等 Shell 特效系统；实现局部抗锯齿与展示角色高精度渲染；负责 iOS ARKit 与华为 hiAR 技术的深度集成",
      "Project G《一起来捉妖》（TiMi J5）：设计 MatCap 角色渲染与低成本场景材质；实现相机陀螺仪 AR 实景光照模拟；制定美术资源规格并搭建每日自动扫描报告工具",
      "早期技术预研：主导过程化无限地形 LOD 建模（集成噪声与水力/热力侵蚀算法）；实现体素沙盒在 Unity 中的 Native 渲染与体素光能传递"
    ]
  },
  {
    "title": "高级内核系统工程师",
    "company": "中视典",
    "period": "2013.4 – 2015.7",
    "summary": "供职于内核研发部，负责自研虚拟现实引擎 OpenVRP 的设计与开发。",
    "highlights": [
      "主导渲染器、场景管理与骨骼动画系统设计；抽象跨平台 RHI 层，成功实现 OpenGL ES 2.0 / OpenGL 渲染后端",
      "开发跨平台多线程任务调度（Job System）与高效异步 IO 库；基于 xtp 框架主导开发 OpenVRP 引擎编辑器"
    ]
  },
  {
    "title": "游戏引擎工程师",
    "company": "北京永航科技",
    "period": "2012.9 – 2013.4",
    "summary": "供职于底层研发部，负责尖端技术预研、引擎维护与性能优化。",
    "highlights": [
      "X52《QQ 炫舞 2》：在 DX9 架构下利用 GPU 粒子与 Vertex Shader 实现 8 万根发丝的运动模拟及各向异性头发光照渲染",
      "引入 D3D9Ex 架构彻底解决 Direct3D 设备丢失与显存溢出问题；开发外挂式 Profiler 实现逐版本自动性能跟踪"
    ]
  },
  {
    "title": "游戏引擎工程师",
    "company": "搜狐畅游",
    "period": "2011.2 – 2012.9",
    "summary": "使用 CryEngine 开发 MMO ARPG《蛮荒搜神记》，负责美术工具链、游戏逻辑与性能优化。",
    "highlights": [
      "实现皮肤渲染、多区域变色与 Shell 壳材质；编写帧率无关的实时攻击判定与大型生物部位受击破坏；优化双足并扩展四足 IK",
      "开发 3ds Max 插件打通并完善 CryEngine 工具链；使用内置 Profiler 针对大场景进行 DrawCall 与物理碰撞优化"
    ]
  }
];

export const projects: CvProject[] = [
  {
    "title": "gkNextEngine",
    "role": "个人自研引擎",
    "period": "2024.5 – Present",
    "link": "https://github.com/gameknife/gkNextEngine",
    "highlights": [
      "C++20 + Vulkan 跨平台混合渲染引擎，自研实时路径追踪与时域降噪管线",
      "现代 GPU-Driven 架构，集成 Visibility Buffer、Full Bindless、SHARC / ReSTIR DI、3DGS 共渲染及 DLSS 3 / FSR 3.1",
      "模块化运行时：支持 EnTT ECS 与元反射、QuickJS + TypeScript 热重载及 Jolt 物理引擎",
      "AI Native 工具链：自研 gnb CLI、集成 llama.cpp 本地推理及 CI 视觉回归测试"
    ]
  },
  {
    "title": "SoftRenderer",
    "role": "个人开源软件渲染器",
    "period": "2013.10 – Present",
    "link": "https://github.com/gameknife/SoftRenderer",
    "highlights": [
      "纯 CPU 实现完整可编程图形管线，自研高加速 SIMD 数学库与 Job System 抽象，支持自定义顶点/像素着色器",
      "优化后在 Sponza 场景下达到可交互的 30+ FPS（基于 i7-7700K）；使用 Electron + Node-API 构建跨平台交互外壳"
    ]
  },
  {
    "title": "PUBG-Procedural",
    "role": "个人独立游戏项目（UE4）",
    "period": "2019.4 – 2019.7",
    "highlights": [
      "实现了随机海岛、地貌、公路环网的过程化生成，支持动态关卡加载、植被竞争生长模型与类 PUBG 基础枪械系统",
      "基于 UE4 Dedicated Server 实现多人局域网 PVP 物理运动与网络状态同步"
    ]
  }
];

export const education: CvEducation[] = [
  {
    "degree": "MSc Computer Technology",
    "school": "Communication University of China",
    "period": "2012 – 2014"
  },
  {
    "degree": "BA Game Development",
    "school": "Communication University of China",
    "period": "2007 – 2011"
  },
  {
    "degree": "High School",
    "school": "Chengdu No.7 Middle School",
    "period": "2004 – 2007"
  }
];

export const additional: CvAdditional[] = [
  {
    "label": "美术",
    "text": "长期进行 CG 静帧、油画与素描写生创作，过程材质与美术作品见个人站点。"
  },
  {
    "label": "游戏",
    "text": "1994 年起的主机与 PC 硬核玩家（Steam 23 级 / 200+ 游戏收藏）；曾参与 Minecraft Forge 模组开发与玩法研究。"
  }
];
