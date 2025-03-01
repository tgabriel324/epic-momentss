
// Utility functions for browser and device detection
export const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  if (userAgent.indexOf("Edge") > -1) return "Edge";
  if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
  
  return "Desconhecido";
};

export const getOSInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Windows") > -1) return "Windows";
  if (userAgent.indexOf("Mac") > -1) return "MacOS";
  if (userAgent.indexOf("Linux") > -1) return "Linux";
  if (userAgent.indexOf("Android") > -1) return "Android";
  if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) return "iOS";
  
  return "Desconhecido";
};

export const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) return "Tablet";
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) return "Smartphone";
  
  return "Desktop";
};

// QR code analytics export functionality
export const exportQRCodeAnalytics = (qrCode: any): string => {
  if (!qrCode) return '';
  
  const analyticsData = {
    qrCodeId: qrCode.id,
    videoTitle: qrCode.videoTitle,
    totalScans: qrCode.scans,
    lastScan: qrCode.lastScan,
    scanHistory: qrCode.scanHistory || [],
  };
  
  return JSON.stringify(analyticsData, null, 2);
};
