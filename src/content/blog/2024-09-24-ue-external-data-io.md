---
title: "别硬啃 AnimMontage：给复杂资产写一层外部存取设施"
date: 2024-09-24
category: tech
description: "DataConfig 能读写任意带 UPROPERTY 的反射结构，简单的 DataAsset 非常顺。但想整个序列化 AnimMontage 就撞墙了 —— 退一步，改成按类型注册存取器。"
tags: ["UE5", "序列化", "DataAsset", "反射", "工具链"]
draft: true
---
这次研究的起点是技能的编辑和管理：我想把 `UAnimMontage` 的数据存到引擎外面去。

## 简单的 DataAsset 非常顺

先说好用的部分。

有一个插件项目 [DataConfig](https://github.com/slowburn-dev/DataConfig)，可以对任意 UE 反射数据结构做读写 —— U 类、F 类上标了 `UPROPERTY` 的属性都能进出。

对于手写的 DataAsset，这条路顺畅得不像话：

```cpp
USTRUCT()
struct FEntityPhysicsConfig
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, Category = "Entity Physics Config")
    bool CanSimulatePhysics;

    UPROPERTY(EditAnywhere, Category = "Entity Physics Config")
    TEnumAsByte<EEntityPhysicType> PhysicType;
};

UCLASS()
class UEntityConfig : public UDataAsset
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, Category = "Entity Config")
    FString Name;

    UPROPERTY(EditAnywhere, Category = "Entity Config")
    FEntityPhysicsConfig PhysicsConfig;

    UPROPERTY(EditAnywhere, Category = "Entity Config")
    TSubclassOf<AActorBase> ActorClass;

    UFUNCTION(CallInEditor, Category = "JSON Bridge")
    void ExportJson();
    UFUNCTION(CallInEditor, Category = "JSON Bridge")
    void ImportJson();
};
```

两个 `CallInEditor` 的按钮就把资产和 JSON 打通了。

更进一步：这种结构甚至可以做到**运行时从外部数据动态创建**。配置不再需要跟着包一起出，这对调试和外部工具链的价值很大。

## 撞墙的地方

`UAnimMontage` 就完全是另一回事了。

它的数据不单纯 —— 里面有很多**临时、但又没有标 Transient 的 UPROPERTY**，这和它的实现细节有关。

我一开始的想法是把这些 property 一个个解决掉，让 DataConfig 能直接序列化整个 AnimMontage。

试下来放弃了，原因有两条：

1. 要处理的实现细节太多，而且每次引擎升级都可能变；
2. DataConfig 似乎也没有打算把这块做很好的支持 —— 比如 `TScriptInterface` 这种临时类型，它只在内存序列化的层面上支持。

第二条是决定性的。我要做的事情，工具作者本来就不打算覆盖。

## 退一步：按类型注册存取器

退一步海阔天空。

对于 AnimMontage 这类复杂结构，不追求"整个序列化"，而是**针对性地写一种存取设施**，只对其中的部分关键数据做外部存取。

具体形态是定义一个统一的外部存取设施，按类型往里注册各种存取能力：

- 对于单纯的 DataAsset，注册通用实现，完全存取；
- 对于复杂类型，注册一个专门的工具类，只把内部那部分需要外部编辑的数据序列化出去、再写回来。

这样做的代价很清楚：每一种复杂类型都要有人写一遍适配，而且引擎升级时这些适配可能要跟着改。

换来的是它不会因为一个不认识的 `UPROPERTY` 就整体失败。**能存取的部分永远能存取**，剩下的交给引擎自己的序列化。

对于"想让外部工具能编辑技能数据"这个真实需求来说，这个交换是划算的 —— 我要的从来不是完整还原一个 AnimMontage，是能改到那几个关键字段。
