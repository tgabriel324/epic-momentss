
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      loading: false,
      
      // Buscar QR codes do Supabase
      fetchQRCodes: async () => {
        set({ loading: true });
        
        try {
          const { data: qrCodes, error } = await supabase
            .from('qr_codes')
            .select('*')
            .order('date_created', { ascending: false });
          
          if (error) {
            console.error('Erro ao buscar QR codes:', error);
            toast({
              title: "Erro ao carregar QR codes",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          
          // Converter os QR codes do formato do banco para o formato da store
          const formattedQRCodes = qrCodes.map(qr => ({
            id: qr.id,
            videoId: qr.video_id,
            videoTitle: qr.video_title,
            dateCreated: qr.date_created,
            style: qr.style,
            scans: qr.scans,
            lastScan: qr.last_scan,
            scanHistory: qr.scan_history || [],
            analyticsEnabled: qr.analytics_enabled
          }));
          
          set({ qrCodes: formattedQRCodes, loading: false });
        } catch (error) {
          console.error('Erro ao buscar QR codes:', error);
          set({ loading: false });
        }
      },
      
      // Adicionar novo QR code
      addQRCode: async (qrCode) => {
        // Inserir no banco de dados
        const { data: newQRCode, error } = await supabase
          .from('qr_codes')
          .insert({
            video_id: qrCode.videoId,
            video_title: qrCode.videoTitle,
            style: qrCode.style,
            scan_history: qrCode.scanHistory || [],
            analytics_enabled: qrCode.analyticsEnabled !== false
          })
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao adicionar QR code:', error);
          toast({
            title: "Erro ao criar QR code",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Converter para o formato da store e adicionar ao estado
        const formattedQRCode: QRCode = {
          id: newQRCode.id,
          videoId: newQRCode.video_id,
          videoTitle: newQRCode.video_title,
          dateCreated: newQRCode.date_created,
          style: newQRCode.style,
          scans: newQRCode.scans || 0,
          lastScan: newQRCode.last_scan,
          scanHistory: newQRCode.scan_history || [],
          analyticsEnabled: newQRCode.analytics_enabled
        };
        
        set((state) => ({ 
          qrCodes: [formattedQRCode, ...state.qrCodes] 
        }));
        
        toast({
          title: "QR code criado",
          description: "Seu QR code foi adicionado à sua coleção."
        });
      },
      
      // Atualizar QR code existente
      updateQRCode: async (id, updates) => {
        // Preparar dados para atualização
        const updateData: any = {};
        
        if (updates.style) updateData.style = updates.style;
        if (updates.analyticsEnabled !== undefined) updateData.analytics_enabled = updates.analyticsEnabled;
        if (updates.videoTitle) updateData.video_title = updates.videoTitle;
        
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('qr_codes')
          .update(updateData)
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao atualizar QR code:', error);
          toast({
            title: "Erro ao atualizar QR code",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Atualizar o estado local
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { ...qrCode, ...updates } : qrCode
          )
        }));
      },
      
      // Excluir QR code
      deleteQRCode: async (id) => {
        // Excluir do banco de dados
        const { error } = await supabase
          .from('qr_codes')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao excluir QR code:', error);
          toast({
            title: "Erro ao excluir QR code",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Atualizar o estado local
        set((state) => ({
          qrCodes: state.qrCodes.filter((qrCode) => qrCode.id !== id)
        }));
        
        toast({
          title: "QR code excluído",
          description: "O QR code foi removido com sucesso."
        });
      },
      
      // Obter QR code pelo ID do vídeo
      getQRCodeByVideoId: (videoId) => 
        get().qrCodes.find((qrCode) => qrCode.videoId === videoId),
      
      // Obter QR code pelo ID
      getQRCodeById: (id) => 
        get().qrCodes.find((qrCode) => qrCode.id === id),
      
      // Incrementar contagem de escaneamentos
      incrementScans: async (id) => {
        const now = new Date().toISOString();
        const browserInfo = getBrowserInfo();
        const osInfo = getOSInfo();
        const deviceType = getDeviceType();
        
        const qrCode = get().getQRCodeById(id);
        if (!qrCode) return;
        
        const scanInfo = {
          id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          browser: browserInfo,
          os: osInfo,
          device: deviceType,
        };
        
        // Se análises estiverem ativadas, adicionar ao histórico
        const scanHistory = qrCode.analyticsEnabled 
          ? [...(qrCode.scanHistory || []), scanInfo]
          : qrCode.scanHistory || [];
        
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('qr_codes')
          .update({
            scans: qrCode.scans + 1,
            last_scan: now,
            scan_history: qrCode.analyticsEnabled ? scanHistory : undefined
          })
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao incrementar escaneamentos:', error);
          return;
        }
        
        // Atualizar o estado local
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { 
              ...qrCode, 
              scans: qrCode.scans + 1, 
              lastScan: now,
              scanHistory: qrCode.analyticsEnabled ? scanHistory : qrCode.scanHistory
            } : qrCode
          )
        }));
      },
      
      // Registrar detalhes de escaneamento
      recordScanDetails: async (id, scanDetails) => {
        const now = new Date().toISOString();
        const qrCode = get().getQRCodeById(id);
        
        if (!qrCode || !qrCode.analyticsEnabled) return;
        
        const scanInfo = {
          id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          ...scanDetails,
        };
        
        const scanHistory = [...(qrCode.scanHistory || []), scanInfo];
        
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('qr_codes')
          .update({
            scan_history: scanHistory
          })
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao registrar detalhes de escaneamento:', error);
          return;
        }
        
        // Atualizar o estado local
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { 
              ...qrCode,
              scanHistory
            } : qrCode
          )
        }));
      },
      
      // Ativar/desativar análises
      toggleAnalytics: async (id, enabled) => {
        const { error } = await supabase
          .from('qr_codes')
          .update({
            analytics_enabled: enabled
          })
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao atualizar configurações de análise:', error);
          toast({
            title: "Erro ao atualizar configurações",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Atualizar o estado local
        set((state) => ({
          qrCodes: state.qrCodes.map((qrCode) => 
            qrCode.id === id ? { ...qrCode, analyticsEnabled: enabled } : qrCode
          )
        }));
      },
      
      // Obter escaneamentos por período
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
      
      // Exportar dados de análise
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
