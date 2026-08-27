// 由 scripts/convert-data.mjs 从 _data/{jobs,skills,projects,education}.yml 生成。
// 已剥离原先混在 YAML 里的 <ul>/<li>/<lis> 标签 —— 这里只有数据，排版归组件管。

export interface ProjectGroup { heading: string; items: string[] }
export interface ProjectImage { src: string; alt: string }
export interface Project {
  title: string; company: string; period: string;
  images: ProjectImage[]; groups: ProjectGroup[];
  link: { href: string; label: string } | null;
}
export interface Job { title: string; company: string; period: string; description: string }
export interface SkillGroup { title: string; items: string[] }
export interface Education { qualification: string; school: string }

export const jobs: Job[] = [
  {
    "title": "Technical Expert",
    "company": "PerfectWorld TZY",
    "period": "2023.5 - Current",
    "description": "作为技术专家，负责工作室新项目的基础设施建设，技术选型，关键技术攻关等工作。"
  },
  {
    "title": "Senior Engineer (T11)",
    "company": "Tencent",
    "period": "2015.7 - 2023.5",
    "description": "作为移动游戏开发者，供职于研发部和天美工作室。主要负责一些重要前端系统的开发，图形效果实现与优化，以及整体性能优化工作。"
  },
  {
    "title": "Senior Kernel System Engineer",
    "company": "Vistandard",
    "period": "2013.4 - 2015.7",
    "description": "作为引擎开发者，供职于内核研发部。主要负责自研虚拟现实引擎的设计与开发。"
  },
  {
    "title": "Game Engine Engineer",
    "company": "Horizon3D",
    "period": "2012.9 - 2013.4",
    "description": "作为引擎开发者，供职于底层研发部。主要负责一些尖端技术的预研，以及引擎维护与性能优化工作。"
  },
  {
    "title": "Game Engine Engineer",
    "company": "Changyou",
    "period": "2011.2 - 2012.9",
    "description": "使用CryEngine开发一款MMO ARPG，主要负责美术工具链开发，游戏逻辑开发，性能优化工作。"
  }
];

export const skills: SkillGroup[] = [
  {
    "title": "Graphics & Engine Programming",
    "items": [
      "十余年 C++/C# 编程经验与 5+ 年 JS/TS 动态语言经验；精通 Modern C++20 与 Vulkan 跨平台底层架构 (Windows / Linux / macOS / iOS / Android)，具备独立自研从底层光栅化到 Ray Query 光线追踪引擎的全栈能力",
      "精通 Slang / HLSL / GLSL 着色器语言，深入实践实时路径追踪 (1/2spp + 时域降噪)、Visibility Buffer、Full Bindless GPU 资源管理、SHARC 辐射缓存、3D Gaussian Splatting (高斯溅射) 混合共渲染以及 DLSS/FSR/SGSR2 等主流超分方案",
      "坚实的高等数学与线性代数推导功底，曾独立手写 CPU 端 SoftRenderer，对光栅化管线、透视投影、SIMD 指令集加速与多线程 Task 调度有极强的底层掌控",
      "精通游戏引擎基础设施设计，熟练运用 ECS (EnTT) 模式、entt::meta 类型反射系统、Jolt 物理引擎整合、ImGui 节点化材质/低代码编辑器，以及 QuickJS / TypeScript 运行时热重载",
      "深入理解现代商业游戏引擎架构，具备 Unreal Engine 4/5 (蓝图/C++/GeometryScript/CSM/Scalability)、Unity (C#/Shader/MatCap/GC 优化/ARKit) 及 CryEngine 的核心开发与性能优化经验"
    ]
  },
  {
    "title": "AI Native & Toolchain",
    "items": [
      "前瞻性的 AI Native 与 3D 内容工具链视野，设计 OpenSCAD DSL 原生解析求值器与 LDraw 乐高/LGEO 资产导入管线，实现结构化 3D 内容在引擎运行时的可解析与可编辑",
      "构建 AI Agent 无头渲染截图 (gnb shot)、脚本驱动断言验证与 CI 视觉回归/Parity 校验回路，形成“生成 → 运行 → 验证 → 迭代”的闭环",
      "整合 llama.cpp / Gemma 本地 OpenAI 兼容推理服务与 WebRTC 远程渲染 (Remote Play)，赋能 AI 3D 资产生成、自动化测试及游戏内决策",
      "熟练设计跨平台 CLI 工具链 (gnb)，精通 VulkanGpuTimer 与 Superluminal Profiler 性能分析集成，具备 Node.js / Electron / Koa 桌面与 Web 工具链开发及 GitHub Actions / GitLab CI 部署经验"
    ]
  },
  {
    "title": "Art & Aesthetics",
    "items": [
      "从小爱好绘画，接受专业美术训练，具备扎实的美术写生基础与良好的审美素养",
      "熟练使用生产力工具 (3ds Max / Cinema 4D / Blender / Photoshop / Substance Designer & Painter)，理解并实践技术美术 (TA) 工作流",
      "与美术专业团队保持良好共识与沟通协作基础，熟知各类游戏风格的美术实现细节与管线对接"
    ]
  },
  {
    "title": "Gaming & Experience",
    "items": [
      "94年接触游戏，硬核主机与 PC 游戏玩家，Steam 深度用户 (23级, 200+ 游戏收藏, 2000+ 总游戏时长)",
      "深度参与游戏 MOD 制作 (如 Minecraft Forge 拓展、行为包等) 与玩法机制预研"
    ]
  }
];

