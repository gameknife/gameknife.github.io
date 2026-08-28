---
title: "让 SCAD 里的世界动起来：程序化布局与刚体骨骼角色"
date: 2026-08-22
category: tech
description: "零件和地面都已经是纯文本，但东西还是死的。这篇讲怎么把零件按规则铺满一平方公里，以及怎么让文本描述的角色动起来，最后在 NextDayz 的 416 行文件里合体。"
tags: ["gkNextEngine", "openscad", "程序化生成", "动画"]
draft: true
---
上篇讲完了零件和地面：kit 提供一套有契约、能被求值检查的模块库，terrain 提供能走、能寻路、能碰撞的低模地形，两者都是纯文本。

到这里为止，东西还是死的。这篇讲剩下两件事——怎么把零件按规则铺满一平方公里（SCAD Procedural），以及怎么让文本描述的角色动起来（SCAD Rig）。最后回到 NextDayz，看这四件套怎么在一个 416 行的文件里合体，顺带说一个我做之前完全没预料到的收益。

数字仍然是 2026 年 8 月 14 日的本地实测。

---

## 一、别让模型写 SCAD，让它填表

零件和地面都有了，接下来是布局：把 800 棵树、几十辆弃车、八个据点摆到 1 平方公里的地形上。

这一层有三种用法，从低到高：手写 SCAD 直接调组合子；手写一份 JSON spec 让 `gnb scad compose` 展开；或者一句话交给模型，让它产出 spec 再走同一条 compose。三层用的是同一套底座，区别只在谁来写那份布局描述。

我自己最常用的是中间那一层。原因下面说。

### 组合子只放置，不产几何

`kit_layout.scad` 和 `kit_terrain.scad` 是两个特殊的 kit——它们一个三角形都不产，只做放置。catalog 不收录它们。

平面这边是网格阵、直线阵、环阵、区域散布、沿折线撒点，外加一个"从若干候选里确定性选一个"和一个随机抖动包装。贴地那边是同一批语义加上地形采样：贴地平移、随坡倾斜、逐 child 贴地、沿折线贴地撒点、带过滤器的拒绝采样散布。

关键在于每实例变量会穿透 `children()`：`$idx`、`$col` / `$row`、`$seed`、`$t`、`$px` / `$py` 在子节点里都可读。这是 OpenSCAD 动态作用域给的能力，我在 loader 里专门验证过 `for` 体内的 `$var = ...` 赋值能穿透 `children()`，并补了测试。

有了它，"六个摊位围着水井排一圈，每个外观不同"就是一句 `lay_ring(6, 9, seed = 3) oc_bldg_stall(seed = $seed);`。散布规则里再加一个生物群系过滤器，"树只长在海拔 0.5 到 40 米、坡度不超过 26 度、离水 3 米以上的草地上"也是一行。

有一条分界是踩出来的：**散布交给组合子，结构不要交给随机。** 植被、杂物、路灯用散布；房屋这类结构件老老实实手摆坐标。让随机去摆建筑，出来的东西永远差一口气——你说不出哪里不对，但它就是不像有人住过的地方。

顺带交代一个密度基准：1 平方公里大约 700~900 棵树。我第一版放了 320 棵，一眼荒芜。树还得放大，缩放取 1.5~2.9（8~17 米高）；showcase 里用的 1.0 在大地图上看起来是灌木。

### 为什么是 JSON，不是 SCAD

现在到了这条路线上我认为最关键的一个决定。

**我没有让模型直接写 SCAD。** 它写的是一份 JSON scene spec：

```json
{
  "name": "valley_bridge",
  "kits": ["overhill"],
  "terrain": { "size": [200, 160], "seed": 9,
               "features": [
                 {"type": "mountain", "at": [-40, 55], "radius": 42, "height": 22},
                 {"type": "river", "pts": [[-20, 45], [0, 0], [5, -75]], "width": 6, "depth": 1.6},
                 {"type": "road", "pts": [[-90, -30], [60, -22]], "width": 4.5}]},
  "placements": [
    {"module": "oh_prop_bridge", "args": "L = 16", "at": [3, -24], "rot": 5, "snapAt": [-7, -25]}],
  "scatters": [
    {"region": [-95, -75, 95, 75], "n": 60, "seed": 21,
     "where": {"hMin": 0.3, "hMax": 12, "slopeMax": 26, "avoidWater": 3,
               "biome": ["grass", "grass_dark"]},
     "children": [{"module": "oh_nature_pine", "args": "s = lay_randr($seed, 5, 0.8, 1.4)"}]}]
}
```

