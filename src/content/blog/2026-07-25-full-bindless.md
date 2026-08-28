---
title: "全 Bindless 之后，我不再给每个 pass 接 descriptor"
date: 2026-07-25
category: tech
description: "不是字面意义上的绑定调用归零，而是把 buffer 全部改成按地址访问、纹理全部进全局数组。真正消失的不是某一条 API，是散落在整个渲染器里的接线关系。"
tags: ["gkNextEngine", "vulkan", "bindless", "渲染架构"]
draft: true
---
上一篇我提了一句：

> 前段时间我在调一个管线问题，需要调整几张中间纹理在不同 pass 之间的用法。我改了几行 shader。完。

有人问怎么做到的。这一篇展开讲。

先把标题里的“全 Bindless”说清楚。它不是字面意义上的 Vulkan 绑定调用归零：引擎仍会绑定一份全局纹理 descriptor set，Android 的 TLAS 还有一个传统 binding。这里说的是资源访问方式——不再为每个材质、每个 pass 单独维护 descriptor layout、set 和 slot 接线，buffer 全部从一个根结构按地址访问，纹理全部进入少数全局数组。

这个星号不影响它带来的变化。真正消失的，本来就不是某一条 API，而是散落在整个渲染器里的绑定关系。

## 一、我想拿掉的是资源接线

Vulkan 常见的资源路径并没有问题：声明 `DescriptorSetLayout`，从 pool 分配 set，写入 buffer 或 image，录制命令时绑定。对于结构稳定、规模不大的 renderer，这套方式清楚又可靠。

问题出在它长大以后。

在我原来的固定 slot 设计里，每加一个 pass，往往都要同时改 shader 声明、C++ layout、descriptor 更新和对象生命周期。Material 系统要知道纹理在哪个 slot，RenderPass 要持有 layout 或 set，资源重建还得保证旧 descriptor 没有指向已经释放的对象。

单看每一处都不复杂，复杂的是这些知识分散在很多地方。改一张中间纹理的用途，常常不是改算法，而是在追一串接线。

我后来换了一种心智模型：shader 只拿一个根结构，根结构告诉它数据在哪里。buffer 用地址，纹理用全局数组索引。pass 不再拥有一套自己的资源绑定表。

这不是 Vulkan 的唯一正确用法，只是很适合 gkNextEngine 这种愿意舍弃旧硬件、把一条现代路径做到底的小引擎。

## 二、三块拼图

这套结构靠三项 Vulkan 能力协同：Buffer Device Address、Descriptor Indexing 和 Push Constant。单拿一个出来都只是功能，组合起来才像一套资源模型。

### 2.1 Buffer Device Address：buffer 终于像指针

Buffer Device Address 在 Vulkan 1.2 进入 core。拿到 storage buffer 的 GPU 地址以后，Slang 里可以按指针访问：

```slang
public property NodeProxy* Nodes
{
    get { return (NodeProxy*)(SceneDynamicBase + GPU_SCENE_DYNAMIC_NODES_OFFSET); }
}

NodeProxy node = scene.Nodes[instanceId];
```

这件事对数据组织很解放。节点、材质、顶点、索引、蒙皮数据不再各自占一个 binding；CPU 侧决定内存布局，shader 侧沿地址和 offset 读取。

当然，GPU 地址也把一部分安全网拿掉了。地址错了，validation layer 通常没法像 descriptor 类型不匹配那样直接告诉你，结果更可能是黑屏或 driver crash。这个代价后面再说。

### 2.2 Descriptor Indexing：纹理只保留全局数组

纹理不能简单当 buffer 指针采样，仍然需要 descriptor。我的处理是把它们收进三份全局数组：

```slang
[[vk::binding(0, 0)]] __DynamicResource SampleTextureArray[];
[[vk::binding(1, 0)]] __DynamicResource StorageTextureArray[];
[[vk::binding(2, 0)]] __DynamicResource ShadowMapArray[];
```

数组大小仍受设备上限和引擎容量约束，并不是真的无限。区别在于，材质和 pass 不再声明自己的固定纹理 slot，只保存全局索引：

```slang
public Sampler2D GetSampleTexture(int index)
{
    return SampleTextureArray[NonUniformResourceIndex(index)].as<Sampler2D>();
}
```

`NonUniformResourceIndex` 也不能省。它告诉编译器，同一个 subgroup 里的 invocation 可能访问不同纹理；漏掉以后，相当于做了更强的 uniformity 承诺。

这块我也踩过真实的规范坑：带 `VK_DESCRIPTOR_BINDING_VARIABLE_DESCRIPTOR_COUNT_BIT` 的 binding 必须放在 layout 最后。旧代码把只有 16 项的 shadow map binding 放在最后，却按 65534 项去分配，在一台 AMD iGPU 上启动即崩。最后把小数组移到前面、把最大的可变数组放到最后才修好。

Bindless 不等于没有规则，只是规则从“每个对象接哪个 slot”变成了“全局表怎样保持稳定”。

### 2.3 Push Constant：把根结构交给 shader

第三块是 Push Constant。它适合在 draw 或 dispatch 时传一小段根参数，不需要再建 buffer descriptor。

Vulkan 保证的最小 `maxPushConstantsSize` 是 128 字节，所以我直接把 128 字节当成预算，而不是默认桌面显卡会给更多。gkNextEngine 的 `GPUScene` 刚好占满这 128 字节：4 个 `uint32` 参数，加 14 个 64 位地址。

