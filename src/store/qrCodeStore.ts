
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QRCodeStyle {
  foreground: string;
  background: string;
  cornerRadius: number;
  size: number;
  logoUrl?: string;
}

export interface QRCode {
  id: string;
  videoId: string;
  videoTitle: string;
  dateCreated: string;
  style: QRCodeStyle;
  scans: number;
  lastScan?: string;
}

interface QRCodeStore {
  qrCodes: QRCode[];
  addQRCode: (qrCode: QRCode) => void;
  updateQRCode: (id: string, updates: Partial<QRCode>) => void;
  deleteQRCode: (id: string) => void;
  getQRCodeByVideoId: (videoId: string) => QRCode | undefined;
  getQRCodeById: (id: string) => QRCode | undefined;
  incrementScans: (id: string) => void;
}

export const defaultQRStyle: QRCodeStyle = {
  foreground: "#000000",
  background: "#ffffff",
  cornerRadius: 0,
  size: 200,
};

export const useQRCodeStore = create<QRCodeStore>()(
  persist(
    (set, get) => ({
      qrCodes: [],
      
      addQRCode: (qrCode) => 
        set((state) => ({ 
          qrCodes: [qrCode, ...state.qrCodes] 
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
      
      incrementScans: (id) => 
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { 
              ...qrCode, 
              scans: qrCode.scans + 1, 
              lastScan: new Date().toISOString() 
            } : qrCode
          )
        })),
    }),
    {
      name: "epic-moments-qrcodes",
    }
  )
);
