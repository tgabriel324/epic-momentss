
import { Json } from "@/integrations/supabase/types";

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

export const defaultQRStyle: QRCodeStyle = {
  foreground: "#000000",
  background: "#ffffff",
  cornerRadius: 0,
  size: 200,
};
