---
title: "ImGui 官方 backend 很稳，我还是把它换掉了"
date: 2026-08-01
category: tech
description: "编辑器里最后一个按传统纹理绑定工作的子系统是 ImGui。官方 backend 没写错，只是它的资源模型和引擎已有的全局纹理身份对不上，于是我接管了它的 Vulkan renderer。"
tags: ["gkNextEngine", "vulkan", "imgui", "bindless"]
draft: true
---
先把背景压成一段。

gkNextEngine 把 buffer 收到一个 128 字节的 `GPUScene` 根结构里，纹理放进少数全局 bindless 数组。“全 Bindless”不是字面上没有 `vkCmdBindDescriptorSets`，而是不再给每个材质、每个 pass 维护一套 descriptor 接线。

做完这套以后，编辑器里还有一个每帧都在用、又按传统纹理绑定方式工作的子系统：ImGui。

编辑器、控制台、profiler 和调试面板都压在它上面。它不是一块可以假装没看见的边角料。

## 一、官方 backend 没错，只是资源模型不同

ImGui 官方 Vulkan backend 很稳，也覆盖了大量平台细节。正常项目直接用它，是更省心的选择。

它的常规纹理路径会把 `ImTextureID` 对应到 descriptor 资源，并在处理 draw command 时绑定相应 set。这个模型很适合 ImGui：UI 层只交出一个纹理 ID，backend 自己把剩下的 Vulkan 细节包起来。

我的问题不是它写得不好，而是编辑器已经有另一套全局纹理身份。

场景缩略图、RenderView 输出、profiler 热力图，本来都在 `GlobalTexturePool` 里。如果继续使用官方路径，同一张纹理还要再包装成 ImGui 的 descriptor 身份。UI 和 3D 各维护一套注册与生命周期，新增预览功能时总有一段重复胶水。

所以我最后没有把两套模型长期并排放着，而是保留 ImGui 的 draw data 和平台接口，自己接管 Vulkan renderer 部分。

## 二、ImTextureID 直接携带全局索引

自定义 renderer 在运行时注册成 `gk_imgui_renderer`。第一步是重新定义 `ImTextureID` 的含义。

当前实现把低 32 位放 `textureIndex + 1`，高 32 位放纹理标志：

```cpp
ImTextureID UserInterface::EncodeBindlessTextureId(
    uint32_t textureIndex,
    uint32_t textureFlags)
{
    const uint64_t encoded =
        (static_cast<uint64_t>(textureFlags) << 32u) |
        static_cast<uint64_t>(textureIndex + 1u);
    return (ImTextureID)(static_cast<intptr_t>(encoded));
}
```

`+1` 是因为 0 保留为无纹理 sentinel。高位标志目前可以区分普通采样和 raw output 一类用途。这样一个 `ImTextureID` 就足够让 shader 找到全局纹理和采样方式，不需要为每张 UI 图片再分配 descriptor set。

UI 代码通过统一接口拿 ID：

```cpp
ImTextureID RequestImTextureId(uint32_t globalTextureId);
ImTextureID RequestImTextureByName(const std::string& name);
```

字体、图标、资产预览和渲染输出因此共享同一个纹理池。身份统一，是这次重写最有价值的部分。

## 三、真正的关键是把 draw command 摊平

只改 `ImTextureID` 还不够。官方 draw data 仍然按 command 保存索引范围、clip rect、纹理和 callback；如果照着 command 一条条设置 scissor、切纹理，绑定模型只是换了名字。

当前 backend 会把 ImGui 的 indexed draw list 展开到一份 `UiBatchedVertex` buffer。每个顶点除了 position、uv 和 color，还烘入：

```cpp
float clipRect[4];
uint32_t textureIndex;
uint32_t textureFlags;
```

也就是说，原来属于 draw command 的裁剪和纹理身份，变成了每个顶点都携带的数据。shader 从全局纹理数组按索引取样，并按 clip rect 丢弃范围外像素。

