
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CameraManager from "./CameraManager";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onCameraInitialized: (isInitialized: boolean) => void;
  loadInitialData: () => Promise<void>;
  dataLoaded: boolean;
  forceInitialLoad?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScan, 
  onCameraInitialized,
  loadInitialData,
  dataLoaded,
  forceInitialLoad = false
}) => {
  // Carregar dados quando o componente montar (apenas uma vez)
  useEffect(() => {
    console.log("QRScanner montado - carregar dados iniciais");
    let isMounted = true;
    
    const initializeData = async () => {
      try {
        await loadInitialData();
      } catch (error) {
        console.error("Erro ao inicializar dados:", error);
      }
    };
    
    initializeData();
    
    // Cleanup para evitar atualizar estado em componente desmontado
    return () => {
      isMounted = false;
    };
  }, []);  // Dependências vazias para executar apenas uma vez
  
  return (
    <div className="flex flex-col space-y-4">
      <CameraManager 
        onScan={onScan} 
        onCameraInitialized={onCameraInitialized}
      />
    </div>
  );
};

export default QRScanner;
