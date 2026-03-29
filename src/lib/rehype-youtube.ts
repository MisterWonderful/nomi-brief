/**
 * Converts plain YouTube URLs in markdown to responsive embed HTML.
 * Call this on the article content string before passing to ReactMarkdown.
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function preprocessYouTubeUrls(content: string): string {
  const youtubeRegex =
    /\b(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<]*)?/g;

  return content.replace(youtubeRegex, (_match, videoId: string) => {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    return `<div class="youtube-embed-wrapper"><iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="YouTube video"></iframe></div>`;
  });
}
