---
title: "Behavior脚本系统"
date: 2010-05-29
category: tech
description: "这周的前两天，研究xml小有成就，这周的后两天，我继续研究lua和cpp的结合。昨天小有成就，今天来给大家分享一下经验 先说一下效果，按照惯例，上一张图 这两天同组程序员\"cc\"研究了character controller，角色和场景的碰撞检测已经很完美了。 所以目前的效果是：通过上下左右箭头..."
tags: ["Behavior", "Lua", "脚本系统", "架构"]
draft: false
---

这周的前两天，研究xml小有成就，这周的后两天，我继续研究lua和cpp的结合。昨天小有成就，今天来给大家分享一下经验~

先说一下效果，按照惯例，上一张图~

<div class="img-lost"><b>[ 配图已遗失 ]</b> 早期博文配图（原外链已失效）</div>

这两天同组程序员"cc"研究了character controller，角色和场景的碰撞检测已经很完美了。

所以目前的效果是：通过上下左右箭头，如同90坦克那样控制坦克在场景中移动，并且可以检测到楼梯上下。坦克的移动是个加速过程，速度从5-20，松开按键后归到5。

而目前控制坦克逻辑已经完全交给了lua脚本！这个是昨天研究了一天的成果，相当舒服，而且对于cc(character controller)物体和非cc物体，都可以使用同一个behavior脚本控制（得益于gameobject的继承结构和override函数）。

下面附上这一段控制的逻辑脚本

**`Tank.lua`**

```lua
--|------------------------------------------- 
--Private variables 
fSpeed = 10 
fMaxSpeed = 20 
fMinSpeed = 5 
fAccelaration = 10 

--|------------------------------------------- 
--System functions 
function Start () 
 local flag = true 
end 

function Update (fElapsedTime) 
 -- move up. translate and rotate 
 if (IsKey(KeyCode.VK_UP)) then 
 fSpeed = fSpeed + fElapsedTime * fAccelaration 
 if(fSpeed > fMaxSpeed) then fSpeed = fMaxSpeed end 
 SetEuler(0,0,0) 
 GlobalTranslate(0,0,1,fElapsedTime * fSpeed) 
 end 
 -- move left. 
 if (IsKey(KeyCode.VK_LEFT)) then 
 fSpeed = fSpeed + fElapsedTime * fAccelaration 
 if(fSpeed > fMaxSpeed) then fSpeed = fMaxSpeed end 
 SetEuler(0,-90,00) 
 GlobalTranslate(-1,0,0,fElapsedTime * fSpeed) 
 end 
 -- move down. 
 if (IsKey(KeyCode.VK_DOWN)) then 
 fSpeed = fSpeed + fElapsedTime * fAccelaration 
 if(fSpeed > fMaxSpeed) then fSpeed = fMaxSpeed end 
 SetEuler(0,180,0) 
 GlobalTranslate(0,0,-1,fElapsedTime * fSpeed) 
 end 
 -- move right. 
 if (IsKey(KeyCode.VK_RIGHT)) then 
 fSpeed = fSpeed + fElapsedTime * fAccelaration 
 if(fSpeed > fMaxSpeed) then fSpeed = fMaxSpeed end 
 SetEuler(0,90,0) 
 GlobalTranslate(1,0,0,fElapsedTime * fSpeed) 
 end 
 -- if any key released. 
 if ((not IsKey(KeyCode.VK_UP)) and (not IsKey(KeyCode.VK_LEFT)) and (not IsKey(KeyCode.VK_DOWN)) and (not IsKey(KeyCode.VK_RIGHT))) then 
 fSpeed = fMinSpeed 
 end 
end
```

有过lua基础的同学应该很容易看懂。这段脚本其实和unity3d绑定在gameobject上的behavior异曲同工。

哈哈，废话，我的设计思想多数是在模仿和借鉴unity3d。因为它的易用和易理解，现在很火。所以借鉴unity3d的结构一定能让程序更加易用。

下面大概说一下具体的实现吧。

先说设计思想。gameknife目前基本已经确定是以gameobject为中心的结构了，所以我考虑可以为每一个gameobject绑定一个behavior。这个behavior就是一个lua脚本。gameobject在绘制前会调用behavior的update() ，在每一次reset时（或者是create时）调用start()，为gameobject作初始化（是不是像极了unity？）。

通过update()函数，反向的再调用c++中的函数，相当于把frameMove()做到外部可以动态改变，这样，便可以驱动游戏的逻辑了。

那么现在的设计是这样的：

C++代码

**`代码`**

```cpp
void InitBehavior(const char* filename, bool uselib=false) 
 { 
 if (m_lsoBehavior->DoFile(filename) != 0) 
 { 
 OutputDebugString(L"===LuaScriptSystem> Behavior Script Init Error!\n"); 
 return; 
 } 
 m_bIsBehavior = true; 
 if(uselib) 
 m_lsoBehavior->OpenLibs(); 
 kLuaLinkFunctions(); 
 } 

void kLuaLinkFunctions() 
{ 
 if(m_lsoBehavior) 
 { 
 m_lsoBehavior->GetGlobals().RegisterDirect("IsKeyDown", *this, &kGameObject::luaIsKeyDown); 
 m_lsoBehavior->GetGlobals().RegisterDirect("IsKeyUp", *this, &kGameObject::luaIsKeyUp); 
 m_lsoBehavior->GetGlobals().RegisterDirect("IsKey", *this, &kGameObject::luaIsKey); 
 m_lsoBehavior->GetGlobals().RegisterDirect("LocalTranslate", *this, &kGameObject::kLuaTranslateLocal); 
 m_lsoBehavior->GetGlobals().RegisterDirect("GlobalTranslate", *this, &kGameObject::kLuaTranslateGlobal); 
 m_lsoBehavior->GetGlobals().RegisterDirect("LocalRotate", *this, &kGameObject::kLuaRotateLocal); 
 m_lsoBehavior->GetGlobals().RegisterDirect("GlobalRotate", *this, &kGameObject::kLuaRotateGlobal); 
 m_lsoBehavior->GetGlobals().RegisterDirect("SetEuler", *this, &kGameObject::kLuaSetEuler); 
 } 
}
```

initBehavior是外部调用的，为gameobject绑定lua文件。

然后链接Functions，把控制逻辑的函数链接进lua state

C++代码

**`代码`**

```cpp
void kLuaIntialize() 
{ 
 //获得名字为Start的函数指针 
 LuaFunction<void> pStartFunc = m_lsoBehavior->GetGlobal("Start"); 
 pStartFunc(); 
} 

void kLuaUpdate(float fElapsedTime) 
{ 
 //获得名字为Update的函数指针 
 LuaFunction<float> pUpdateFunc = m_lsoBehavior->GetGlobal("Update"); 
 pUpdateFunc(fElapsedTime); 
}
```

这里是start和update在c++中的体现，分别在create和framemove中调用即可。

这样，就将lua脚本和c++执行的逻辑联系起来了。

ps. 昨天做这个程序时，其实设计没花太多时间，大量时间放在那个register函数上了。

luaplus中有相当多的register函数: register(xxx), registerDirect(xxx), registerFunc(...), registerObjectDirect(), registerObjectFunc()。选择上测试了好久。建议大家在做的时候先建一个tmain的小工程，测试，测试完成后直接移入大工程。我昨天深受其害，后来才意识到应该使用小工程测试，毕竟luaplus深入研究的文章不多，文档也写得...唉，毕竟是个人项目。那个Joshua C. Jensen确实太牛逼了，膜拜！
