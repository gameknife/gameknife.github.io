// 一次性转换：_data/*.yml -> src/data/*.ts
//
// 重点是把 skills.yml / projects.yml 里混在数据中的 <ul>/<li>/<lis>/<hr>/<br>
// 剥掉，还原成真正的嵌套结构。这样以后改版式不用碰内容（方案 §05 末段）。

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const read = (f) => YAML.parse(fs.readFileSync(path.join(ROOT, '_data', f), 'utf8'));
const q = (s) => JSON.stringify(s);

const clean = (s) =>
  String(s)
    .replace(/<\/?(?:lis|li|ul|hr\s*\/?|br\s*\/?)>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** description 数组 -> { images, groups, link } */
function parseDescription(lines = []) {
  const images = [];
  const groups = [];
  let link = null;
  let current = null;

  for (const rawLine of lines) {
    if (rawLine == null) continue;
    const line = String(rawLine).trim();
    if (!line) continue;

    const img = line.match(/<img\s+src="([^"]+)"(?:\s+alt="([^"]*)")?/i);
    if (img) {
      images.push({ src: img[1], alt: img[2] || '' });
      continue;
    }

    if (/^<br\s*\/?>$/i.test(line) || /^<\/?ul>$/i.test(line) || /^<hr\s*\/?>$/i.test(line)) continue;

    const heading = line.match(/^<li>(.*?)<\/li>$/i);
    if (heading) {
      current = { heading: clean(heading[1]), items: [] };
      groups.push(current);
      continue;
    }

    const item = line.match(/^<lis>(.*?)<\/lis>$/i);
    if (item) {
      if (!current) { current = { heading: '', items: [] }; groups.push(current); }
      current.items.push(clean(item[1]));
      continue;
    }

    const anchor = line.match(/^Hosted on\s*<a href="([^"]+)"[^>]*>(.*?)<\/a>/i);
    if (anchor) { link = { href: anchor[1], label: clean(anchor[2]) }; continue; }

    // 兜底：没包标签的裸文本也收进当前分组
    const text = clean(line);
    if (text) {
      if (!current) { current = { heading: '', items: [] }; groups.push(current); }
      current.items.push(text);
    }
  }
  return { images, groups, link };
}

// ── projects + jobs + education + skills -> resume.ts ────────────────────
const projects = read('projects.yml').map((p) => {
  const { images, groups, link } = parseDescription(p.description);
  return { title: p.title, company: p.company, period: p.period, images, groups, link };
});

const skills = read('skills.yml').map((s) => {
  const { groups } = parseDescription(s.description);
  return { title: s.qualification, items: groups.flatMap((g) => g.items) };
});

const jobs = read('jobs.yml').map((j) => ({
  title: j.title, company: j.company, period: j.period, description: (j.description || '').trim(),
}));

const education = read('education.yml').map((e) => ({
  qualification: e.qualification, school: e.school,
}));

const resumeTs = `// 由 scripts/convert-data.mjs 从 _data/{jobs,skills,projects,education}.yml 生成。
// 已剥离原先混在 YAML 里的 <ul>/<li>/<lis> 标签 —— 这里只有数据，排版归组件管。

export interface ProjectGroup { heading: string; items: string[] }
export interface ProjectImage { src: string; alt: string }
export interface Project {
  title: string; company: string; period: string;
  images: ProjectImage[]; groups: ProjectGroup[];
  link: { href: string; label: string } | null;
}
export interface Job { title: string; company: string; period: string; description: string }
export interface SkillGroup { title: string; items: string[] }
export interface Education { qualification: string; school: string }

export const jobs: Job[] = ${JSON.stringify(jobs, null, 2)};

export const skills: SkillGroup[] = ${JSON.stringify(skills, null, 2)};

export const education: Education[] = ${JSON.stringify(education, null, 2)};

export const projects: Project[] = ${JSON.stringify(projects, null, 2)};
`;

// ── cv.yml -> cv.ts ──────────────────────────────────────────────────────
const cv = read('cv.yml');
const cvTs = `// 由 scripts/convert-data.mjs 从 _data/cv.yml 生成。
// 这份数据同时驱动 /cv/ 页面与 CI 导出的 PDF —— 改这里，两处一起变。
//
// 排版预算：正文约 2 页 A4。每加 3~4 行正文就会多出小半页。

export interface CvBasics {
  name_zh: string; name_en: string; headline: string;
  location: string; email: string; github: string; site: string;
}
export interface CvSkillGroup { group: string; group_en: string; items: string[] }
export interface CvExperience {
  title: string; company: string; period: string; summary: string; highlights: string[];
}
export interface CvProject {
  title: string; role: string; period: string; link?: string; highlights: string[];
}
export interface CvEducation { degree: string; school: string; period: string }
export interface CvAdditional { label: string; text: string }

export const basics: CvBasics = ${JSON.stringify(cv.basics, null, 2)};

export const summary = ${q(cv.summary)};

export const skills: CvSkillGroup[] = ${JSON.stringify(cv.skills, null, 2)};

export const experience: CvExperience[] = ${JSON.stringify(cv.experience, null, 2)};

export const projects: CvProject[] = ${JSON.stringify(cv.projects, null, 2)};

export const education: CvEducation[] = ${JSON.stringify(cv.education, null, 2)};

export const additional: CvAdditional[] = ${JSON.stringify(cv.additional, null, 2)};
`;

fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/resume.ts'), resumeTs, 'utf8');
fs.writeFileSync(path.join(ROOT, 'src/data/cv.ts'), cvTs, 'utf8');

const tagLeak = (resumeTs + cvTs).match(/<(?:lis|li|ul|hr)\b/g);
console.log(`✓ resume.ts  — ${projects.length} 个项目 / ${jobs.length} 段经历 / ${skills.length} 组技能`);
console.log(`✓ cv.ts      — ${cv.experience.length} 段经历 / ${cv.projects.length} 个项目`);
console.log(tagLeak ? `! 仍有 ${tagLeak.length} 处标签残留` : '✓ 标签已完全剥离');
