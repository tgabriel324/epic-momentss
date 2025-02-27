
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QRCodeStyle {
  foreground: string;
  background: string;
  cornerRadius: number;
  size: number;
  logoUrl?: string;
}

export interface QRCodeScan {
  id: string;
  timestamp: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface QRCode {
  id: string;
  videoId: string;
  videoTitle: string;
  dateCreated: string;
  style: QRCodeStyle;
  scans: number;
  lastScan?: string;
  scanHistory: QRCodeScan[];
  analyticsEnabled: boolean;
}

interface QRCodeStore {
  qrCodes: QRCode[];
  addQRCode: (qrCode: QRCode) => void;
  updateQRCode: (id: string, updates: Partial<QRCode>) => void;
  deleteQRCode: (id: string) => void;
  getQRCodeByVideoId: (videoId: string) => QRCode | undefined;
  getQRCodeById: (id: string) => QRCode | undefined;
  incrementScans: (id: string) => void;
  recordScanDetails: (id: string, scanDetails: Omit<QRCodeScan, "id" | "timestamp">) => void;
  toggleAnalytics: (id: string, enabled: boolean) => void;
  getScansByPeriod: (id: string, startDate: string, endDate: string) => QRCodeScan[];
  exportAnalytics: (id: string) => string;
}

export const defaultQRStyle: QRCodeStyle = {
  foreground: "#000000",
  background: "#ffffff",
  cornerRadius: 0,
  size: 200,
};

// Funções auxiliares para análise
const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Chrome") > -1) return "Chrome";
  if (userAgent.indexOf("Safari") > -1) return "Safari";
  if (userAgent.indexOf("Firefox") > -1) return "Firefox";
  if (userAgent.indexOf("Edge") > -1) return "Edge";
  if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
  
  return "Desconhecido";
};

const getOSInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.indexOf("Windows") > -1) return "Windows";
  if (userAgent.indexOf("Mac") > -1) return "MacOS";
  if (userAgent.indexOf("Linux") > -1) return "Linux";
  if (userAgent.indexOf("Android") > -1) return "Android";
  if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) return "iOS";
  
  return "Desconhecido";
};

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) return "Tablet";
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) return "Smartphone";
  
  return "Desktop";
};

export const useQRCodeStore = create<QRCodeStore>()(
  persist(
    (set, get) => ({
      qrCodes: [],
      
      addQRCode: (qrCode) => 
        set((state) => ({ 
          qrCodes: [
            {
              ...qrCode,
              scanHistory: qrCode.scanHistory || [],
              analyticsEnabled: qrCode.analyticsEnabled !== false,
            }, 
            ...state.qrCodes
          ] 
        })),
      
      updateQRCode: (id, updates) => 
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { ...qrCode, ...updates } : qrCode
          )
        })),
      
      deleteQRCode: (id) => 
        set((state) => ({
          qrCodes: state.qrCodes.filter((qrCode) => qrCode.id !== id)
        })),
      
      getQRCodeByVideoId: (videoId) => 
        get().qrCodes.find((qrCode) => qrCode.videoId === videoId),
      
      getQRCodeById: (id) => 
        get().qrCodes.find((qrCode) => qrCode.id === id),
      
      incrementScans: (id) => {
        const now = new Date().toISOString();
        const browserInfo = getBrowserInfo();
        const osInfo = getOSInfo();
        const deviceType = getDeviceType();
        
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { 
              ...qrCode, 
              scans: qrCode.scans + 1, 
              lastScan: now,
              scanHistory: qrCode.analyticsEnabled ? [
                ...qrCode.scanHistory || [],
                {
                  id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  timestamp: now,
                  browser: browserInfo,
                  os: osInfo,
                  device: deviceType,
                }
              ] : qrCode.scanHistory || [],
            } : qrCode
          )
        }));
      },
      
      recordScanDetails: (id, scanDetails) => {
        const now = new Date().toISOString();
        
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id && qrCode.analyticsEnabled ? { 
              ...qrCode,
              scanHistory: [
                ...qrCode.scanHistory || [],
                {
                  id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  timestamp: now,
                  ...scanDetails,
                }
              ]
            } : qrCode
          )
        }));
      },
      
      toggleAnalytics: (id, enabled) => 
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { ...qrCode, analyticsEnabled: enabled } : qrCode
          )
        })),
      
      getScansByPeriod: (id, startDate, endDate) => {
        const qrCode = get().qrCodes.find((qrCode) => qrCode.id === id);
        if (!qrCode) return [];
        
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        
        return (qrCode.scanHistory || []).filter((scan) => {
          const scanTime = new Date(scan.timestamp).getTime();
          return scanTime >= start && scanTime <= end;
        });
      },
      
      exportAnalytics: (id) => {
        const qrCode = get().qrCodes.find((qrCode) => qrCode.id === id);
        if (!qrCode) return '';
        
        const analyticsData = {
          qrCodeId: qrCode.id,
          videoTitle: qrCode.videoTitle,
          totalScans: qrCode.scans,
          lastScan: qrCode.lastScan,
          scanHistory: qrCode.scanHistory || [],
        };
        
        return JSON.stringify(analyticsData, null, 2);
      },
    }),
    {
      name: "epic-moments-qrcodes",
    }
  )
);
