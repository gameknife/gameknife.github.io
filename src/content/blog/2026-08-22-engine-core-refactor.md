---
title: "我让 AI 把引擎核心砍掉了两万行"
date: 2026-08-22
category: tech
description: "九条 commit，Engine core 从 55,279 行降到 36,161 行。这是一次分阶段、每步都能对上 commit 的重构实录，包括哪些只是纯移动、哪些是真的删掉了东西。"
tags: ["gkNextEngine", "ai-agent", "重构"]
draft: true
---
先看一段 git log，这是今年 6 月我仓库里真实的九条 commit：

```
EngineCoreRefactor Phase 0: baseline + src/Modules CMake skeleton
EngineCoreRefactor Phase 1: pure moves + KayKit removal (Engine 55,279 -> 51,465)
EngineCoreRefactor Phase 2: loader registry + FLDraw/FScad modules (Engine 51,465 -> 43,804)
EngineCoreRefactor Phase 3.0: remove voice input + whisper.cpp dependency
EngineCoreRefactor Phase 3: NextAI + NextRemote modules (Engine 43,804 -> 37,944)
EngineCoreRefactor Phase 4.1: RmlUiSystem -> Modules/NextRmlUi (IUiOverlay injection)
EngineCoreRefactor Phase 4 (partial): NextRmlUi follow-up + Gizmo/Notification -> DevTools (Engine 37,944 -> 36,161)
EngineCoreRefactor Phase 4: editor UI split complete (Engine 36,161 -> 34,139)
EngineCoreRefactor Phase 5: god class splits (Engine 34,139 -> 33,924)
```

每条 commit 标题里都带着行数：55,279 → 51,465 → 43,804 → 37,944 → 34,139 → 33,924。

55,279 到 33,924，核心层少了 21,355 行。先把标题的口径说清楚：其中大部分被搬进 `src/Modules`，还有一部分随 KayKit、语音输入和 dead code 一起删除；不是整个仓库凭空少了两万行。

这些 commit 里的机械改动，大部分由 AI agent 按一份文档执行。这一篇讲这件事的完整过程，包括它翻车的地方。

---

## 一、起因：核心层胖了

gkNextEngine 有三条自定原则，第三条是"保持代码库小体积，易读性优先"。

到今年 6 月，这条原则已经名存实亡。两年时间东西越塞越多，`src/Engine` 涨到 5.5 万行（非空行口径）：AI 服务、语音输入、WebRTC 远程串流、OpenSCAD 解析器、LDraw 解析器、编辑器主题库、Gizmo、RmlUi 胶水，全都挤在核心层里。

对人来说这是审美问题。对 agent 来说这是实际成本：核心层越大，每个任务需要理解的范围越大，改错的概率越高。上一篇说的"核心认知面要小"，就是从这里疼出来的。

所以决定做一次大手术。但这次我不想自己动手——机械搬迁类的工作，正是 agent 最擅长的。问题变成：怎么让它搬得对。

---

## 二、一份目标读者是 AI 的重构文档

我和 AI 一起写了 `docs/plans/engine-core-refactor.md`。它开头第一行就写明了这份文档给谁看：

> 状态：待执行 | 编写日期：2026-06-10 | 面向：执行重构的 AI agents

这份文档和传统的架构文档长得不一样。它更像一份 runbook，有几个特征值得说。

第一，现状基线是量出来的，不是估的。文档里有一张 22 行的模块体量表和一张单文件 Top 15 的 god class 候选表，精确到行：VulkanBaseRenderer.cpp 2,473 行、QuickJSEngine.cpp 2,409 行、UserInterface.cpp 2,354 行……统计口径也写死了：

> 执行任何 Phase 前后，必须用 `./gnb loc` 重新量测并记录，验收以 `gnb loc` 的非注释非空行口径为准。

数字必须可复现，agent 才没有耍赖的空间，我验收时也不用抬杠。

第二，判断标准写成一句可执行的话：

> 渲染器 / ECS / 资产管线 / 脚本运行时是核心；只服务于个别 Application、或属于可选工具链的，不是核心。

有了这句话，agent 面对每个文件就有了判据，不用来问我"这个算不算核心"。

第三，例外必须显式写出来。比如 `FProcModel` 这个文件在 Loaders 目录下，按目录判断应该外移，但它是通用程序化网格工厂，被七八个游戏和两个 loader 共用——文档里直接写明"属于核心，保留不动"。反过来，KayKit loader 和整个语音输入子系统（连带 whisper.cpp 依赖），文档里写的是"按用户决定直接删除"。

保留什么、删除什么，这类判断全部是人做的，写死在文档里。Agent 执行的是判断的结果，不是判断本身。

第四，文档里记录了三处依赖方向违规，比如 `Assets/GPU/Texture.cpp` 里 include 了 `Runtime/Engine.hpp`——下层反向依赖上层。这种问题人读代码很难扫全，让 agent 先做静态盘点、我确认后写进文档，本身就是协作的一部分。

---

## 三、五个 Phase，每步可验收

执行按 Phase 推进，每个 Phase 一条边界清晰的规则：

| Phase | 内容 | Engine 行数 |
|---|---|---:|
| 0 | 基线量测 + src/Modules 的 CMake 骨架 | 55,279（起点） |
| 1 | 纯文件搬迁 + KayKit 删除。只移动，不改行为 | → 51,465 |
| 2 | loader 反转为注册制，FLDraw / FScad 拆成模块 | → 43,804 |
| 3 | 删语音输入；AI 服务、远程串流拆成 NextAI / NextRemote | → 37,944 |
| 4 | 编辑器 UI 外移：RmlUi、Gizmo、主题库、通知中心 → DevTools / NextRmlUi | → 34,139 |
| 5 | god class 分解收尾 | → 33,924 |

