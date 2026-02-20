/**
 * URL Builder Utilities
 * สำหรับสร้าง URL ที่มี cloaking และ tracking
 */

export const buildCloakedUrl = (token: string | undefined, productUrl: string, customBaseUrl?: string): string => {
  if (!productUrl) return "";
  
  // 1. ถ้ามี Custom Base URL (เช่น https://goeco.mobi/?token=...) ให้ใช้ตัวนั้นเป็นหลัก
  if (customBaseUrl && customBaseUrl.includes('?token=')) {
    const encodedUrl = encodeURIComponent(productUrl);
    // ลบส่วน &url= เดิมออกถ้ามี เพื่อป้องกันการซ้อนทับ
    const base = customBaseUrl.split('&url=')[0];
    return `${base}&url=${encodedUrl}&source=lazada_2026`;
  }

  // 2. ถ้ามีแค่ Token ให้ใช้ Default Base URL ของ goeco.mobi
  if (token) {
    const baseUrl = 'https://goeco.mobi/?token=';
    const encodedUrl = encodeURIComponent(productUrl);
    return `${baseUrl}${token}&url=${encodedUrl}&source=lazada_2026`;
  }

  // 3. Fallback: ถ้าไม่มีข้อมูล Cloaking เลย ให้ส่ง URL เดิมกลับไป
  return productUrl;
};
