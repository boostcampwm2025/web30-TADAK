/**
 * GitHub 아바타 URL을 최적화하여 원하는 크기로 요청
 * @param url 아바타 URL
 * @param size 요청할 이미지 크기 (기본값: 80)
 * @returns 최적화된 URL 또는 원본 URL
 */
export const getOptimizedAvatarUrl = (url?: string, size = 80): string | undefined => {
  if (!url) return undefined;

  // GitHub avatar URL optimization
  if (url.includes('githubusercontent.com') || url.includes('github.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}s=${size}`;
  }

  return url;
};
