// gkNextEngine 的展示数据：首页 S2 与 /engine/ 专题页共用一份。
// 指标改了只改这里，两处一起变。

export const engine = {
  name: 'gkNextEngine',
  tagline: '轻量、现代、极速光追',
  summary:
    '基于 C++20 与 Vulkan 的全平台混合渲染引擎。自研实时路径追踪与时域降噪管线，一方代码严格控制在 5 万行以内。',
  since: '2024.5',
  repo: 'https://github.com/gameknife/gkNextEngine',
  docs: 'https://gameknife.github.io/gkNextEngine/',
  releases: 'https://github.com/gameknife/gkNextEngine/releases',
  license: 'MIT',

  // 数字比形容词有说服力。改动前先跑一遍 benchmark。
  metrics: [
    { value: '420+', unit: 'FPS', label: '实时路径追踪', note: '1/2 spp + 时域降噪' },
    { value: '1600+', unit: 'FPS', label: '延迟渲染', note: 'Visibility Buffer 管线' },
    { value: '< 1', unit: 'GB', label: '显存占用', note: 'Full Bindless 资源管理' },
    { value: '50k', unit: 'LOC', label: '一方代码', note: '不含第三方依赖' },
  ],

  stack: [
    { name: 'Vulkan 1.4', primary: true },
    { name: 'Slang', primary: true },
    { name: 'C++20', primary: true },
    { name: 'Visibility Buffer', primary: false },
    { name: 'Full Bindless', primary: false },
    { name: 'SHARC', primary: false },
    { name: 'ReSTIR DI', primary: false },
    { name: '3D Gaussian Splatting', primary: false },
    { name: 'DLSS / FSR 3.1', primary: false },
    { name: 'entt ECS', primary: false },
    { name: 'Jolt Physics', primary: false },
    { name: 'QuickJS + TypeScript', primary: false },
    { name: 'WebRTC', primary: false },
    { name: 'llama.cpp', primary: false },
  ],

  shots: [
    {
      src: 'https://github.com/gameknife/gkNextEngine/releases/download/readme-assets-v1/gknexteditor.webp',
      alt: 'gkNextEditor 可视化编辑器',
      caption: 'gkNextEditor —— ImGui 低代码编辑器，节点化材质图与 cvar 实时调优',
    },
    {
      src: 'https://github.com/gameknife/gkNextEngine/releases/download/readme-assets-v1/confroom.webp',
      alt: '会议室场景的实时路径追踪结果',
      caption: '实时路径追踪 —— 1/2 spp 采样 + 时域复用 + à-trous 降噪',
    },
  ],

  pillars: [
    {
      heading: '现代 GPU 渲染设施',
      items: [
        '实时路径追踪：1/2 spp 采样 + 时域复用 + 重投影 + à-trous / JBF 降噪',
        'GPU-Driven 光栅管线：Visibility Buffer、Full Bindless、单 Draw 提交、Soft Mesh Shader',
        '硬件 Ray Query、SHARC 世界辐射缓存与 ReSTIR DI 全局照明',
        '3D Gaussian Splatting 与三角网格同帧共渲染',
        '完整超分与抗锯齿链路：DLSS / DLSS-RR / FSR 3.1 / SGSR2 / Native TAAU',
      ],
    },
    {
      heading: '引擎基础设施与运行时',
      items: [
        'entt ECS + entt::meta 反射，自动对接属性面板、撤销重做与脚本绑定',
        'ImGui 可视化编辑器：节点化材质图、cvar 实时调优、场景编辑',
        'QuickJS 嵌入式运行时 + TypeScript 热重载，无外部 Node 依赖',
        'Jolt Physics 集成：碰撞、抓取拖拽、角色与载具控制',
        'WebRTC 远程渲染 + Vulkan Video 硬件编码，浏览器零安装控制',
      ],
    },
    {
      heading: '内容管线与 AI Native 工作流',
      items: [
        '多格式结构化资产：glTF 2.0、LDraw 乐高、OpenSCAD DSL 原生解析与 CSG 求值',
        'AI Native 闭环：无头渲染截图判决、脚本驱动断言、CI 视觉回归与 Parity 校验',
        '本地推理：llama.cpp / Gemma OpenAI 兼容服务，支持 AI 内容生成与运行时决策',
      ],
    },
    {
      heading: '工程工具链',
      items: [
        '统一 CLI gnb：doctor / setup / build / run / shot / validate / benchmark 一键工作流',
        '逐 pass CPU/GPU Profiler（VulkanGpuTimer）与 Superluminal 深度集成',
        '全平台构建：Windows / Linux / macOS / iOS / Android',
      ],
    },
  ],

  subProjects: [
    { name: 'gkNextEditor', note: '可视化编辑器' },
    { name: 'MagicaLego', note: '乐高搭建' },
    { name: 'Brotato3D', note: '玩法原型' },
    { name: 'NextDayZ', note: '生存原型' },
    { name: 'BrickPlayer', note: 'LDraw 播放器' },
    { name: 'AirportSim', note: '仿真场景' },
    { name: 'StudioSim', note: '摄影棚仿真' },
  ],

  milestones: [
    { when: '2024.5', what: '项目启动，Vulkan 光追渲染器跑通第一帧' },
    { when: '2024.9', what: '时域降噪与超分链路落地，路径追踪进入可交互帧率' },
    { when: '2025.2', what: 'Visibility Buffer + Full Bindless 的 GPU-Driven 管线成型' },
    { when: '2025.6', what: 'entt ECS 与反射系统重构，gkNextEditor 编辑器可用' },
    { when: '2025.10', what: '3DGS 共渲染、SHARC 辐射缓存、AI Native 工具链闭环' },
  ],
} as const;
