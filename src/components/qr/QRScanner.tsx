
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/store/videoStore";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Download, PauseCircle, PlayCircle, RefreshCw } from "lucide-react";
import VideoPlayer from "@/components/video/VideoPlayer";

// Definição do tipo CameraDevice que corresponde ao retorno da biblioteca
interface CameraDevice {
  id: string;
  label: string;
}

interface QRScannerProps {
  onClose: () => void;
  forceInitialLoad?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose, forceInitialLoad = false }) => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [scanDebugInfo, setScanDebugInfo] = useState<string | null>(null);
  const [detailedDebugMode, setDetailedDebugMode] = useState(false);
  
  const { videos, getVideoById, fetchVideos } = useVideoStore();
  const { qrCodes, incrementScans, recordScanDetails, fetchQRCodes } = useQRCodeStore();
  
  // Carrega os QR codes e vídeos novamente ao inicializar o componente
  useEffect(() => {
    if (forceInitialLoad) {
      console.log("Forçando carregamento inicial de QR codes e vídeos");
      fetchQRCodes();
      fetchVideos();
    }
  }, [forceInitialLoad, fetchQRCodes, fetchVideos]);

  // Inicializar o scanner
  useEffect(() => {
    const initializeScanner = async () => {
      setIsLoading(true);
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          setCameraId(devices[0].id);
          setHasPermission(true);
        } else {
          toast({
            title: "Câmera não encontrada",
            description: "Não foi possível encontrar uma câmera no seu dispositivo.",
            variant: "destructive"
          });
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Erro ao acessar a câmera:", error);
        toast({
          title: "Erro ao acessar câmera",
          description: "Verifique se você concedeu permissão para a câmera.",
          variant: "destructive"
        });
        setHasPermission(false);
      } finally {
        setIsLoading(false);
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
      setScanDebugInfo(null);
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        (errorMessage) => {
          // Suprimir logs de depuração durante o escaneamento normal
          if (errorMessage.includes("No MultiFormat Readers were able to detect the code")) {
            // Ignorar silenciosamente - este erro é comum durante o escaneamento
            return;
          }
          console.log(errorMessage);
        }
      );
      
      toast({
        title: "Scanner iniciado",
        description: "Posicione um QR code na área indicada para escanear."
      });
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
      // Log dos QR codes disponíveis
      console.log("QR codes disponíveis para correspondência:", qrCodes);
      console.log("Vídeos disponíveis:", videos);
      
      // Verificar se temos QR codes para comparar
      if (!qrCodes || qrCodes.length === 0) {
        console.error("Nenhum QR code carregado para comparação");
        setScanDebugInfo("Erro: Nenhum QR code está disponível para comparação. Por favor, crie um QR code primeiro.");
        
        toast({
          title: "Nenhum QR code disponível",
          description: "Não há QR codes cadastrados no sistema para comparação.",
          variant: "destructive"
        });
        
        // Reiniciar o scanner
        startScanning();
        return;
      }
      
      // Gerar informações de diagnóstico
      const qrCodesInfo = qrCodes.map(qr => `ID: ${qr.id}, VideoID: ${qr.videoId}, Title: ${qr.videoTitle}`).join('\n');
      const videosInfo = videos.map(v => `ID: ${v.id}, Title: ${v.title}, URL: ${v.url}`).join('\n');
      
      setScanDebugInfo(
        `QR code lido: ${decodedText}\n\n` +
        `QR codes disponíveis (${qrCodes.length}):\n${qrCodesInfo}\n\n` +
        `Vídeos disponíveis (${videos.length}):\n${videosInfo}`
      );
      
      // Tentativa direta com o texto do QR code
      let found = false;
      let qrCode = null;
      
      // Método 1: Correspondência direta com ID
      qrCode = qrCodes.find(qr => qr.id === decodedText);
      if (qrCode) {
        console.log("Método 1: QR code encontrado por ID exato");
        found = true;
      }
      
      // Método 2: Correspondência com videoId
      if (!found) {
        qrCode = qrCodes.find(qr => qr.videoId === decodedText);
        if (qrCode) {
          console.log("Método 2: QR code encontrado por videoId exato");
          found = true;
        }
      }
      
      // Método 3: QR code contém ID ou ID contém QR code
      if (!found) {
        qrCode = qrCodes.find(qr => 
          decodedText.includes(qr.id) || 
          qr.id.includes(decodedText)
        );
        if (qrCode) {
          console.log("Método 3: QR code encontrado por correspondência parcial de ID");
          found = true;
        }
      }
      
      // Método 4: URL com formato específico
      if (!found && decodedText.includes('/ar/')) {
        const parts = decodedText.split('/ar/');
        const potentialId = parts[parts.length - 1];
        
        qrCode = qrCodes.find(qr => 
          qr.id === potentialId || 
          potentialId.includes(qr.id) || 
          qr.id.includes(potentialId)
        );
        
        if (qrCode) {
          console.log("Método 4: QR code encontrado em URL /ar/");
          found = true;
        }
      }
      
      // Método 5: Formato qr-XXXX
      if (!found && decodedText.startsWith('qr-')) {
        const cleanId = decodedText.replace('qr-', '');
        qrCode = qrCodes.find(qr => 
          qr.id === cleanId || 
          qr.id.includes(cleanId) || 
          cleanId.includes(qr.id)
        );
        
        if (qrCode) {
          console.log("Método 5: QR code encontrado em formato qr-XXXX");
          found = true;
        }
      }
      
      // Método 6: Última tentativa - qualquer correspondência parcial
      if (!found) {
        // Verifica cada QR code contra o texto decodificado
        for (const qr of qrCodes) {
          // Compara IDs
          if (qr.id.toLowerCase().includes(decodedText.toLowerCase()) || 
              decodedText.toLowerCase().includes(qr.id.toLowerCase())) {
            qrCode = qr;
            console.log("Método 6: QR code encontrado por correspondência parcial de texto");
            found = true;
            break;
          }
          
          // Compara videoId
          if (qr.videoId.toLowerCase().includes(decodedText.toLowerCase()) || 
              decodedText.toLowerCase().includes(qr.videoId.toLowerCase())) {
            qrCode = qr;
            console.log("Método 6: QR code encontrado por correspondência parcial de videoId");
            found = true;
            break;
          }
        }
      }
      
      // Se encontramos um QR code correspondente
      if (qrCode) {
        console.log("QR code encontrado:", qrCode);
        setScanDebugInfo(prev => `${prev}\n\nQR code encontrado: ID=${qrCode?.id}, VideoID=${qrCode?.videoId}`);
        
        // Verificar se o videoId existe
        if (!qrCode.videoId) {
          console.error("QR code não tem videoId associado");
          setScanDebugInfo(prev => `${prev}\nERRO: QR code não tem videoId associado.`);
          
          toast({
            title: "QR Code incompleto",
            description: "Este QR code não tem um vídeo associado.",
            variant: "destructive"
          });
          
          startScanning();
          return;
        }
        
        // Verificar diretamente se existe algum vídeo com esse ID
        const videoExists = videos.some(v => v.id === qrCode?.videoId);
        console.log(`Verificação direta do videoId ${qrCode.videoId}: ${videoExists ? 'Encontrado' : 'Não encontrado'}`);
        setScanDebugInfo(prev => `${prev}\nVerificação direta do videoId: ${videoExists ? 'Encontrado' : 'Não encontrado'}`);
        
        const video = getVideoById(qrCode.videoId);
        
        if (video) {
          console.log("Vídeo encontrado:", video);
          setScanDebugInfo(prev => `${prev}\nVídeo encontrado: ${video.title}`);
          
          // Verificar se a URL do vídeo é válida
          if (!video.url) {
            console.error("Vídeo encontrado, mas sem URL");
            setScanDebugInfo(prev => `${prev}\nERRO: O vídeo não possui URL.`);
            
            toast({
              title: "Vídeo sem URL",
              description: "O vídeo associado a este QR code não possui URL para reprodução.",
              variant: "destructive"
            });
            
            startScanning();
            return;
          }
          
          setScannedVideo({
            url: video.url,
            title: video.title
          });
          
          // Incrementar contagem de escaneamentos
          incrementScans(qrCode.id);
          
          // Registrar detalhes do escaneamento
          if (qrCode.analyticsEnabled) {
            recordScanDetails(qrCode.id, {});
          }
          
          toast({
            title: "QR Code reconhecido!",
            description: `Exibindo vídeo: ${video.title}`
          });
          
          // Iniciar reprodução automática do vídeo
          setVideoPlaying(true);
          return;
        } else {
          console.error("Vídeo não encontrado para o QR code:", qrCode.videoId);
          setScanDebugInfo(prev => `${prev}\nERRO: Vídeo não encontrado para o QR code: VideoID=${qrCode.videoId}`);
          
          // Verificar se existem vídeos no sistema
          console.log("Vídeos disponíveis:", videos);
          setScanDebugInfo(prev => `${prev}\nVídeos disponíveis: ${videos.length}`);
          
          toast({
            title: "Vídeo não encontrado",
            description: "O vídeo associado a este QR code não foi encontrado. O videoId pode estar incorreto ou o vídeo pode ter sido removido.",
            variant: "destructive"
          });
        }
      } else {
        console.log("QR code não encontrado:", decodedText);
        setScanDebugInfo(prev => `${prev}\n\nNenhum QR code correspondente encontrado`);
        
        toast({
          title: "QR Code não reconhecido",
          description: "Este QR code não corresponde a nenhum dos vídeos cadastrados.",
          variant: "destructive"
        });
      }
      
      // Reiniciar o scanner
      startScanning();
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
      setScanDebugInfo(`Erro ao processar QR code: ${error.message || 'Erro desconhecido'}`);
      
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

  // Solicitar permissão de câmera novamente
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      // Reiniciar o processo de detecção de câmeras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        setCameraId(devices[0].id);
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão da câmera:", error);
      toast({
        title: "Permissão negada",
        description: "Você precisa conceder permissão para a câmera para usar o scanner.",
        variant: "destructive"
      });
    }
  };
  
  // Exportar informações de diagnóstico
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
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin mb-4">
          <RefreshCw className="h-8 w-8 text-primary" />
        </div>
        <p className="text-center text-muted-foreground">
          Inicializando câmera...
        </p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center mb-4">
          <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Permissão da Câmera Necessária</h3>
          <p className="text-muted-foreground mb-4">
            Para escanear QR codes, você precisa permitir o acesso à câmera do seu dispositivo.
          </p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={requestCameraPermission}>
            <Camera className="mr-2 h-4 w-4" />
            Permitir Acesso
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-4">
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
      <div className="relative aspect-square md:aspect-video w-full">
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
            className="w-full sm:w-auto"
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
          <div className="flex flex-col sm:flex-row w-full space-y-2 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => {
                setScannedVideo(null);
                startScanning();
              }}
            >
              <Camera className="mr-2 h-5 w-5" />
              Escanear novamente
            </Button>
            <Button 
              variant={videoPlaying ? "destructive" : "default"}
              className="w-full sm:w-auto"
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

      {/* Área de debug - será útil para solucionar problemas de reconhecimento */}
      {scanDebugInfo && (
        <div className="mt-4 p-3 bg-muted rounded-md text-sm">
          <div className="flex justify-between items-center mb-1">
            <p className="font-medium">Informações de diagnóstico:</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={exportDebugInfo}
              disabled={!scanDebugInfo}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-xs">{scanDebugInfo}</pre>
        </div>
      )}

      {/* Ferramentas de diagnóstico */}
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">Ferramentas de diagnóstico:</p>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Mostrar os QR codes cadastrados
              const testInfo = qrCodes.map(qr => `ID: ${qr.id}, VideoID: ${qr.videoId}, Title: ${qr.videoTitle}`).join('\n');
              const videosInfo = videos.map(v => `ID: ${v.id}, Title: ${v.title}, URL: ${v.url}`).join('\n');
              
              setScanDebugInfo(
                `QR codes cadastrados (${qrCodes.length}):\n${testInfo}\n\n` +
                `Vídeos disponíveis (${videos.length}):\n${videosInfo}`
              );
            }}
          >
            Verificar QR Codes e Vídeos
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              // Recarregar os QR codes e vídeos do banco de dados
              await fetchQRCodes();
              await fetchVideos();
              
              toast({
                title: "Dados recarregados",
                description: `Foram carregados ${qrCodes.length} QR codes e ${videos.length} vídeos do banco de dados.`
              });
            }}
          >
            Recarregar Todos os Dados
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="col-span-2"
            onClick={() => setDetailedDebugMode(!detailedDebugMode)}
          >
            {detailedDebugMode ? "Ocultar IDs completos" : "Mostrar IDs completos"}
          </Button>
          
          {detailedDebugMode && (
            <div className="col-span-2 text-xs p-2 bg-muted rounded-md mt-2">
              <p className="font-medium mb-1">IDs Completos:</p>
              <div>
                <p className="font-medium">QR Codes:</p>
                <ul className="list-disc pl-5">
                  {qrCodes.map(qr => (
                    <li key={qr.id}>
                      ID: {qr.id} | VideoID: {qr.videoId}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2">
                <p className="font-medium">Vídeos:</p>
                <ul className="list-disc pl-5">
                  {videos.map(v => (
                    <li key={v.id}>
                      ID: {v.id} | URL: {v.url}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
