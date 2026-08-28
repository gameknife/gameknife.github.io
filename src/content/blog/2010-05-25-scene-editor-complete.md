---
title: "场景编辑器竣工！"
date: 2010-05-25
category: tech
description: "今天接着做XML解析，对那个遍历的结构作了些修改，插入了几个函数。 终于，新的场景编辑器竣工了！ 一个比较复杂的场景了，用3dsMax制作材质，安排物件位置和所用材质 导出到DirectX中，效果感觉比Max中好啊 得益于我的后期和ShadowMap啊！ 3dsMax中编辑场景 应用了自写sh..."
tags: ["场景编辑器", "UI", "游戏开发", "MFC"]
draft: false
---

今天接着做XML解析，对那个遍历的结构作了些修改，插入了几个函数。

终于，新的场景编辑器竣工了！

> 一个比较复杂的场景了，用3dsMax制作材质，安排物件位置和所用材质

> 导出到DirectX中，效果感觉比Max中好啊~

> 得益于我的后期和ShadowMap啊！
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 3dsMax中编辑场景

> 应用了自写shader和scene effect
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

> 再来个局部效果
> 
> 
> 
> <div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

效果相当不错了，并且和上学期制作的场景编辑器不同，这次是自动解析使用的x文件，使用的材质文件，自动的解析每个物体使用哪一个材质。完全自动，开放性的设计为以后想要加入新的模型，为模型使用不同的材质做了充分准备。场景编辑器的代码基本上就固定下来了，不用再作变动。

不过在保存材质和模型时，还是存在一些不方便。需要在x文件导出插件中作不同的设置，不过目前的时间已经不够再让我做一个类似pander的简化导出插件了，只好写一个使用文档凑活用了~

下面配上这个场景所使用的test.xml，希望对大家有所启发。具体的解析实现碍于篇幅就不在这里写了。

**`代码`**

```xml
<?xml version="1.0" encoding="utf-8" ?> 

<IGame xmlns="urn:maxxml" Version="2.0" Date="Tue May 25 15:19:46 2010"> 

 <SceneInfo FileName="levelDesignBeta.max" StartFrame="0" EndFrame="100" FrameRate="30" TicksPerFrame="160" CoordinateSystem="directx" RotationFormat="Quaternion" ObjectSpace="false"></SceneInfo> 

 <MaterialList Count="9"> 

 <Material Index="0" Name="ksMat_ToonBag" Class="DirectX Shader"></Material> 

 <Material Index="1" Name="ksMat_ToonBookOpen" Class="DirectX Shader"></Material> 

 <Material Index="2" Name="ksMat_ToonFlower" Class="DirectX Shader"></Material> 

 <Material Index="3" Name="ksMat_ToonPBoxA" Class="DirectX Shader"></Material> 

 <Material Index="4" Name="ksMat_ToonTerrian" Class="DirectX Shader"></Material> 

 <Material Index="5" Name="ksMat_ToonRed" Class="DirectX Shader"></Material> 

 <Material Index="6" Name="ksMat_ToonBlue" Class="DirectX Shader"></Material> 

 <Material Index="7" Name="ksMat_ToonGreen" Class="DirectX Shader"></Material> 

 <Material Index="8" Name="ksMat_ToonTank" Class="DirectX Shader"></Material> 

 </MaterialList> 

 <Object Name="bagA.x 01" NodeID="638" MaterialIndex="0"> 

 <Translation> 

 50.900787 21.874781 28.437721 

 </Translation> 

 <Rotation> 

 0.000000 0.781607 0.000000 0.623771 

 </Rotation> 

 <Scale> 

 1.000000 1.000000 1.000000 -0.000000 -0.000000 -0.000000 1.000000 

 </Scale> 

 </Object> 

 <Object Name="Bookclose.x 01" NodeID="639" MaterialIndex="1"> 

 <Translation> 

 -28.488480 1.558182 -58.162262 

 </Translation> 

 <Rotation> 

 -0.000000 0.352962 -0.000000 0.935638 

 </Rotation> 

 <Scale> 

 1.000000 1.000000 1.000000 -0.000000 -0.000000 -0.000000 1.000000 

 </Scale> 

 </Object> 

 ... 
 ... 
 ... 

</IGame>
```
