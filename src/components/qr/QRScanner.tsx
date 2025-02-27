
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/store/videoStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, PauseCircle, PlayCircle } from "lucide-react";
import VideoPlayer from "@/components/video/VideoPlayer";

// Definição do tipo CameraDevice que corresponde ao retorno da biblioteca
interface CameraDevice {
  id: string;
  label: string;
}

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedVideo, setScannedVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [cameraId, setCameraId] = useState<string>("");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  
  const { videos, getVideoById } = useVideoStore();
  const { qrCodes, incrementScans, recordScanDetails } = useQRCodeStore();
  
  // Inicializar o scanner
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          setCameraId(devices[0].id);
        } else {
          toast({
            title: "Câmera não encontrada",
            description: "Não foi possível encontrar uma câmera no seu dispositivo.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao acessar a câmera:", error);
        toast({
          title: "Erro ao acessar câmera",
          description: "Verifique se você concedeu permissão para a câmera.",
          variant: "destructive"
        });
      }
    };

    initializeScanner();
    
    // Limpar o scanner quando o componente for desmontado
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(error => {
          console.error("Erro ao parar o scanner:", error);
        });
      }
    };
  }, []);
  
  // Iniciar o escaneamento
  const startScanning = async () => {
    if (!cameraId) {
      toast({
        title: "Câmera não selecionada",
        description: "Por favor, selecione uma câmera para iniciar o escaneamento.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      setScanning(true);
      setScannedVideo(null);
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        (errorMessage) => {
          // Ignorar erros de decodificação durante o escaneamento
          console.log(errorMessage);
        }
      );
    } catch (error) {
      console.error("Erro ao iniciar o scanner:", error);
      setScanning(false);
      toast({
        title: "Erro ao iniciar o scanner",
        description: "Verifique se você concedeu permissão para a câmera.",
        variant: "destructive"
      });
    }
  };
  
  // Parar o escaneamento
  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (error) {
        console.error("Erro ao parar o scanner:", error);
      }
    }
  };
  
  // Tratar o resultado do escaneamento
  const handleSuccessfulScan = (decodedText: string) => {
    // Parar o escaneamento após detectar um QR code
    stopScanning();
    
    console.log("QR Code escaneado:", decodedText);
    
    // Verificar se o QR code corresponde a algum dos nossos QR codes
    try {
      // Tentar extrair o ID do QR code da URL escaneada
      let qrCodeId;
      
      // Verificar diferentes padrões de URL possíveis
      if (decodedText.includes('/ar/')) {
        // Formato: .../ar/qr-123456789
        const parts = decodedText.split('/ar/');
        qrCodeId = parts[parts.length - 1];
      } else if (decodedText.startsWith('qr-')) {
        // Formato: qr-123456789
        qrCodeId = decodedText;
      } else {
        // Tentar encontrar qualquer padrão que corresponda a qr-seguido de números
        const match = decodedText.match(/qr-\d+/);
        qrCodeId = match ? match[0] : null;
      }
      
      // Se encontramos um ID, verificar se ele existe na nossa lista
      if (qrCodeId) {
        const qrCode = qrCodes.find(qr => qr.id === qrCodeId);
        
        if (qrCode) {
          const video = getVideoById(qrCode.videoId);
          
          if (video) {
            setScannedVideo({
              url: video.url,
              title: video.title
            });
            
            // Incrementar contagem de escaneamentos
            incrementScans(qrCodeId);
            
            // Registrar detalhes do escaneamento
            if (qrCode.analyticsEnabled) {
              recordScanDetails(qrCodeId, {});
            }
            
            toast({
              title: "QR Code reconhecido!",
              description: `Exibindo vídeo: ${video.title}`
            });
            
            // Iniciar reprodução automática do vídeo
            setVideoPlaying(true);
            return;
          }
        }
      }
      
      // Se chegou aqui, o QR code não foi reconhecido como um dos nossos
      toast({
        title: "QR Code não reconhecido",
        description: "Este QR code não corresponde a nenhum dos vídeos cadastrados.",
        variant: "destructive"
      });
      
      // Reiniciar o scanner
      startScanning();
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      toast({
        title: "Erro ao processar QR Code",
        description: "Ocorreu um erro ao tentar processar o QR code escaneado.",
        variant: "destructive"
      });
      
      // Reiniciar o scanner
      startScanning();
    }
  };
  
  // Alternar entre câmeras (se houver múltiplas)
  const changeCamera = async (deviceId: string) => {
    if (scanning) {
      await stopScanning();
    }
    
    setCameraId(deviceId);
    
    // Reiniciar o scanner com a nova câmera
    if (scanning) {
      setTimeout(() => startScanning(), 500);
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">Scanner de QR Code</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      {/* Seletor de câmera */}
      {cameras.length > 1 && (
        <div className="mb-4">
          <label htmlFor="camera-select" className="block text-sm font-medium mb-2">
            Selecione a câmera:
          </label>
          <select
            id="camera-select"
            className="bg-background border border-input rounded-md w-full p-2"
            value={cameraId}
            onChange={(e) => changeCamera(e.target.value)}
            disabled={scanning}
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Câmera ${camera.id.substring(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Área de visualização da câmera */}
      <div className="relative aspect-video">
        {!scannedVideo ? (
          <div className="h-full">
            {/* Elemento onde o scanner será renderizado */}
            <div 
              id="qr-reader" 
              className="w-full h-full rounded-lg overflow-hidden"
            ></div>
            
            {/* Instrução para posicionar o QR code */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                  <div className="text-primary text-center px-4 py-2 bg-background/80 rounded-md">
                    Posicione o QR Code aqui
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div ref={videoContainerRef} className="w-full h-full relative bg-black rounded-lg overflow-hidden">
            {/* Exibir o vídeo escaneado */}
            <VideoPlayer
              videoUrl={scannedVideo.url}
              autoPlay={videoPlaying}
              loop={true}
              controls={true}
              className="w-full h-full object-contain"
              onLoadedData={() => setVideoPlaying(true)}
            />
            
            {/* Informações do vídeo */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
              <h3 className="text-white font-medium text-lg">{scannedVideo.title}</h3>
            </div>
          </div>
        )}
      </div>
      
      {/* Controles */}
      <div className="flex justify-center mt-4 space-x-4">
        {!scannedVideo ? (
          <Button
            className="w-40"
            onClick={scanning ? stopScanning : startScanning}
            variant={scanning ? "destructive" : "default"}
          >
            {scanning ? (
              <>
                <PauseCircle className="mr-2 h-5 w-5" />
                Parar Scanner
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Iniciar Scanner
              </>
            )}
          </Button>
        ) : (
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => {
              setScannedVideo(null);
              startScanning();
            }}>
              <Camera className="mr-2 h-5 w-5" />
              Escanear novamente
            </Button>
            <Button 
              variant={videoPlaying ? "destructive" : "default"}
              onClick={() => setVideoPlaying(!videoPlaying)}
            >
              {videoPlaying ? (
                <>
                  <PauseCircle className="mr-2 h-5 w-5" />
                  Pausar
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Reproduzir
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Mensagem de instrução */}
      {!scannedVideo && !scanning && (
        <div className="mt-4 text-center text-muted-foreground">
          <p>Toque em "Iniciar Scanner" para escanear um QR Code.</p>
          <p className="text-sm mt-1">Posicione o QR Code em frente à câmera para detectá-lo.</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
