/**
 * URL Builder Utilities
 * สำหรับสร้าง URL ที่มี cloaking และ tracking
 */

export const buildCloakedUrl = (token: string | undefined, productUrl: string, customBaseUrl?: string): string => {
  if (!productUrl) return "";
  
  // If we have a custom base URL (full URL with token), use it
  if (customBaseUrl && customBaseUrl.includes('?token=')) {
    const encodedUrl = encodeURIComponent(productUrl);
    // Ensure we don't double append &url=
    const base = customBaseUrl.split('&url=')[0];
    return `${base}&url=${encodedUrl}&source=api_product`;
  }

  // If we only have a token, use the default goeco.mobi base
  if (token) {
    const baseUrl = 'https://goeco.mobi/?token=';
    const encodedUrl = encodeURIComponent(productUrl);
    return `${baseUrl}${token}&url=${encodedUrl}&source=api_product`;
  }

  // Fallback to original URL if no cloaking info provided
  return productUrl;
};
