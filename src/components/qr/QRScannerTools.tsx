
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

interface QRScannerToolsProps {
  scanDebugInfo: string | null;
  onExportDebugInfo: () => void;
  onForceDataReload: () => void;
}

const QRScannerTools: React.FC<QRScannerToolsProps> = ({
  scanDebugInfo,
  onExportDebugInfo,
  onForceDataReload
}) => {
  return (
    <div className="space-y-4">
      {scanDebugInfo && (
        <div className="mt-4 p-3 bg-muted rounded-md text-sm">
          <div className="flex justify-between items-center mb-1">
            <p className="font-medium">Informações de diagnóstico:</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onExportDebugInfo}
              disabled={!scanDebugInfo}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-xs">{scanDebugInfo}</pre>
        </div>
      )}

      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onForceDataReload}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar QR Codes e Vídeos
        </Button>
      </div>
    </div>
  );
};

export default QRScannerTools;
