---
layout: post
title: 现代渲染能有多现代？
category: tech
---

![](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/assets/ZRHAP_51UZF0rgpoRO_wH7204uMLiKGvJmpp8Qbz0Kw=.webp "gkNextEngine PathTracing渲染器")

去年5月，我开始了现代渲染学习之路。目前，作为一个一年半的现代渲染练习生，准备来讲讲这个议题：

> 现代渲染能有多现代？

作为一名古董级渲染工程师，我曾长期深耕于OpenGL ES领域。此次对现代渲染技术的学习，彻底刷新了我的认知。同时，这些现代渲染方案已在Vulkan平台上通过真机测试，并能高效应用于现代移动设备。

Vulkan作为一项诞生于现代的最新API，其设计理念极致贴近硬件，同时也是目前唯一能实现全平台跨越的渲染API。Mac平台目前采用MoltenVK，未来将由一个更底层的kosmetkripse替代，以提供更接近原生的Vulkan支持。

为避免枯燥的平铺直叙，我将通过自问自答的形式，阐述我对现代渲染的当前理解。



## 1. 一个现代的shader是什么样的?

下面是shader codebase的bindless module的一段代码

```cpp
namespace Bindless
{
    public Sampler2D GetSampleTexture(int index )
    {
        return SampleTextureArray[NonUniformResourceIndex(index)].as<Sampler2D>();
    }

    public RWTexture2D<T> GetStorageTexture<T : ITexelElement>(int index )
    {
        return StorageTextureArray[NonUniformResourceIndex(index)].as<RWTexture2D<T>>();
    }

    public uint2 GetStorageTextureDimensions(int index)
    {
        uint2 dim;
        StorageTextureArray[NonUniformResourceIndex(index)].as<RWTexture2D<float4>>().GetDimensions(dim.x, dim.y);
        return dim;
    }
}
```

一年前的我，绝对不会相信，这是一段shader代码。而现在，每天写的就是这一类代码，非常现代



下面是硬件PT和软件ST渲染器的核心代码

```cpp
import Common;
import Bindless;
#include "common/ShaderClock.slang"

[shader("compute")]
[numthreads(8, 8, 1)]
void main(uint3 DTid : SV_DispatchThreadID)
{
    START_SHADERCLOCK()

    // compose raycaster, raytracer, etc
    FVisibilityBufferRayCasterV2 rayCaster;
    FHardwareRayTracerV2 tracer;
    FHardwareDirectIlluminatorV2 dIlluminator;

    // build renderer
    FPathTracingRendererV2 renderer;
    renderer.ExitProbability = 0.5f;
    renderer.ExitAfterFirst = Bindless.GetGpuscene().Camera->FastGather;
    renderer.HitNormalOffset = 0.001f;
    renderer.SampleDownscale = 1;
    renderer.Init(DTid.xy);

    if( !renderer.PrimaryHit(rayCaster) )
    {
        END_SHADERCLOCK(DTid.xy)
        return;
    }

    int sampleMultiplier = Bindless.GetStorageTexture<uint>(Bindless.RT_MOTIONMOMENT)[DTid.xy]
                           > 0 ? 4 : 1;
    renderer.Render(tracer, dIlluminator, sampleMultiplier);
    END_SHADERCLOCK(DTid.xy)
}
```

```cpp
import Common;
import Bindless;
#include "common/ShaderClock.slang"

[shader("compute")]
[numthreads(8, 8, 1)]
void main(uint3 DTid : SV_DispatchThreadID)
{
    START_SHADERCLOCK()

    // compose raycaster, raytracer, etc
    FVisibilityBufferRayCasterV2 rayCaster;
    FSoftwareRayTracerV2 tracer;
    FSoftwareDirectIlluminatorV2 dIlluminator;

    // build renderer
    FPathTracingRendererV2 renderer;
    renderer.ExitProbability = 0.5f;
    renderer.ExitAfterFirst = true;
    renderer.HitNormalOffset = 0.1f;
    renderer.SampleDownscale = 2;
    renderer.Init(DTid.xy);

    if( !renderer.PrimaryHit(rayCaster) )
    {
        END_SHADERCLOCK(DTid.xy)
        return;
    }

    renderer.Render(tracer, dIlluminator, 1);
    END_SHADERCLOCK(DTid.xy)
}
```

与其说是着色器，其实更像一个渲染器。slang的语法，让封装，重构成为了一件非常简单的事情，一定程度上，对shader代码质量的提升也会很有帮助。



### Slangᴿ from nvidia

Slang，NVIDIA发起并集成于Vulkan SDK的项目，正是我曾构想的着色器语言，如今梦想成真。其高级语法、全平台编译（包括WebGPU）的特性，展现了极佳的普适性。附带的自动微分功能及工具链，也为渲染特征的预训练提供了新途径。