理由一句话就能说完：**JSON 有 schema，SCAD 只有语法。**

一段 SCAD 可以语法完全合法、求值完全成功，然后给你一堆悬在半空的房子。语法检查抓不到这种东西。而一份 spec 在展开成 SCAD 之前就能被校验：模块名必须逐字来自 catalog（禁止编造），terrain 和 ground 互斥，折线至少两点且全部落在域内，cells 在 4 到 256 之间，biome 必须是枚举值，hMin 不能大于 hMax，pad 压到河上告警，blockGrid 不贴地告警。

模型看到的零件菜单也不是 1,875 行 kit 源码，而是从上篇那份 catalog 生成的一行行"模块名（参数） 宽 × 深 高"。它需要知道的就是这些——上篇讲的那套放置契约（底面 z=0、front 朝 −y）保证了光看尺寸就足够决定间距。

这个决定是有代价的，我得说清楚：spec 的表达力**远远低于** SCAD。凡是 schema 里没定义的东西，模型就写不出来，想要新玩法得先改 schema 和 compose。我拿灵活性换了可校验性，这笔交易只在"生成量大、单次质量要求不高、但必须能自动验收"的场景里划算。如果你要的是少量高完成度的资产，直接让模型写 SCAD 再人工审，可能更快。

### 规则要压进 prompt，不要留在对话记录里

system prompt 里压了 13 条硬规则，全部来自真实翻车。比如：

> 2. 菜单里每个模块名后标注了默认尺寸，据此决定间距：网格 cell 要比零件脚印大 2~4 米。
> 12. 路过河必须配桥：桥长至少 2.5 倍河宽，并用 `snapAt` 设为岸上路面点。

第 12 条来自一次断桥事故。道路算子对填方超过 0.9 的深沟会自动留空，桥沟就出现了，摆一座桥上去即可——但第一版的桥全是断的，玩家走到桥头上不去。

原因是河岸有一条下切带，宽度是半河宽的 2.2 倍。桥太短，引桥就落在下切带的斜坡里，下桥那一步的高差超过 NavGrid 的 `maxStepHeight`，桥两端在寻路图上直接断连。画面上桥好好地架着，逻辑上它不通。

这条经验没有停在"以后小心"，而是同时变成了 prompt 里的一行和 compose 校验里的一条告警。和上篇那个倾斜杆件是同一个模式：**发现一类系统性错误，就把它压成一条可检查的规则，而不是把每次的修补留在对话记录里。**

对话记录会滚走，规则不会。

### 顺带一个渲染坑：地面叠层的黑斑

这个和模型无关，但凡是做俯视角地图的都会踩。

`ground_*` 系列都是底面 z=0、厚 0.08~0.16 的薄板，表面还有一两厘米的细节片——裂纹、湿斑、车位线。两块地面件平面重叠时，下层的细节会从上层表面钻出去几毫米。那几个面被裹在上层实体内部，收不到光，路径追踪下渲染成黑斑，同时还 z-fight。

规避方式两选一：区域级地表铺砖不重叠（块间留 2 米缝），或者上层整体抬 20 厘米一级。20 厘米的台阶在 70° 俯视下看不见。

还有一条：被完全埋进上层实体的地面件等于没画，还占三角形。写完用一个小脚本按 footprint 加厚度扫一遍重叠对，比肉眼可靠。

### 文本的东西，也得能拖

spec 和组合子都是文本，但调参靠改数字重新截图，效率很低。所以 ScadLibrary 里做了一个过程编辑页。

打开一个含 `TERR` 的场景，七类 feature 会直接画在地形表面上：山峰和台地显示半径轮廓与高度标尺，ridge / river / road 显示中心折线、宽度边界和控制点，pad 显示旋转后的占地框。拖中心点改 XY，拖竖直手柄改高度或深度，拖横向手柄改宽度。过程规则同样可视化，选中一条 scatter 才展开它过滤后的确定性点集，免得几百个点糊住场景。

这里有个我比较满意的实现细节：**保存采用源码增量改写。** 未识别的桥高表达式、自由 SCAD 和注释不会因为过程编辑而丢失，编辑器只改它认识的那部分参数。

这条约束是必须的。一旦编辑器保存时会重写整个文件，人和 AI 就不敢再往这个文件里写任何编辑器不认识的东西——你会开始迁就工具，文本资产的价值立刻塌一半。

