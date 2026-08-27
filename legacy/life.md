---
layout: page
title: Life
location: cate
---

<div class="posts">
  {% for post in site.posts %}
  
  {% if post.category == site.cate.life %}
  <div class="post" style="margin: 0 0 1em 0;">
    <span class="post-date-horizon">{{ post.date | date_to_string }}</span>
	   »   
    <a class="post-title" href="{{ post.url }}">
        {{ post.title }}
    </a>
<!--
    {{ post.content }}
	{{ post.abstract }}
	 <hr>
-->
	

  </div>
  {% endif %}
  
  {% endfor %}
</div>
