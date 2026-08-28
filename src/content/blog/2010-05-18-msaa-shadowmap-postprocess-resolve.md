---
title: "Multisample & ShadowMap & PostProcess冲突解决"
date: 2010-05-18
category: tech
description: "昨天早上，我为了测试方便，把SettingDialog加入了F11快捷键，方便我快速的改变各种设备设定。 结果悲剧发生了... 看到SettingDialog后，我第一个打开的就是MSAA（多重采样抗锯齿），之后确定。画面变成一片惨黑... 我料想可能是后期处理和阴影的问题，按下F3（后期处理..."
tags: ["DirectX", "MSAA", "ShadowMap", "后处理", "渲染"]
draft: false
---

> 昨天早上，我为了测试方便，把SettingDialog加入了F11快捷键，方便我快速的改变各种设备设定。

> 结果悲剧发生了...

看到SettingDialog后，我第一个打开的就是MSAA（多重采样抗锯齿），之后确定。画面变成一片惨黑...

我料想可能是后期处理和阴影的问题，按下F3（后期处理开关），画面亮了，但是效果依然悲剧，画面结果表现的是深度和模板缓存失效了，最后画的物体显示在了画面的最上面。如下图

<div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

之后，我立即开始思考这个问题，我不由得想到了微软官方的例子"PostProcess"，这里出问题了，看他的解决方法不就OK了吗，随即我打开官方的PostProcess...

> 第一步

> 开始，可以应用后期处理效果！
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 第二步

> ChangeDevice，打开一个MSAA吧，MSAA4x， quality4
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 第三步

> PostProcess也华丽的黑屏了 - -|||
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

这下好了，连微软官方也忽视了这个问题。我开始上网搜索"高手"的解决方法。

无奈，国内似乎高手都无动于衷，可能这个问题都没有拿出来给大家讲。

GOOGLE搜索: 关键字Multisample PostProcess | Multisample Shadowmap | Multisample RenderTarget, 搜索到一些国外开发者论坛。

发现有同学和我差不多的问题，有画面显示深度错误的，也有一片惨黑的。看来老外们讨论比较激烈啊！当然多数文章最后并未解决，有一篇文章有高手提议: 可能是(DS Surface)深度模板表面 和 RenderTarget使用了不同的MultiSample格式，因此导致深度错误。

我的ShadowMap错误和这个类似，因此我选择试试他的提议，始终提供一个自己建立的无MultiSample格式的深度表面来绘制。果然，成功了，不再出错，但是MSAA无论怎么选择，都和不开启是一样的。也就是说，这个解决办法...行不通...

不过通过这个解决，我大致清楚了可能是由于我的RenderTarget没有设置为正确的MultiSample格式，而导致问题出现的，因为默认的DS就是根据设置来设置MultiSample格式的。因此，我把精力集中在了RenderTarget的Surface上面。果然，RenderTarget的MultiSample格式在调试中仍旧为none。但是，我应该怎么改呢？这个surface完全是从texture的getSufaceLevel得来的。

继续搜索，我发现DX10有一个新特性，支持textrue和surface的bind，完美的解决了这个问题。而DX9貌似还不能支持这个特性，继续搜索，一个国外高手的一句话，精辟了！

Yes, you can create multisample render targets. But you can't set them as a texture.

Use IDirect3DDevice9::CreateRenderTarget to create a multisample render target. Then, create a regular texture. After rendering to your multisample render target, you'll need to StretchRect() the multisample render target to one of the surfaces in your regular texture.

原来，可以手工BIND上texture和surface。就是建立一个自己想要的属性的surface，设置为RT。绘制结束后，使用stretchRect方法复制到texture的surfaceLevel。就实现了一个手工绑定。

之后，有了想法，实现上其实比较简单，经过一个小时的整理和编码，终于得到了成功的MSAA结果。

下面放图

> 开起MSAA 8x 后的效果，抗锯齿相当棒了。
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 细节对比，差别太大了。
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

MSAA确实是必不可少的一环啊，可能MICROSOFT也只是抛砖引玉，所以没有在PP那个例子上解决这个问题吧。

这个问题我在遇到，思考，求解的过程中，发现国内的相关信息确实比较少了，希望这篇文章能帮到需要帮助的人吧，希望我的TAG够全面...
