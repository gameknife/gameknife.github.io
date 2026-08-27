---
layout: post
title: Unity3D之Non-Uniform-Scale之坑
category: hidden
---

### 背景

最近在做内存优化时，发现一个奇怪之问题：
因为其实项目的mesh并不会在cpu进行显示的回读操作，因此我们并不需要mesh在系统内存中的那一份拷贝。只需要一份显存即可。
因此我为所有的mesh关掉了r/w enable选项并reimport。

结果，在真机调试的profiler发现，只有部分mesh减小为了一半的消耗。并且仔细的在Not Saved中发现了相当多临时的Mesh，大小类似。

### 查明

结果终于在一篇Unity官方的Presentation找到了答案。Unity3D为了确保normal的正确性（事实证明还有恼人的cull issue），
直接粗暴的将mesh复制一份拷贝并进行scale...

What the hell...

经过更加细致到统计，发现加上r/w选项到冗余消耗，scale到副本。
原本可能只占据（3mb／场景）的模型数据，竟然可能被使用到（7-9mb／场景）之多！

解决这个问题，刻不容缓！
