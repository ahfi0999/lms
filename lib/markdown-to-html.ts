import { remark } from 'remark';
import DOMPurify from 'isomorphic-dompurify';
import html from 'remark-html';

export default async function markdownToHtml(markdown: string) {
  const result = await remark().use(html).process(markdown);
  const dangerousHtml = result.toString();
  const safeHtml = DOMPurify.sanitize(dangerousHtml);
  return safeHtml;
}