export const education: Education[] = [
  {
    "qualification": "MSc Computer Technology",
    "school": "Communication University of China"
  },
  {
    "qualification": "BA Game Development",
    "school": "Communication University of China"
  },
  {
    "qualification": "High School",
    "school": "Chengdu No.7 Middle School"
  }
];

export const projects: Project[] = [
  {
    "title": "gkNextEngine",
    "company": "Personal",
    "period": "2024.5 - Current",
    "images": [
      {
        "src": "https://github.com/gameknife/gkNextEngine/releases/download/readme-assets-v1/gknexteditor.webp",
        "alt": "gkNextEditor"
      },
      {
        "src": "https://github.com/gameknife/gkNextEngine/releases/download/readme-assets-v1/confroom.webp",
        "alt": "Real-Time Path Tracing"
      }
    ],
    "groups": [
      {
        "heading": "现代 GPU 渲染设施与光线追踪",
        "items": [
          "基于 C++20 与 Vulkan 的全平台 3D 渲染引擎 (Windows / Linux / macOS / iOS / Android)",
          "实时路径追踪 (1/2spp 采样 + 时域复用 + 重投影 + à-trous/JBF 降噪) 与 Hybrid 渲染管线",
          "现代 GPU 光栅管线：Visibility Buffer、Full Bindless 资源管理、GPU-Driven 单 Draw 提交、Soft Mesh Shader",
          "硬件 Ray Query 光照计算、SHARC 世界辐射缓存复用 (Radiance Cache) 与 ReSTIR DI 全局照明",
          "3D Gaussian Splatting (PlayCanvas SOG v2) 硬件 Billboard 与 Triangle Mesh 同帧共渲染",
          "完整集成主流超分与抗锯齿管线 (DLSS / DLSS-RR / FidelityFSR 3.1 / SGSR2 / Native TAAU)"
        ]
      },
      {
        "heading": "引擎基础设施与运行时",
        "items": [
          "ECS (EnTT) 模式 + entt::meta 类型反射系统，全自动对接编辑器属性面板、撤销/重做与脚本绑定",
          "基于 ImGui 的可视化低代码编辑器 (节点化材质图、cvar 实时调优、场景可视化编辑)",
          "QuickJS 嵌入式运行时 + TypeScript 脚本热重载 (无外部 Node 依赖，改动即时生效)",
          "Jolt Physics 物理引擎集成 (碰撞、抓取拖拽、角色与载具移动控制)",
          "WebRTC 远程渲染与 Vulkan Video 硬件编码 (Remote Play 浏览器零安装控制)"
        ]
      },
      {
        "heading": "3D 内容管线与 AI Native 工作流",
        "items": [
          "多格式结构化资产导入：glTF 2.0、LDraw 乐高 (.ldr/.mpd) 材质映射、OpenSCAD DSL 原生解析与 CSG 求值器、ScadRig 骨骼动画",
          "AI Native 闭环：无头渲染截图判决 (gnb shot)、脚本驱动断言验证与 CI 视觉回归/Parity 校验",
          "本地 AI 推理支持：集成 llama.cpp / Gemma 本地 OpenAI 兼容服务，支持 AI 3D 内容生成与游戏内决策"
        ]
      },
      {
        "heading": "工程工具链与玩法原型",
        "items": [
          "统一 CLI 工具链 gnb (支持 doctor / setup / build / run / shot / validate / benchmark 等一键工作流)",
          "内置逐 pass CPU/GPU Profiler (VulkanGpuTimer) 与 Superluminal API 深度集成",
          "多游戏玩法原型与 Demo：MagicaLego 乐高搭建、Brotato3D、BrickPlayer、NextDayZ、动态/静帧 Benchmark"
        ]
      }
    ],
    "link": {
      "href": "https://github.com/gameknife/gkNextEngine",
      "label": "https://github.com/gameknife/gkNextEngine"
    }
  },
  {
    "title": "Project X",
    "company": "Tencent Timi L2 Studio",
    "period": "2021.4 - 2023.4",
    "images": [],
    "groups": [
      {
        "heading": "项目CI管线开发与维护",
        "items": [
          "全平台高速并行出档",
          "多线分支出档的自动化脚本处理",
          "出档流程的性能信息与错误信息的及时上报机制",
          "日常开发线的CI,基于提交的代码编译与蓝图编译检查"
        ]
      },
      {
        "heading": "关卡箱庭blockout开发流程搭建",
        "items": [
          "基于GeometryScript的过程化建筑生成系统",
          "自定义关卡编辑器，方便统筹/跳转/切换各个子关卡",
          "基于UE基础设施的运行时优化策略"
        ]
      },
      {
        "heading": "局内外UI系统的架构和优化",
        "items": [
          "Puerts虚拟机引入",
          "局外系统的MVC结构引入",
          "基于Typescript内的GameServer通信层架设",
          "局内高性能HUD系统设计",
          "Shader Animation高效动效优化"
        ]
      },
      {
        "heading": "BR射击游戏操作与交互逻辑开发",
        "items": [
          "跨平台的统一输入映射",
          "跨平台的自动layout切换",
          "键位自定义与云端同步",
          "BR射击游戏基础交互逻辑实现"
        ]
      },
      {
        "heading": "基于DS的状态数据备份和分析平台",
        "items": [
          "基于cocos creator开发的数据回放器",
          "基于koa server render的数据分析平台",
          "基于protobuf定义的单局状态录像数据"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "Project M",
    "company": "Tencent Timi L2 Studio",
    "period": "2019.6 - 2021.4",
    "images": [],
    "groups": [
      {
        "heading": "美术相关技术支持工作",
        "items": [
          "CG实时渲染结合的开场动画方案",
          "展示角色的高精度IBL渲染支持",
          "超采样的展示角色渲染"
        ]
      },
      {
        "heading": "基于帧同步的动态寻路",
        "items": [
          "启发式A*算法",
          "高效的实时局部导航数据更新",
          "基于行为树的智能导航req分配"
        ]
      },
      {
        "heading": "UE4 CSM针对moba视点的特殊优化",
        "items": [
          "改进frustum的更新机制，使得moba镜头下的阴影更加高效和清晰"
        ]
      },
      {
        "heading": "UE4的低端机型针对性优化",
        "items": [
          "Fragment Shader性能优化",
          "运行时内存优化",
          "Scalability详细参数调配",
          "部分硬件不支持效果的fallback支持"
        ]
      },
      {
        "heading": "UE4海外发布全流程",
        "items": [
          "发行SDK接入UE调试与部署",
          "负责GooglePlay海外发行流程",
          "发行相关数据接口的抽象和快速接入"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "PUBG-Procedural",
    "company": "Personal",
    "period": "2019.4 - 2019.7",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/pubg-p-screenshot.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "个人独立游戏项目",
        "items": [
          "随机的海岛过程生成",
          "地貌及地标的生成",
          "道路自动生成逻辑",
          "环路生成及连接逻辑",
          "宜居点分布及动态关卡加载",
          "植被的竞争生长逻辑分布",
          "类PUBG的角色状态机",
          "类PUBG的枪械系统",
          "类PUBG的装备随机分布",
          "基于UE4 DS的多人PVP网络同步",
          "基于git flow工作流，host gitlab",
          "基于Gitlab runner的完整多平台(Windows/Linux/iOS)持续集成方案",
          "基于Google Sheets API的UE4 DataTable逻辑",
          "A private repo, need credential verification."
        ]
      }
    ],
    "link": {
      "href": "https://gitlab.com/gameknife/think-procedural",
      "label": "https://gitlab.com/gameknife/think-procedural"
    }
  },
  {
    "title": "A Confidential Project",
    "company": "Tencent Timi L1 Studio",
    "period": "2018.12 - 2019.4",
    "images": [],
    "groups": [
      {
        "heading": "实时地貌过程生成",
        "items": [
          "fractal/rigid multi/fbm等高速噪声生成器",
          "hydraul erosion/thermal erosion等地形sculpt算法",
          "无限地形生成的LOD策略",
          "湿度/温度/坡度/侵蚀/沉积等地质数据的生成与可视化",
          "基于地质数据的植被和装饰物分布",
          "基于Unreal Engine的无限地形多线程生成架构",
          "GPU加速优化的部分生成算法"
        ]
      },
      {
        "heading": "Unreal Engine研究与项目骨架构建",
        "items": [
          "Unreal Engine的持续集成方案研究与部署",
          "Unreal Engine的desktop forward pipeline在mac与ios上的使用",
          "Unreal Engine的版本仓库与资源管理方案建立和实施",
          "Unreal Engine的移动平台图形性能profile和优化",
          "Unreal Engine的编辑器模块开发与自定义数据交互"
        ]
      },
      {
        "heading": "基于Unreal Engine的部分图形效果实现",
        "items": [
          "昼夜变换",
          "天候变换",
          "基于Material Layer的地表渲染"
        ]
      },
      {
        "heading": "工具链研究",
        "items": [
          "Substance Designer材质包处理方案",
          "Quixel Megascans Library工具链",
          "Substance Source资源的二次处理工具链"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "SSKGame（圣斗士星矢-腾讯）",
    "company": "Tencent Timi L1 Studio",
    "period": "2017.5 - 2018.12",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/ssk.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "项目性能优化",
        "items": [
          "项目周期内的性能优化和内存优化，开发工具/底层修改和重构/监控扫描",
          "项目各处的图形性能优化与提升"
        ]
      },
      {
        "heading": "高级渲染特性开发",
        "items": [
          "展示角色的特殊渲染方式，基于独立相机的UI混排",
          "局部抗锯齿方案，在保证性能的前提下提升展示角色的实时渲染效果",
          "shell特效系统，为固定角色提供多种临时替代特效的解决方案（特殊效果/描边/假实时阴影/假实时反射等）",
          "基于gpu加速的伤害数字系统，完全消除动态效果下的mesh提交和重新生成，提供更丰富的动态效果"
        ]
      },
      {
        "heading": "AR功能集成",
        "items": [
          "Unity4下的iOS Arkit集成，华为hiAR集成",
          "AR抽卡和AR召唤功能设计"
        ]
      },
      {
        "heading": "美术资源工作流及工具集",
        "items": [
          "资源规格的处理和监控",
          "为美术提供各种资源处理和操作工具"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "Project G（一起来捉妖）",
    "company": "Tencent Timi J5 Studio",
    "period": "2016.7 - 2017.5",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/gwgo.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "项目性能设计与优化",
        "items": [
          "项目整体周期的性能profile和优化预警",
          "项目整体开发期的内存优化与预警",
          "开发多种运行时的辅助profile功能",
          "基于xcode instrument和adreno profiler的详细图形性能分析和优化"
        ]
      },
      {
        "heading": "角色、场景与特效渲染方案和性能控制",
        "items": [
          "基于matcap光照的角色渲染（表面质感模拟、质感区分、自阴影）",
          "自定义快速场景材质（光照贴图，高光质感区分，CUBEMAP快速光照）",
          "特效着色器（多种混合模式和运动模式，特殊材质）",
          "统一的材质编辑器扩展，支持marco开关，支持裁剪/混合的材质内设置"
        ]
      },
      {
        "heading": "基础设施构建",
        "items": [
          "PoolObj & PoolManager",
          "WWISE音频系统接入和抽象",
          "编译期pre/post task结构"
        ]
      },
      {
        "heading": "特色功能",
        "items": [
          "基于相机和陀螺仪的AR实现",
          "基于相机数据的光照环境模拟",
          "虚实景象的结合实现"
        ]
      },
      {
        "heading": "美术资源规格规划与监控",
        "items": [
          "角色，场景物件，特效的美术规格设计",
          "美术资源的每日自动扫描与报告生成",
          "构建封包中的资源容量占比分析"
        ]
      },
      {
        "heading": "美术资源工作流及工具集",
        "items": [
          "基于Unity5的图集压缩透明贴图优化",
          "运行时动态纹理生成及美术编辑器",
          "资源导入importer控制",
          "针对美术的多种离线级模型渲染器，用于快速出UI用图"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "WeShoot（魂斗罗：归来）",
    "company": "Tencent Timi J1 Studio",
    "period": "2016.3 - 2016.7",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/contra.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "UNITY3D性能优化",
        "items": [
          "GC Alloc控制",
          "Non-Uniform-Scale网格内存优化",
          "GPU消耗优化"
        ]
      },
      {
        "heading": "Unity3D资源工作流",
        "items": [
          "每日资源扫描与报告系统",
          "编辑器内的资源profile工具集"
        ]
      },
      {
        "heading": "图形开发工作",
        "items": [
          "自制gpu skin方案，支持GLES2",
          "Mat-cap角色材质（高性价比的移动平台实现）"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "Cube（乐高沙盒）",
    "company": "Tencent IEG R&D",
    "period": "2015.7 - 2016.3",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/cube.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "UNITY3D Native渲染研究",
        "items": [
          "在c++库中的vbo更新与Drawcall",
          "原生fbo的抓取（快速实现景深，SSAO等后处理效果）",
          "更加高效的shadowmap"
        ]
      },
      {
        "heading": "技术美术工作",
        "items": [
          "主导设计和实现昼夜天候效果",
          "全部着色器开发",
          "美术工作流的建立和图形性能预算制定"
        ]
      },
      {
        "heading": "体素渲染",
        "items": [
          "基于元胞自动机的实时光能传递",
          "体素世界的batching方案设计与实现"
        ]
      },
      {
        "heading": "Gameplay",
        "items": [
          "基于Chunk的Entity系统设计",
          "游戏基础设施构建",
          "各种实际模块开发",
          "带领6人团队在两周内开发一个快速fpp版本"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "SoftRenderer",
    "company": "Personal",
    "period": "2013.10 - Current",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/softrenderer.png",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "个人开源软件渲染器项目",
        "items": [
          "使用cpu实现gpu的图形管线",
          "自行实现数学库，利用simd加速",
          "自行实现线程和job抽象，利用多线程加速",
          "基于可编程着色器管线逻辑，并支持多种复杂着色流程，sponza场景fps达到可交互的30+fps@i7 4core 7700K",
          "基于electron&nodejs&node-gyp技术栈，使得渲染器模块更加纯粹跨平台，通过现代web技术以及npm上的大量package快速构建交互界面"
        ]
      }
    ],
    "link": {
      "href": "https://github.com/gameknife/SoftRenderer",
      "label": "https://github.com/gameknife/SoftRenderer"
    }
  },
  {
    "title": "gkENGINE",
    "company": "Personal",
    "period": "2010.10 - 2017.1",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/indoor3.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "个人开源引擎项目",
        "items": [
          "跨平台，支持windows/mac/ios/android，对图形底层接口，线程，io等系统进行跨平台抽象",
          "支持多线程渲染",
          "支持deferred shading/lighting多种现代图形渲染管线，支持多种现代渲染特性"
        ]
      }
    ],
    "link": {
      "href": "https://github.com/gameknife/gkEngine",
      "label": "https://github.com/gameknife/gkEngine"
    }
  },
  {
    "title": "electron-shadermonki",
    "company": "Personal",
    "period": "2016.10 - Current",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/shadermonki.png",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "个人开源webgl着色器编辑工具",
        "items": [
          "webgl实现deferred shading图形管线",
          "glsl shader的实时编译，实时预览",
          "实现整套webgl的封装glwrap",
          "基于electron&nodejs技术栈，通过现代web技术以及npm上的大量package快速构建交互界面"
        ]
      }
    ],
    "link": {
      "href": "https://github.com/gameknife/electron-shadermonki",
      "label": "https://github.com/gameknife/electron-shadermonki"
    }
  },
  {
    "title": "OpenVRP",
    "company": "Vistandard",
    "period": "2013.4 - 2015.7",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/openvrp.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "基础库",
        "items": [
          "跨平台的线程, IO, JOB库开发",
          "抽象Device，基于dx11结构，同时开发其在opengles2和opengl上的实现"
        ]
      },
      {
        "heading": "架构",
        "items": [
          "主导渲染器，场景管理，动画系统的设计与开发",
          "跨平台解决方案（跨平台的操作系统封装，数据共通）"
        ]
      },
      {
        "heading": "编辑器",
        "items": [
          "主导开发OpenVRP编辑器，基于xtp ui框架"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "X52（QQ炫舞2）",
    "company": "Horizon3D",
    "period": "2012.9 - 2013.4",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/x52.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "毛发模拟预研",
        "items": [
          "巨量发丝（8w根同屏）的运动模拟（弹性，碰撞，飘曳）和渲染模拟（各向异性光照），基于dx9，全gpu实现"
        ]
      },
      {
        "heading": "兼容性开发",
        "items": [
          "为x52和x51项目解决疑难图形bug，引入d3d9ex来解决某些设备丢失问题和显存问题"
        ]
      },
      {
        "heading": "性能优化",
        "items": [
          "为x52开发外挂profiler，可以对每一个版本进行运行时的性能profile，随时进行自动性能跟踪和报告生成。"
        ]
      }
    ],
    "link": null
  },
  {
    "title": "GodSlayer（蛮荒搜神记）",
    "company": "Changyou",
    "period": "2011.2 - 2012.9",
    "images": [
      {
        "src": "https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/images/godslayer.jpg",
        "alt": "placeholder"
      }
    ],
    "groups": [
      {
        "heading": "图形开发",
        "items": [
          "皮肤模拟 / 变色区域 / 壳材质"
        ]
      },
      {
        "heading": "战斗",
        "items": [
          "实时的帧率无关的攻击区域判定",
          "大型生物的部位破坏实现"
        ]
      },
      {
        "heading": "技术美术工作",
        "items": [
          "3DS Max 插件开发, 完善CryEngine工具链，为美术提供技术美术培训"
        ]
      },
      {
        "heading": "优化",
        "items": [
          "通过内置／外置的profiler，对CryEngine项目进行性能优化"
        ]
      },
      {
        "heading": "动画",
        "items": [
          "对CryEngine的双足IK系统进行调优，同时基于双足IK系统扩展出四足IK系统"
        ]
      },
      {
        "heading": "Gamplay",
        "items": [
          "维护与开发技能编辑器"
        ]
      }
    ],
    "link": null
  }
];