没有 callback 的连续 command 会合成一个 draw segment，最后用 `vkCmdDraw` 提交。遇到 ImGui user callback 时才切断 segment；`ImDrawCallback_ResetRenderState` 会重新绑定 UI 状态。

这里仍然会显式绑定一次全局 bindless descriptor set，也会绑定 UI pipeline 和 vertex buffer。省掉的是“每换一张 UI 纹理就换 descriptor set”，不是整段 UI 渲染没有状态。

这套做法也有清楚的成本：indexed geometry 被摊平成非索引顶点，clip rect 和纹理信息在顶点里重复，CPU 每帧还要映射并填充 batch buffer。没有同场景 A/B benchmark，我不会把它写成性能优化。它首先是资源模型和开发接口的统一。

## 四、多视口不能只共用一个纹理池

ImGui multi-viewport 会为拖出主窗口的 viewport 建独立 surface、swapchain、framebuffer、command buffer、同步对象和 present 流程。

纹理身份可以继续共用主引擎的全局池，但窗口生命周期不能假装不存在。当前这部分已经拆到：

```text
src/Application/Editor/Common/MultiViewportBackend.cpp
```

它负责 platform viewport 的 Vulkan 资源，真正画 UI 时仍然回到同一套 `UserInterface::RenderDrawData`。这样主窗口和额外窗口使用同一种 `ImTextureID` 语义，但各自承担 swapchain 与同步责任。

字体图集也遵循同样原则：先进入全局纹理池，再把编码后的 ID 交给 `io.Fonts->TexID`。第一帧能不能画出来，取决于纹理上传和 renderer 初始化顺序，而不是再偷偷走一条官方 descriptor 路径。

## 五、长期成本是跟着 ImGui 的内部接口走

自己接管 renderer backend，就等于放弃官方实现替你吸收升级变化。ImGui 的 application API、font API、draw data 结构和 multi-viewport 接口一旦调整，我都要检查自己的接缝。

这不是稳定 ABI 的问题，更准确地说，是第三方 backend 接口与内部约定的维护成本。

仓库里有一笔 `d963a23`，标题是 `imgui 1.92 API compatibility`。重新看 diff，它只修了应用层和字体相关 API，并没有改自定义 renderer，所以不能拿它当“backend 升级果然翻车”的证据。它只能提醒我：版本变化确实会到达项目，未来 backend 是否需要跟改，要逐次核对。

目前的策略很普通：依赖版本由 vcpkg 固定，升级时构建受影响 target，再跑编辑器和多视口验证。自定义 backend 没有免维护的魔法。

## 六、为什么我仍然觉得值

最大的收益不是少了多少微秒，而是纹理只有一种身份。

一个 RenderView 输出本来就在 bindless 数组里。UI 要显示它，只需要拿索引编码：

```cpp
ImGui::Image(EncodeBindlessTextureId(rtIndex), size);
```

场景缩略图、相机预览、profiler 热力图都是同一种用法。新增面板时，不必再创建和销毁一份 ImGui 专用 descriptor。

这正好符合我做 hobby engine 的取舍：可以为架构一致性付一次工程成本，因为维护这套代码的人仍然是我。商业项目如果更看重升级成本和现成支持，继续使用官方 backend 完全合理。

所以这篇不是“官方 backend 过时了”。它只是一个很具体的例子：当第三方库的资源模型和引擎主路径不同，我选择在哪一边做翻译，以及这笔账最后包含什么。

下一篇继续看同一套资源模型怎样落到 GPU-Driven：约 1900 个动态球，主几何加四级阴影一共五次 draw 提交。

---

源码 / 链接

- gkNextEngine：https://github.com/gameknife/gkNextEngine
- 自定义 renderer：`src/Engine/Runtime/Editor/UserInterface.cpp`
- 多视口 Vulkan 接入：`src/Application/Editor/Common/MultiViewportBackend.cpp`
- 上一篇：[全 Bindless 之后，我不再给每个 pass 接 descriptor]（发布后回填链接）
