
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "@/hooks/use-toast";
import { QRCode, QRCodeScan, defaultQRStyle } from "@/types/qrCode.types";
import { 
  fetchQRCodes as fetchQRCodesService,
  addQRCode as addQRCodeService,
  updateQRCode as updateQRCodeService,
  deleteQRCode as deleteQRCodeService,
  incrementQRCodeScans as incrementQRCodeScansService,
  recordQRCodeScanDetails as recordQRCodeScanDetailsService,
  toggleQRCodeAnalytics as toggleQRCodeAnalyticsService
} from "@/services/qrCodeService";
import { exportQRCodeAnalytics } from "@/utils/qrAnalytics";

interface QRCodeStore {
  qrCodes: QRCode[];
  loading: boolean;
  addQRCode: (qrCode: QRCode) => Promise<void>;
  updateQRCode: (id: string, updates: Partial<QRCode>) => Promise<void>;
  deleteQRCode: (id: string) => Promise<void>;
  getQRCodeByVideoId: (videoId: string) => QRCode | undefined;
  getQRCodeById: (id: string) => QRCode | undefined;
  incrementScans: (id: string) => Promise<void>;
  recordScanDetails: (id: string, scanDetails: Omit<QRCodeScan, "id" | "timestamp">) => Promise<void>;
  toggleAnalytics: (id: string, enabled: boolean) => Promise<void>;
  getScansByPeriod: (id: string, startDate: string, endDate: string) => QRCodeScan[];
  exportAnalytics: (id: string) => string;
  fetchQRCodes: () => Promise<void>;
}

export const useQRCodeStore = create<QRCodeStore>()(
  persist(
    (set, get) => ({
      qrCodes: [],
      loading: false,
      
      // Fetch QR codes from Supabase
      fetchQRCodes: async () => {
        set({ loading: true });
        
        try {
          const formattedQRCodes = await fetchQRCodesService();
          set({ qrCodes: formattedQRCodes, loading: false });
        } catch (error) {
          console.error('Erro ao buscar QR codes:', error);
          set({ loading: false });
        }
      },
      
      // Add new QR code
      addQRCode: async (qrCode) => {
        const newQRCode = await addQRCodeService(qrCode);
        
        if (newQRCode) {
          set((state) => ({ 
            qrCodes: [newQRCode, ...state.qrCodes] 
          }));
        }
      },
      
      // Update existing QR code
      updateQRCode: async (id, updates) => {
        const success = await updateQRCodeService(id, updates);
        
        if (success) {
          set((state) => ({
            qrCodes: state.qrCodes.map((qrCode) => 
              qrCode.id === id ? { ...qrCode, ...updates } : qrCode
            )
          }));
        }
      },
      
      // Delete QR code
      deleteQRCode: async (id) => {
        const success = await deleteQRCodeService(id);
        
        if (success) {
          set((state) => ({
            qrCodes: state.qrCodes.filter((qrCode) => qrCode.id !== id)
          }));
        }
      },
      
      // Get QR code by video ID
      getQRCodeByVideoId: (videoId) => 
        get().qrCodes.find((qrCode) => qrCode.videoId === videoId),
      
      // Get QR code by ID
      getQRCodeById: (id) => 
        get().qrCodes.find((qrCode) => qrCode.id === id),
      
      // Increment scan count
      incrementScans: async (id) => {
        const qrCode = get().getQRCodeById(id);
        if (!qrCode) return;
        
        const { success, scanInfo } = await incrementQRCodeScansService(id, qrCode);
        
        if (success) {
          set((state) => ({
            qrCodes: state.qrCodes.map((qrCode) => 
              qrCode.id === id ? { 
                ...qrCode, 
                scans: qrCode.scans + 1, 
                lastScan: scanInfo?.timestamp,
                scanHistory: qrCode.analyticsEnabled && scanInfo 
                  ? [...qrCode.scanHistory, scanInfo]
                  : qrCode.scanHistory
              } : qrCode
            )
          }));
        }
      },
      
      // Record scan details
      recordScanDetails: async (id, scanDetails) => {
        const qrCode = get().getQRCodeById(id);
        const success = await recordQRCodeScanDetailsService(id, qrCode, scanDetails);
        
        if (success && qrCode) {
          const now = new Date().toISOString();
          const newScan: QRCodeScan = {
            id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: now,
            ...scanDetails,
          };
          
          set((state) => ({
            qrCodes: state.qrCodes.map((qrCode) => 
              qrCode.id === id ? { 
                ...qrCode,
                scanHistory: [...qrCode.scanHistory, newScan]
              } : qrCode
            )
          }));
        }
      },
      
      // Toggle analytics
      toggleAnalytics: async (id, enabled) => {
        const success = await toggleQRCodeAnalyticsService(id, enabled);
        
        if (success) {
          set((state) => ({
            qrCodes: state.qrCodes.map((qrCode) => 
              qrCode.id === id ? { ...qrCode, analyticsEnabled: enabled } : qrCode
            )
          }));
        }
      },
      
      // Get scans by period
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
      
      // Export analytics data
      exportAnalytics: (id) => {
        const qrCode = get().qrCodes.find((qrCode) => qrCode.id === id);
        return exportQRCodeAnalytics(qrCode);
      },
    }),
    {
      name: "epic-moments-qrcodes",
    }
  )
);

export { defaultQRStyle };