```cpp
struct GPUScene
{
    uint32_t SwapChainIndex;
    uint32_t CustomData0;
    uint32_t CustomData1;
    uint32_t CustomData2;

    uint64_t Camera;
    uint64_t SceneDynamicBase;
    uint64_t Reorders;
    uint64_t Vertices;
    uint64_t Indices;
    uint64_t Offsets;
    // ……其余 8 个地址
};
```

这 128 字节不是场景数据本身，更像一张目录。shader 拿到目录，再去找节点、材质、间接绘制参数、光照结构和蒙皮数据。

## 三、128 字节是怎么塞下来的

14 个地址加 4 个 `uint32`，数学上正好是 128 字节。真正麻烦的是让 C++、Slang 和不同后端对这份布局有同样理解。

桌面非 Apple 的 shader 版本把地址写成 7 对 `uint64_t2`：

```slang
uint64_t2 Camera_SceneDynamicBase_Address;
uint64_t2 Reorders_Vertices_Address;
uint64_t2 Indices_Offsets_Address;
uint64_t2 Reserved_AmbientBase_Address;
uint64_t2 TLAS_SkinWeights_Address;
uint64_t2 SkinJoints_SkinnedVertices_Address;
uint64_t2 JointMatrices_Reserved_Address;
```

属性 getter 再把 `.x` 和 `.y` 还原成有名字的指针。`SceneDynamicBase` 还指向一块有固定 offset 的大 buffer，节点、材质、GPU-driven 统计和球谐数据都从这里切出来，进一步减少根地址数量。

Apple / MoltenVK 分支没有用 `uint64_t2` 打包语法，而是直接写 typed pointer 和 `uint64_t` 字段。这是 shader 表达与对齐方式的差异，不是 Apple 版本变成了更大的根结构：CPU 侧传过去的逻辑预算仍然是 14 个地址加 4 个参数，128 字节。

Android 还有一个更实在的例外。TLAS 没走地址构造，而是保留传统 binding：

```slang
#ifdef PLATFORM_ANDROID
[[vk::binding(0, 1)]] RaytracingAccelerationStructure BindedTLAS;
#endif
```

所以我不会再把它写成“整个引擎一个 binding 都没有”。更准确的说法是：buffer 的 per-pass binding 被根地址替代，纹理收敛为全局数组，移动端保留必要 fallback。

## 四、心智模型变了什么

以前画架构图，每个 pass 都连着自己的输入 buffer、纹理和 descriptor。现在大多数 pass 从同一份 `GPUScene` 出发，按约定读取地址或纹理索引。

这里容易说过头。箭头没有真的消失：资源生命周期、读写依赖、layout transition 和 barrier 仍然存在，谁先写、谁后读仍然必须讲清楚。消失的是 descriptor 所有权和固定 slot 接线，不是数据依赖本身。

对我来说，变化主要有三点。

第一，改数据流时 C++ 连锁修改少了。一个已有全局纹理从 A pass 改到 B pass 使用，通常只改索引和 shader 逻辑，不再给 B 单独造 layout 和 set。

第二，pass 更接近无状态函数。这个“无状态”只针对 descriptor 管理：pass 仍然有 pipeline、目标资源和同步职责，但不再持有一套材料级绑定关系。

第三，调试对象变了。RenderDoc 里的 descriptor set 往往是同一份全局表，真正值得看的是 Push Constant 里的根地址、地址指向的 buffer 内容，以及全局纹理索引是否有效。它更像调试一段指针程序。

这也解释了开头那次改动为什么很小。我改的是算法关系，没有同时去修四处 descriptor 接线。

## 五、代价也很具体

这不是银弹。

硬件门槛更高。完整路线依赖 Buffer Device Address、Descriptor Indexing 和足够的 Push Constant 空间。我愿意把旧设备排除在主路径之外，通用商业引擎未必能做同样选择。

错误更危险。传统 descriptor 写错类型，validation layer 往往能直接报错；地址算错以后，GPU 看到的只是一个数字。为了控制风险，我让 C++ 和 shader 尽量共享结构定义，并用 `static_assert` 固定 `GPUScene` 为 128 字节，但运行时地址失效仍然需要靠更细的诊断处理。

第三方接入更贵。大多数 GPU 库默认自己管理 descriptor。要么允许两套模型共存，要么重写它的渲染前端。ImGui 就成了后者，这件事下一篇讲。

最后，全局表也有自己的生命周期。纹理索引不能随便复用，资源销毁不能留下悬挂引用，多 RenderView 还要为屏幕空间资源划分稳定的 slot bank。只是这些问题被集中到一处，比散在每个 pass 里更适合我维护。

## 写到这里

“你的 shader 能看到多少 binding”可以作为观察引擎资源模型的一条线索，但不是现代程度的评分表。项目规模、目标平台和第三方生态不同，合适的答案也不同。

我选择这条路，是因为 gkNextEngine 的约束很特殊：代码库小、路径少、愿意放弃兼容包袱，而且很多渲染实验都需要快速换数据流。对这个项目，全 Bindless 省下来的主要不是几条 Vulkan 命令，而是长期维护时的接线成本。

做完以后，还剩一个每帧都在用、又完全按传统 descriptor 思路工作的子系统：ImGui。官方 backend 很稳，我最后还是把它换掉了。

---

源码 / 链接

- gkNextEngine：https://github.com/gameknife/gkNextEngine
- GPUScene 三平台定义：`assets/shaders/common/BasicTypes.slang`
- 全局纹理数组：`assets/shaders/common/BindlessTexture.slang`
- 上一篇：[15 年，推倒重写 gkEngine]（发布后回填链接）