Slang支持泛型、成员函数、模块、命名空间等高级语言特性，让着色器代码库的编写体验，已然与C++开发无异。更令人称奇的是，我将一套GLSL着色器代码库转写为Slang后，性能竟有所提升。

拥有Slang，现代渲染开发无疑如虎添翼。



## 2. 现代的GPU资源管理是什么样的?

![](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/assets/2oyM0ET6jyMW4x053vcgyn6pjTb2942fyhc36HloJYQ=.gif "通过bindless，实现可完全自由控制输出的visualizer，访问任意纹理资源")

个人理解，现代渲染，gpu资源管理是非常关键的一点。而管理gpu资源最重要的一点就是Bindless。最好做到零bind。

做到了零bind，让pipeline可以访问所有的东西。不管是写代码，还是做管线，都可以做到极高的自由度。

在我将管线完全换为零bind之后。有一天晚上，有一个解决残影问题的思路，我只花了几分钟的时间，就完成了修改，验证的几个循环，迅速的解决了问题，无需关心我需要将绑定的纹理换成哪些，需要加入和清理多少参数。而在没有实现零bind的时候，这种级别的改动应该至少是一晚上的开发时间。



做到零bind，主要需要以下几个vulkan feature: 

* Device Buffer Address
  * 这个feature，可以取得storagebuffer的gpu地址。将地址传入shader，便可以自由偏移，并以指针的方式，访问gpu资源
* Bindless
  * 对于storage texture和sampled texture，无法获取gpu地址。但可以将所有纹理"bind"进一个无穷大的，可以随时update的纹理数组。数组的索引，便可以作为纹理的gpu地址，实现零bind访问。
* PushConstant
  * pushConstant是vulkan的一个设施，在drawcall或者dispatch的时候，将小尺寸的数据通过command的方式传输给执行线程。我们把场景数据的gpu地址放在这个结构内，便可以实现完全的零bind。



这时，cpu和gpu的数据交互，被浓缩到了这样两个小结构中

```cpp
public struct ALIGN_16 GPUScene
{
    /* Scene Info */
    public UniformBufferObject* Camera;

    /* Scene Node Tree */
    public NodeProxy* Nodes;

    /* Global Vertice Buffer */
    public uint* Reorders;
    public half4* VerticesSimple;
    public GPUVertex* Vertices;
    public uint* Indices;

    /* Resources */
    public Material* Materials;
    public ModelData* Offsets;

    /* Others */
    public AmbientCube* Cubes;
    public VoxelData* Voxels;
    public PageIndex* Pages;
    public SphericalHarmonics* HDRSHs;
    public LightObject* Lights;

    /* IndirectDraw */
    public VkDrawIndexedIndirectCommand* IndirectDrawCommands;
    public GPUDrivenStat* GPUDrivenStats;
    
    /* TLAS */
    public uint64_t TLAS;

    public uint SwapChainIndex;
    public uint custom_data_0;
    public uint custom_data_1;
}

// bindless textures
[[vk::binding(0, 0)]] __DynamicResource SampleTextureArray[];
[[vk::binding(1, 0)]] __DynamicResource StorageTextureArray[];
```

以`gpuScene.IndirectCommand`为起点，我们就可以在gpu上渲染出整个场景。



## 3. 现代渲染是如何组织Draw的？

![](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/assets/j13b7JlSGTjT4qLp8Qtnbia5WKoH7AykWdWb_uRA8OA=.gif)

> 一个疯狂的海洋球场景

* 8192个完全不同材质的海洋球
* 每个海洋球3000+tris，复杂遮挡
* 每个海洋球都经过物理模拟，随时运动
* SoftModern渲染器1000fps@1080p



现代渲染是通过gpu自驱动来完成drawcall的，而非传统的cpu驱动。零Bind的gpu资源管理，核心目的就是为了让gpu能够更完整的自驱运行，将cpu的干涉降到最低。



### "传统"gpu driven

比较可惜的是，在mesh shader/task shader出现之前，虽然有indirect draw，gpu的自驱运行尚做不到十分完美。

传统gpu driven的基本流程

1. 创建足量的indirectdraw
2. gpu cull，在ComputeShader中剔除的indirectDraw修改为空绘制
3. cpu发起足量的indirectdraw

这里会有一些问题，在桌面的gpu，空绘制的indirectdraw几乎没有开销，但在移动gpu上，这些空绘制也会造成较大的开销。



### "现代"gpu driven

vulkan新增了mesh shader / task shader，这解决了空绘制的问题。indirectdraw不再只能由发起。而可以通过task shader发起，这样，可以让gpu只发起需要绘制的indirectdraw，而不用填充大量空绘制。



### 模拟"现代"gpu driven