<!-- TODO 配图未产出：img-scad-terrain-process.webp（ScadLibrary 的地形过程页：feature 画在地形表面上，右侧是它的参数。地形本身是一份能进 git diff 的文本。）。补图放进 src/assets/blog/ 后改回 ![ScadLibrary 的地形过程页：feature 画在地形表面上，右侧是它的参数。地形本身是一份能进 git diff 的文本。](../../assets/blog/img-scad-terrain-process.webp） -->

---

## 二、角色也是一段可以 diff 的程序

场景走通之后，我把这条路又推了一步：角色。

ScadRig 是一套刚体骨骼角色方案，语义和 Minecraft 那类方块人一致——刚体部件挂在骨骼层级上，不做蒙皮。

先把话说在前面：**没有蒙皮意味着关节处必然有硬边。** 我用低模风格把它变成了特征，但这是一次风格上的妥协，不是技术上的胜利。要做写实角色，这条路直接出局。

### 约定只有七条

一个角色就是一个合法的 `.scad` 文件：

```scad
ROLECOLOR = [1, 0, 1];                      // 换色占位（纯品红），运行时按实例替换
module part_arm() { ... }                   // 非 bone_ 前缀 = helper，几何折叠进所属骨骼
module bone_arm_l() { part_arm(); }
module bone_arm_r() { mirror([1,0,0]) part_arm(); }   // mirror 在骨骼体内，烘进网格
module bone_torso() {
    color(ROLECOLOR) cube(...);             // 体内直属几何 = 刚性绑定该骨骼
    translate([0,0,0.54]) bone_head();      // 调用点外层的 translate = 子骨骼 pivot
}
module bone_root() { translate([0,0,0.84]) bone_torso(); }
bone_root();                                // 顶层恰好一个 bone_* 调用

anim_walk = [                               // clip = 顶层 anim_<name> 变量，纯数据
    ["bone_leg_l", "rot", [[0,[35,0,0]], [0.4,[-35,0,0]], [0.8,[35,0,0]]]],
    ["bone_root",  "pos", [[0,[0,0,0]], [0.2,[0,0,0.03]], [0.4,[0,0,0]]]],
];
anim_sit = [ ["loop", false], ["bone_root","pos",[[0,[0,0,-0.42]]]] ];   // 单帧 = 姿态
```

规则一共七条：`bone_` 前缀的 module 是骨骼；骨骼调用点外层只允许 `translate` / `rotate`；顶层只有一个根骨骼调用；通道是 `rot` / `pos` / `scale`，key 时间单调递增、线性插值（`rot` 加载期转四元数后 slerp）；合成语义是 `L_final = L_bind · T · R · S`；1 unit = 1 米、Z-up、根骨骼原点落地；引擎的正面 +Z 对应 SCAD 的 −Y，所以鼻子和鞋尖朝 −Y 建模。

违反约定只产生警告，加载不失败。

这个格式有个我很喜欢的性质：**它同时是三种东西。** 对引擎，它是运行时资产，加载后由动画器采样驱动；对人，它是普通 SCAD 文件，原版 OpenSCAD 打开就能看到绑定姿态；对模型，它是可以生成、可以增量修改的代码——"让走路动作摆臂大一点"就是改两个关键帧数字。

### 通用标准和专用资产，我选了先做专用

`kit_char.scad`（32 个模块）把角色拆成可组合部件：头、发型、帽子、躯干、手臂、腿、配件，外加整装预设。它固定了一套七骨骼标准和一组固定 pivot，因此**动作可以跨角色复用**——`anim_walk = ch_clip_walk();` 就完事了。新角色是一个薄文件，选件拼装加调色。

NextDayz 的两个角色正好落在这套体系的两端：

- `nextdayz_infected.scad`：**41 行**。走七骨骼标准，六段动作，复用共享网格。
- `nextdayz_survivor.scad`：**1,233 行**。17 根骨骼、31 段 clip，完全专用。

survivor 的骨架多出了 pelvis、上臂／前臂／手的三段手臂、大腿／小腿／脚的三段腿，以及一根空的 `bone_weapon_socket`——武器在运行时挂上去。这是被 3C 需求逼出来的：蹲姿、四方向的走／跑／冲刺、翻越、攀爬、举枪瞄准、开火后坐力。七骨骼撑不住这些。

设计文档里明确写了这个取舍：复杂人形骨架先作为 NextDayz 专用资产验证，**出现第二个消费端之后再抽成通用 humanoid kit**。我认为这是对的顺序。抽早了，你会抽出一个只服务一个游戏的"通用"标准，然后第二个游戏来的时候两边都难受。

### 31 段 clip 不靠 switch 切换

`PlayerRigVisual` 建了五个 layer：

```cpp
locomotionLayer_ = CreateLayer("locomotion",    Override, FullBody(asset_));

FRigBoneMask upperBody = FRigBoneMask::FromSubtree(asset_, "bone_torso");
upperBody.SetBoneWeight(asset_, "bone_torso", 0.65f);
upperBody.SetBoneWeight(asset_, "bone_head",  0.25f);

aimLayer_          = CreateLayer("aim",           Override, upperBody);
weaponActionLayer_ = CreateLayer("weapon_action", Override, upperBody);

FRigBoneMask recoilMask = upperBody;
recoilMask.SetBoneWeight(asset_, "bone_head", 0.0f);
recoilLayer_       = CreateLayer("recoil",        Additive, recoilMask);
actionLayer_       = CreateLayer("action",        Override, FullBody(asset_));
```

`bone_torso` 权重 0.65、`bone_head` 权重 0.25 这两个数字是效果调出来的：躯干要能被瞄准姿态带过去，但不能整个扭死；头几乎保持水平看地平线。recoil 层把头的权重直接归零——后坐力不该甩头，甩头会晕。

于是"一边冲刺、一边举枪、同时开火"是三层叠加的结果，不是一段需要单独制作的 clip。跑步腿部来自 locomotion，上身姿态来自 aim，每一发的抖动是 recoil 的 additive 一次性播放。

还有一条藏得比较深但很重要：采样只覆盖 clip 里实际写了的 position / rotation / scale 分量，没写的不会覆盖下层 pose。不做这一条的话，一个只写了 `rot` 的上身 clip 会把下层的 `pos` 抹平，角色会在原地下沉。

### 关键帧不是手摆的

survivor 的 locomotion 关键帧全部是**从踝关节轨迹用两连杆 IK 反解出来的**，不是我一帧帧凑的。

原因是刚体骨骼有一个非常刺眼的失败模式：支撑脚的鞋底只要离开 z=0 一点点，整套动作立刻读作"滑步"。人眼对这个极其敏感，而且一旦发现就再也不能不看见。

所以文件里留了一段注释，写给未来的自己和 AI：

> Every locomotion key below was solved from an authored ankle trajectory with 2-link leg IK, so the planted boot sole sits exactly on z = 0 and the swing boot clears it. Keep that invariant when hand-editing: a key whose stance sole leaves the ground reads as skating.

武器姿态同理：步枪摆在躯干空间里（枪托在射击侧肩窝、瞄具在视线上），两条手臂都解到枪上，`bone_weapon_socket` 承担抵消手臂链的那一段旋转，让枪口保持设定的姿态。

这也是我认为角色走这条路真正成立的地方：31 段 clip 全是纯数据，改一个关键帧就是改一行数字；而"脚底必须在 z=0"这种不变量，可以作为注释留在文件里，人和 AI 下一次打开都看得见。二进制动画文件做不到这件事。

---

## 三、关卡设计数据和渲染资产是同一份东西

回到 NextDayz。这张 1 平方公里的地图是**一个 416 行的文件**，四件套全在里面。

开头三行 `use` 把三个 kit 引进来：布局组合子、贴地组合子、冷战零件库。然后是那个 `TERR` 数组和一句 `gk_terrain(TERR);`。剩下的全是 `ter_place` 和 `ter_scatter` 把 114 个冷战模块铺到地形上。

有意思的是中间那一段：

```scad
// NextDayz runtime semantic anchors. The tiny geometry guarantees that the
// module survives scene import; WorldAnchorRegistry hides it and disables its
// raycast body before the first playable frame.
module nd_spawn_player_safe()     { color([0.1, 0.8, 0.2]) sphere(r = 0.18, $fn = 6); }
module nd_spawn_zombie_military() { color([0.5, 0.1, 0.1]) sphere(r = 0.18, $fn = 6); }
module nd_spawn_loot_medical()    { color([0.9, 0.9, 0.9]) sphere(r = 0.15, $fn = 6); }

ter_place(TERR, -320, -165) nd_spawn_player_safe();
ter_place(TERR,   45, -190) nd_spawn_zombie_military();
ter_place(TERR,  -30, -177) nd_spawn_loot_medical();
```

这些小球是**语义锚点**。它们有一点点几何，纯粹是为了保证模块能活过场景导入——空模块会被优化掉。运行时扫一遍把它们隐藏、关掉 raycast body，只留下类型、profile 和世界坐标。

结果是玩家出生点、僵尸刷新点、战利品点全部由 SCAD 源码定义，**运行时代码里没有一个硬编码的 POI 坐标**。想把医疗物资从小镇挪到工厂，改一行坐标，不碰 C++，不重新导出。

物品表用的是同一个思路，但更省事——它直接拿 SCAD 模块名当键：`cw_wpn_ak` 映射到 AK-74，`cw_item_medkit` 映射到医疗包，`cw_item_crate_supply` 映射到两份罐头加两卷绷带。不在表里的节点被忽略。

于是场景里任何一个叫 `cw_wpn_ak` 的节点都自动是一把可捡的 AK。往场景里摆一把新枪，不需要注册、不需要配表、不需要重新导出——摆上去就能捡。

**这是我做这条路线之前完全没预料到的收益。** 一开始我想解决的只是"资产能不能改"，结果顺手把关卡设计数据和渲染资产变成了同一份东西。传统管线里这是两套东西、两个工具、两次导出，中间那道同步缝隙我见过太多次了。

![这一帧里的地图、建筑、手上的角色和动作，全部来自 `.scad` 文本。](../../assets/blog/img-scad-nextdayz.webp)

---

## 四、边界与下一步

技术诚实一下，这条路不是万能的。

**它擅长的是结构化的东西**：建筑、道具、家具、机械、载具、方块角色。CSG 的表达力天花板摆在那里。你不会用它建一张真实感人脸，也不会用它做一棵形态自然的树。那些领域，直接生成的路线和传统美术管线仍然是对的，这一点我在开篇就说了，结尾也不打算改口。

生成质量也依赖模型的空间推理。复杂空间关系它仍然会犯错，只是错了能修——这是和直接吐 mesh 的本质区别：不是不犯错，是错误可收敛。

当前的已知限制，都是真的：

- 地形不能参与场景级 CSG；
- 不支持倾斜地形查询，因此没有悬崖和洞穴；
- 单 Model 索引上限把地形卡在 176 × 176 格；
- 含 `gk_*` 扩展的场景不再兼容原版 OpenSCAD；
- ScadLoader 是 OpenSCAD 子集，边角语义不保证一致。

### 下一步：地形分块

我打算先动的是索引上限。

现在整块地形是一个 Model。单个 Model 的索引数超过 65535 × 3（约 6.5 万三角形，对应 180² 格）时，引擎会跳过物理 MeshShape——画面完全正常，玩家直接穿过地面掉下去。所以格子密度被压在 176 × 176，1 公里图上就是 5.7 米一格。`riverland_1km.scad` 里那个看起来很随意的 176，就是这么来的。

低模风格勉强够用，但同一条限制还锁死了另外两件事：地形没法参与更细的几何操作，也没法表达悬崖这种需要多值高度的结构。

把地形按 chunk 拆成多个 Model，这三件事是同一把钥匙：格子密度可以按需要提高，每块可以单独参与 CSG，多值高度也有了容纳它的结构。物理和寻路那边的接口不用改，因为它们本来就是从同一份三角化结果里取数据的——上篇讲的"一份数据喂三个消费端"，在这里正好变成了改动的保护伞。

这件事还没开工。等做完再写。

### 结论收窄一点

我的结论不是"所有 3D 生成都该写代码"，也不是直接 mesh、NeRF 或 Gaussian Splatting 走错了路。

更窄的结论是：**当内容需要版本管理、局部修改、参数化，并且要继续被工程系统消费时，结构化中间表达值得优先尝试。**

模型负责把模糊意图翻译成结构化表达，引擎负责确定性执行、校验和渲染。资产不是一个来历不明的二进制 blob，而是一段可以审的程序——能 diff，能测试，能被下一个人（或者下一个 agent）读懂并继续改。

三个月前我不确定这条路能走多远，现在至少能确定它撑得住一个 1 平方公里、有地形有角色有玩法的原型。

最后想问一句：**你觉得"资产即代码"这件事，边界在哪？** 我这边的边界画在了 CSG 的表达力上——有机形体、写实角色一律出局。但我怀疑真正的边界可能更靠前，在"美术愿不愿意读代码"这一层。如果你带过美术团队，很想听听你的判断。

---

**源码 / 链接**

- gkNextEngine：https://github.com/gameknife/gkNextEngine
- 本篇相关代码：组合子 `assets/scad/lib/kit_layout.scad`、`kit_terrain.scad`，角色 `assets/scad/characters/`，spec 管线 `tools/gnb/internal/scadcompose/` 与 `scadgen/`，NextDayz `src/Application/Game/NextDayz/`
- 仓库内文档：`docs/AGENT_GUIDE/ScadRig.md`、`docs/AGENT_GUIDE/ScadAssetPlaybook.md`、`docs/designs/scad-scene-compose-design.md`
- 上一篇：[别让 AI 直接吐 3D 模型，让它写代码](【上篇知乎链接】)
