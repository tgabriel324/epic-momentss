
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/store/videoStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import CameraManager from "./CameraManager";
import QRScanResult from "./QRScanResult";
import QRScannerTools from "./QRScannerTools";

interface QRScannerProps {
  onClose: () => void;
  forceInitialLoad?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose, forceInitialLoad = false }) => {
  const [scannedVideo, setScannedVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [scanDebugInfo, setScanDebugInfo] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const { videos, getVideoById, fetchVideos } = useVideoStore();
  const { qrCodes, incrementScans, recordScanDetails, fetchQRCodes } = useQRCodeStore();
  
  // Carregar dados quando o componente montar
  useEffect(() => {
    console.log("QRScanner montado - carregar dados iniciais");
    
    const loadInitialData = async () => {
      try {
        if (!dataLoaded || forceInitialLoad) {
          console.log("Carregando dados iniciais...");
          await Promise.all([
            fetchQRCodes(),
            fetchVideos()
          ]);
          setDataLoaded(true);
          console.log(`Dados carregados: ${qrCodes.length} QR codes, ${videos.length} vídeos`);
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os QR codes e vídeos.",
          variant: "destructive"
        });
      }
    };
    
    loadInitialData();
  }, [fetchQRCodes, fetchVideos, forceInitialLoad, qrCodes.length, videos.length, dataLoaded]);
  
  // Função para processar o escaneamento do QR code
  const handleScan = (decodedText: string) => {
    console.log("QR Code escaneado:", decodedText);
    console.log("QR codes disponíveis:", qrCodes);
    console.log("Vídeos disponíveis:", videos);
    
    if (!qrCodes || qrCodes.length === 0) {
      console.error("Nenhum QR code carregado para comparação");
      toast({
        title: "Nenhum QR code disponível",
        description: "Não há QR codes cadastrados no sistema para comparação.",
        variant: "destructive"
      });
      return;
    }
    
    let qrCode = qrCodes.find(qr => qr.id === decodedText);
    
    if (!qrCode) {
      qrCode = qrCodes.find(qr => 
        decodedText.includes(qr.id) || 
        qr.id.includes(decodedText)
      );
    }
    
    if (!qrCode && decodedText.includes('/ar/')) {
      const parts = decodedText.split('/ar/');
      const potentialId = parts[parts.length - 1];
      
      qrCode = qrCodes.find(qr => 
        qr.id === potentialId || 
        potentialId.includes(qr.id) || 
        qr.id.includes(potentialId)
      );
    }
    
    if (qrCode) {
      console.log("QR code encontrado:", qrCode);
      
      if (!qrCode.videoId) {
        toast({
          title: "QR Code incompleto",
          description: "Este QR code não tem um vídeo associado.",
          variant: "destructive"
        });
        return;
      }
      
      const videoExists = videos.some(v => v.id === qrCode?.videoId);
      console.log(`Verificação do videoId ${qrCode.videoId}: ${videoExists ? 'Encontrado' : 'Não encontrado'}`);
      
      const video = getVideoById(qrCode.videoId);
      
      if (video && video.url) {
        console.log("Vídeo encontrado:", video);
        
        setScannedVideo({
          url: video.url,
          title: video.title
        });
        
        incrementScans(qrCode.id);
        if (qrCode.analyticsEnabled) {
          recordScanDetails(qrCode.id, {});
        }
        
        toast({
          title: "QR Code reconhecido!",
          description: `Exibindo vídeo: ${video.title}`
        });
        
        setVideoPlaying(true);
      } else {
        console.error("Vídeo não encontrado para o QR code:", qrCode.videoId);
        setScanDebugInfo(`QR code encontrado (ID: ${qrCode.id}), mas o vídeo associado (VideoID: ${qrCode.videoId}) não foi encontrado.
        
Vídeos disponíveis (${videos.length}):
${videos.map(v => `- ${v.title} (ID: ${v.id})`).join('\n')}`);
        
        toast({
          title: "Vídeo não encontrado",
          description: "O vídeo associado a este QR code não foi encontrado. O ID pode estar incorreto ou o vídeo foi removido.",
          variant: "destructive"
        });
      }
    } else {
      console.log("QR code não encontrado:", decodedText);
      setScanDebugInfo(`QR code lido (${decodedText}) não corresponde a nenhum QR code cadastrado.
      
QR codes disponíveis (${qrCodes.length}):
${qrCodes.map(qr => `- ${qr.videoTitle} (ID: ${qr.id})`).join('\n')}`);
      
      toast({
        title: "QR Code não reconhecido",
        description: "Este QR code não corresponde a nenhum dos QR codes cadastrados.",
        variant: "destructive"
      });
    }
  };
  
  // Funções de ferramenta
  const exportDebugInfo = () => {
    if (!scanDebugInfo) return;
    
    const debugData = {
      timestamp: new Date().toISOString(),
      qrCodes: qrCodes,
      videos: videos,
      scanInfo: scanDebugInfo
    };
    
    const dataStr = JSON.stringify(debugData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `qr-scanner-debug-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Informações exportadas",
      description: "As informações de diagnóstico foram exportadas com sucesso."
    });
  };
  
  const forceDataReload = async () => {
    try {
      const qrPromise = fetchQRCodes();
      const videoPromise = fetchVideos();
      
      await Promise.all([qrPromise, videoPromise]);
      
      toast({
        title: "Dados recarregados",
        description: `${qrCodes.length} QR codes e ${videos.length} vídeos carregados do banco de dados.`
      });
      
      setScanDebugInfo(`Dados recarregados com sucesso:
- QR Codes: ${qrCodes.length}
- Vídeos: ${videos.length}

Exemplos de QR codes:
${qrCodes.slice(0, 3).map(qr => `- ${qr.videoTitle} (ID: ${qr.id.substring(0, 8)}..., VideoID: ${qr.videoId.substring(0, 8)}...)`).join('\n')}

Exemplos de vídeos:
${videos.slice(0, 3).map(v => `- ${v.title} (ID: ${v.id.substring(0, 8)}..., URL: ${v.url ? '✓' : '✗'})`).join('\n')}`);
    } catch (error) {
      console.error("Erro ao recarregar dados:", error);
      toast({
        title: "Erro ao recarregar dados",
        description: "Ocorreu um erro ao tentar recarregar os dados. Verifique a conexão com o banco de dados.",
        variant: "destructive"
      });
    }
  };
  
  // Função para reiniciar o escaneamento
  const handleScanAgain = () => {
    setScannedVideo(null);
    setVideoPlaying(false);
  };
  
  return (
    <div className="flex flex-col space-y-4">
      {!cameraInitialized && !scannedVideo && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      )}
      
      {!scannedVideo ? (
        <CameraManager 
          onScan={handleScan} 
          onCameraInitialized={setCameraInitialized}
        />
      ) : (
        <QRScanResult 
          scannedVideo={scannedVideo}
          videoPlaying={videoPlaying}
          setVideoPlaying={setVideoPlaying}
          onScanAgain={handleScanAgain}
        />
      )}
      
      <QRScannerTools 
        scanDebugInfo={scanDebugInfo}
        onExportDebugInfo={exportDebugInfo}
        onForceDataReload={forceDataReload}
      />
    </div>
  );
};

export default QRScanner;