"只移动，不改行为"这类约束特别重要。人类重构最容易犯的错误是搬家时顺手改逻辑，agent 也一样。把"搬迁"和"改行为"拆到不同 Phase，每一步的 diff 都变得可审——纯搬迁的 commit，review 只需要确认没有内容变化。

每个 Phase 完成的验收也是文档里写死的：构建指定 target、跑单测、渲染场景截图。行数变化写进 commit message，全程可审计。

从 git 时间看，这一轮推进得很密。6 月 10 日 16:32 是 Phase 0；16:51 Phase 1 落地，同一分钟还有一笔独立的 ImGui 1.92 兼容修复；17:07 和 17:12 是 Phase 2、Phase 3.0。晚饭之后，20:12 到 21:21 又依次完成 Phase 3、4.1、4 partial、4 和 5。

这些是 commit 时间，不是工时统计，也不能证明每一分钟都在连续编码。它能证明的是：边界切清楚以后，一轮跨目录重构可以按可审查的小阶段快速交付，而不是攒成一个谁也不敢看的巨大 diff。

---

## 四、翻车实录

说得太顺了，来点真实的。

第一次翻车有 commit 为证：

```
fix: wire up AgentDriver module lost in engine refactoring I
```

一轮大搬迁之后，AgentDriver 模块的装配被搬丢了——文件都在，CMake 里的链接关系没接上。编译通过，单测通过，直到某天用到 agent 验证功能才发现它整个是死的。

这暴露了验收的一个盲区：编译和单测覆盖不到"模块装配是否完整"。后来的应对是把 `gnb validate` 这类端到端脚本也纳入大重构的验收清单，光编译通过不算完。

第二类翻车没有单条 commit，但 git log 里留了痕迹：

```
hand refactoring
hand refactor II
hand refactor III
```

这三条 commit 是我手写的。有些收口工作 agent 反复做不对——涉及跨模块的接缝设计，比如某个功能到底该从哪个方向注入，它给的方案编译能过，但边界不如我意。追加十轮 prompt 不如自己改三十行，改完把结论写回文档，下一轮它就照着做了。

commit 名起得很诚实，懒得包装。

---

## 五、第一轮之后，这件事没有停

Phase 5 收尾时核心层是 33,924 行。但重构不是一锤子买卖，后面几轮都在继续，规模小一些，模式一样：

第二轮专攻 god class 和头文件：VulkanBaseRenderer 按 GpuDriven / GiBake / RayTracingAS 切成分部文件，CPUAccelerationStructure 按类拆开，塞在头文件里的实现下沉到 cpp，最后清 dead code。

再往后是一轮边界外移：Streamline/DLSS 集成拆成 NextStreamline 模块，编辑器的具体 edit command 下沉到 DevTools，Vulkan Video 能力探测挪进 NextRemote，GaussianSplat 渲染 pass 挪进 SplatLoader，场景导出拆成 SceneExport，glTF loader 和音频也各自成了模块。

2026 年 7 月 11 日，`src/Engine` 一度降到 29,580 行。到 7 月 15 日，随着新功能继续进入，它又变成 31,084 行、224 个文件，旁边是 16 个按 target 装配的可选模块。

这组变化反而更接近真实维护："3 万行"不是一次达成以后永久有效的勋章，而是一条需要持续治理的目标线。模块数量也会合并或调整，不能拿某天的快照当项目常量。

规则从头到尾只有一条：核心层不得反向依赖模块。这条是物理边界，CMake 的链接方向摆在那，agent 想违反都编不过。

---

## 六、这件事为什么值得写一篇

最有意思的地方，不是 AI 会移动文件。

而是生产力提升以后，架构治理反而要更频繁。Agent 太能写了，如果没有持续清理，代码膨胀的速度也会顶上一个团队。让 AI 写更多代码并不难，让它长期把代码留在正确的地方，才是大工程的门槛。

我的角色在这件事里也很清楚：写判断（什么是核心、什么该删）、定规则（依赖方向、Phase 边界、验收标准）、做 review、翻车时收口。大量搬迁和调用点修复交给 agent，我把时间花在边界和验收上。

同样的方法放进 UE 或 Unity 这种规模的代码库，成本和风险会完全不同。不是说大型团队不能用 agent 做重构，而是任务闭包、权限边界、平台验证和 review 量都会放大，个人不可能用这套节奏直接照搬。

小代码库的优势不是“只有小项目能 AI Native”，而是一个人仍有机会理解完整边界，并且为每个 Phase 给出可执行的验收。这是我能做这次实验的前提，不是对商业引擎能力的判决。

小代码库 + 清晰边界 + 可复现的验收，这三样东西在 AI 时代的复利，比我预想的大得多。

---

## 写到这里

那份 runbook 现在还在仓库里，`docs/plans/engine-core-refactor.md`，连同后面几轮的计划文档。想看 AI 到底照着什么样的文档干活的，可以直接翻。

下一篇讲第三件事：让 LLM 写可执行的 3D 语言，而不是直接吐模型。从乐高指令到对话式 OpenSCAD 建模，再到用 SCAD 描述角色骨骼和动画。

---

**源码 / 链接**

- gkNextEngine：https://github.com/gameknife/gkNextEngine
- 重构 runbook：`docs/plans/engine-core-refactor.md`（含 round2-round5 后续计划）
- 上一篇：[一个人，一堆 AI Agent，写一款大型游戏引擎]（发布后回填链接）
