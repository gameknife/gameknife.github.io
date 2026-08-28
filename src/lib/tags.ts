/**
 * 标签配色工具模块
 * 使用 FNV-1a 字符串哈希将任意 Tag 确定性映射到 12 个预设低饱和度低亮度色槽之一
 */

export const TAG_COLOR_COUNT = 12;

/**
 * 计算 Tag 的色彩槽位索引 (0 ~ TAG_COLOR_COUNT - 1)
 */
export function getTagColorIndex(tag: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < tag.length; i++) {
    hash ^= tag.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % TAG_COLOR_COUNT;
}

/**
 * 获取 Tag 对应的 CSS 类名 (例如 tag-c0 ~ tag-c11)
 */
export function getTagColorClass(tag: string): string {
  return `tag-c${getTagColorIndex(tag)}`;
}
