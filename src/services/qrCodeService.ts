
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { QRCode, QRCodeScan } from "@/types/qrCode.types";
import { Json } from "@/integrations/supabase/types";
import { getBrowserInfo, getDeviceType, getOSInfo } from "@/utils/qrAnalytics";

// Fetch QR codes from the database
export const fetchQRCodes = async (): Promise<QRCode[]> => {
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
      return [];
    }
    
    // Convert the QR codes from the database format to the store format
    const formattedQRCodes = qrCodes.map(qr => ({
      id: qr.id,
      videoId: qr.video_id,
      videoTitle: qr.video_title,
      dateCreated: qr.date_created,
      style: qr.style as unknown as QRCode["style"],
      scans: qr.scans || 0,
      lastScan: qr.last_scan,
      scanHistory: (qr.scan_history as unknown as QRCodeScan[]) || [],
      analyticsEnabled: qr.analytics_enabled || false
    }));
    
    return formattedQRCodes;
  } catch (error) {
    console.error('Erro ao buscar QR codes:', error);
    return [];
  }
};

// Add a new QR code to the database
export const addQRCode = async (qrCode: QRCode): Promise<QRCode | null> => {
  try {
    const { data: newQRCode, error } = await supabase
      .from('qr_codes')
      .insert({
        video_id: qrCode.videoId,
        video_title: qrCode.videoTitle,
        style: qrCode.style as unknown as Json,
        scan_history: qrCode.scanHistory as unknown as Json[] || [],
        analytics_enabled: qrCode.analyticsEnabled !== false,
        user_id: (await supabase.auth.getUser()).data.user?.id
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
      return null;
    }
    
    // Convert to the store format
    const formattedQRCode: QRCode = {
      id: newQRCode.id,
      videoId: newQRCode.video_id,
      videoTitle: newQRCode.video_title,
      dateCreated: newQRCode.date_created,
      style: newQRCode.style as unknown as QRCode["style"],
      scans: newQRCode.scans || 0,
      lastScan: newQRCode.last_scan,
      scanHistory: (newQRCode.scan_history as unknown as QRCodeScan[]) || [],
      analyticsEnabled: newQRCode.analytics_enabled || false
    };
    
    toast({
      title: "QR code criado",
      description: "Seu QR code foi adicionado à sua coleção."
    });
    
    return formattedQRCode;
  } catch (error) {
    console.error('Erro ao adicionar QR code:', error);
    return null;
  }
};

// Update an existing QR code
export const updateQRCode = async (id: string, updates: Partial<QRCode>): Promise<boolean> => {
  try {
    // Prepare data for update
    const updateData: any = {};
    
    if (updates.style) updateData.style = updates.style as unknown as Json;
    if (updates.analyticsEnabled !== undefined) updateData.analytics_enabled = updates.analyticsEnabled;
    if (updates.videoTitle) updateData.video_title = updates.videoTitle;
    
    // Update in database
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
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar QR code:', error);
    return false;
  }
};

// Delete a QR code
export const deleteQRCode = async (id: string): Promise<boolean> => {
  try {
    // Delete from database
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
      return false;
    }
    
    toast({
      title: "QR code excluído",
      description: "O QR code foi removido com sucesso."
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir QR code:', error);
    return false;
  }
};

// Increment scan count
export const incrementQRCodeScans = async (id: string, qrCode: QRCode): Promise<{
  success: boolean;
  scanInfo?: QRCodeScan;
}> => {
  try {
    const now = new Date().toISOString();
    const browserInfo = getBrowserInfo();
    const osInfo = getOSInfo();
    const deviceType = getDeviceType();
    
    if (!qrCode) return { success: false };
    
    const scanInfo: QRCodeScan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      browser: browserInfo,
      os: osInfo,
      device: deviceType,
    };
    
    // If analytics is enabled, add to history
    const scanHistory = qrCode.analyticsEnabled 
      ? [...(qrCode.scanHistory || []), scanInfo]
      : qrCode.scanHistory || [];
    
    // Update in database
    const { error } = await supabase
      .from('qr_codes')
      .update({
        scans: qrCode.scans + 1,
        last_scan: now,
        scan_history: qrCode.analyticsEnabled ? (scanHistory as unknown as Json[]) : undefined
      })
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao incrementar escaneamentos:', error);
      return { success: false };
    }
    
    return { 
      success: true,
      scanInfo: qrCode.analyticsEnabled ? scanInfo : undefined
    };
  } catch (error) {
    console.error('Erro ao incrementar escaneamentos:', error);
    return { success: false };
  }
};

// Record scan details
export const recordQRCodeScanDetails = async (
  id: string, 
  qrCode: QRCode | undefined,
  scanDetails: Omit<QRCodeScan, "id" | "timestamp">
): Promise<boolean> => {
  try {
    const now = new Date().toISOString();
    
    if (!qrCode || !qrCode.analyticsEnabled) return false;
    
    const scanInfo: QRCodeScan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      ...scanDetails,
    };
    
    const scanHistory = [...(qrCode.scanHistory || []), scanInfo];
    
    // Update in database
    const { error } = await supabase
      .from('qr_codes')
      .update({
        scan_history: scanHistory as unknown as Json[]
      })
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao registrar detalhes de escaneamento:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao registrar detalhes de escaneamento:', error);
    return false;
  }
};

// Toggle analytics
export const toggleQRCodeAnalytics = async (id: string, enabled: boolean): Promise<boolean> => {
  try {
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
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar configurações de análise:', error);
    return false;
  }
};