再次可惜的是，大量的移动gpu，不支持mesh shader。但有一篇文章提出了模拟方式，并指出amd的部分显卡的mesh shader就是软件模拟的。

实现上的思路其实比较简单，将所有drawcall的instance数据拼接进一个巨大的数组，通过单个drawcall调用



gkNextEngine目前还是使用的传统gpu driven的方式，由于meshshader的兼容性问题，可能后续会改进为模拟方式实现现代的gpu driven



## 4. 现代光照很复杂吗?

![](https://raw.githubusercontent.com/gameknife/gameknife.github.io/master/assets/uxV5aL9hMgiwDEvgK4RFftYWdITdnSRVbuu1j0Ezcbw=.gif "gkNextEngine 4种渲染器的reference模式")



这个问题，我无法给出正确的回答。这一次现代渲染研究的初衷，就是想要正确的理解硬件光线追踪。而最本质的PathTracing算法其实是非常朴素的，我把它形容为，回归本源，忘掉trick。从相机出发，让光线“找到”光源。

当然，对比最初的实现，现在的codebase，已经复杂了很多。但，都不是类似于之前做渲染时的各种“巧妙”的trick。而是为了最大限度的加速上面说的这个最朴素的过程。

从某种程度上来说，**现代光照是很简单的**，他不再像之前那样要把直接光照，间接光照，一项一项的通过各种各样的手法，以不同的组合方式达到接近真实的渲染结果。而是一开始就有了最真实的渲染结果，只是很慢。通过各种各样的手法，在结果不怎么偏离的情况下，尽可能的加速这个过程。



### gkNextEngine中的加速方法

在gkNextEngine中，我设计了一个离散分布于场景中的AmbientCube探针系统。探针会通过多次射线追踪（GPU或CPU），获取其位置六个cube朝向的光照信息，并存储于一个类似体素的存储系统中。在PathTracing的过程中，光线按照概率提前退出，在退出的命中点采样附近的探针信息，插值出该位置的光照，作为其后续“光路”模拟，贡献于最终结果。通过控制提前退出的概率，我们便能控制PathTracing的平均追踪次数，从而平衡效率。这与NEE（Next Event Estimation）的思路有那么一点相似。

当然，仅凭此加速策略，在低于16个样本的情况下，我们依然无法得到一个可接受的结果。在离线渲染中，我们通常通过长时间、持续地累积样本并进行平均，来逐步消除噪声，最终获得一个平滑且高质量的图像输出。因此，在实时渲染的动态环境中，如果能尽可能地累积多帧样本，我们便有望逼近离线渲染的输出品质。举例来说，若一帧产生8个样本，成功累积16帧，我们便能获得相当于128个样本的渲染结果，这在视觉上通常已可接受。为此，我设计了一种特别的reprojection方案，它会根据objectid和normal，对diffuse、specular、albedo结果分别进行时间和空间上的样本累积，以实现高样本数的渲染。

最终，128个样本的渲染结果，即使在不接降噪器的情况下，也已是一个可接受的品质。



### hardware ray tracing

Vulkan通过扩展（extension）的方式，提供了硬件光线追踪的支持。这主要通过构建硬件加速结构（BVH），来实现高速的射线求交。

早期，Vulkan引入了一种“raytracing pipeline”的模式，通过编写多个阶段的着色器（shader），硬件会在射线的不同阶段进行调用，从而实现光线追踪。

后期，Vulkan又提供了“rayquery”的方式。这种方式允许在着色器的任何阶段发起射线查询，这也是gkNextEngine所选择的硬件设施，并且是目前移动设备上唯一支持的方案。基于Bindless的硬件资源管理，rayquery能够极其便捷地实现各种光线追踪算法，这无疑为开发带来了极大的灵活性。



### software ray tracing

在不支持光追的硬件上，比如基于moltenvk的mac笔记本，不能就此放弃现代渲染。回归到之前，因此我们就需要一种近似的软件实现的追踪算法。

当然，直接用computer shader实现一个bvh求交，也不是不可以，甚至tinybvh库已经给出了用于gpu使用的数据结构。也有很多人做了相关的实现。但感觉只是单纯炫技并没什么实际的用处，如果能快过硬件，那为什么显卡厂商不约而同的生产了那么多RT CORE？

因此，我基于实际工程出发，前面提到的用于提前退出的那个AmbientCube探针，是可以用来进行粗略的软件求交的。我的探针分布为0.25米一个，密度足以表达场景。

探针发出的射线命中mesh的背面，被视作距离为0，命中正面，则会记录距离。这样一个数据结构，便可以用来表示空间了。我们可以遍历一条射线上的所有探针，根据他的最大距离，来快速移动（比较类似SDF）。如果触碰到距离为0或1的探针，说明有了命中交点。



### hybrid context

gkNextEngine为移动端及桌面高帧率环境，实现了一种高效的混合渲染模式。该高性能渲染需求，正是AmbientCube探针系统的设计初衷。初期，其工作方式略似DDGI：AmbientCube探针通过硬件光追实时生成，所得结果经插值后作为场景光照。

后期，引入了tinybvh，将0.25米探针视为体素，支持软件射线追踪。数据被划分为voxel与AmbientCube两层。Voxel层可由CPU实时生成；AmbientCube计算则灵活地选择硬件或软件执行。

最终，AmbientCube探针数据作为混合上下文（hybrid context），在多种渲染模式中均扮演着关键角色：

1. **PathTracing：** 作为提前退出的后备缓存，提升渲染效率。
2. **SoftTracing：** 兼作提前退出的后备缓存与软件追踪的数据结构。
3. **SoftModern：** 提供漫反射光照来源及镜面反射遮挡数据结构。

通过此混合上下文，gkNextEngine的全局光照渲染展现出强大的伸缩性。



## 5. 时域渲染

这里想多讲几句，关于时域渲染。

从TAA出现的那一刻起，渲染的思路就完全改变了，通过重投影，将“样本”分摊到多帧，是一个绝佳的解决思路。并且配合现在的高刷显示器，样本的分摊，其实是可以做到“人眼补帧”的。

目前我的开发主要在120-240hz的显示器上进行，我尽量将渲染器的运行效率控制在120hz以上，我就会发现，截图下来的图像，和我肉眼看到的图像，质量已经有非常大的差距了。这就是“人眼补帧”。

在60hz的显示模式下，我就可以把样本数提升一倍，得到和120hz显示器下接近的肉眼图像质量，但

因此，gkNextEngine在后续的开发中，会继续坚持时域渲染这个特征，进一步发扬光大。包括渲染和逻辑的异步运行等，继续探索时域渲染的更多可行性。



## 瞄准未来

经过这半年的疯狂补课，我有一个清晰的感受：

> 实时渲染的未来，游戏引擎的未来，一定有所颠覆

不光是光追这种精确而朴素的方法，gpu和cpu的解耦，通过LLM产生的AI革命，将会很快的影响游戏工业。

而尽管是目前使用最多，最为主流，最为先进的Unreal Engine和Unity Engine。也因为一路走来，有了太多太多的包袱。

说实话，我苦于各种引擎的材质爆炸已久。各种情形使得变体数量指数级的增长。面对硬件光追，也一定是传统开销叠加上硬件光追的开销。很难说，他们在面对现代渲染，面对未来，已经做好了准备。

因此，我决定把实验性质的gkNextRenderer变为gkNextEngine，整好也和我的gkEngine相呼应。

这次的gkNextEngine，我没有任何保留，我决定完全轻装上阵。当然它的目标：

> Just for fun.

这比我的gkEngine的目标更为纯粹。



我给gkNextEngine定下了几条原则：

1. 永远使用最新技术，不考虑向前兼容
2. 拥抱强大的第三方库，绝不主动造轮子
3. 保持代码库的小体积，易读性



遵循这个规则，目前NextEngine除了图形层面的开发，还完成了诸多用于实际游戏的模块，并开发了一个类似MagicaVoxel的乐高搭建小游戏。拥抱强大的第三方库，也让我打开了新的世界。目前强依赖的第三方库：

* sdl: 完成操作系统抽象，窗口管理
* glm: 数学库
* tinybvh: CPU的加速结构
* quickjs: js脚本引擎
* lzav: 内存压缩
* miniaudio: 音频库
* tinygltf: 模型，场景数据交互库
* meshoptimizer: 模型处理，pvoking, simpify等
* joltphysics: 物理引擎
* ozzAnimation: 骨骼动画引擎
* spdlog: 日志系统
* stb: 纹理读写
* imgui: 界面

目前已有模块：

* NextEngine
* NextAnimation
* NextScene
* NextPhysics
* NextRenderer
* NextUtility



最近用SDL替换glfw，看到Sam Lantinga自1998年以来对SDL的持续投入，确实让人深感敬佩。他二十多年如一日地更新代码，甚至直到昨天还在为SDL3贡献力量，这种坚持不懈的精神，在快速迭代的软件行业中显得尤为珍贵。从最初的起点，到后来辗转几家公司，最终在Valve继续发光发热，并且许多Valve的软件和游戏都基于SDL，这本身就是一段传奇。

这样的历程，也让我对自己的项目——gkNextEngine——有了更深的期许。我真心希望它也能成为一个能够持续更新的开源项目，像SDL一样，不断演进，始终保持先进性。我希望这份热情和投入能够一直延续下去，直到我真正写不动代码的那一天。这不仅仅是一个技术项目的愿景，更是一种对创造和贡献的个人承诺。
