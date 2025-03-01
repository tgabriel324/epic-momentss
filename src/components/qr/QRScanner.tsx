
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
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
  const [scanInitialized, setScanInitialized] = useState(false);
  const initializingRef = useRef(false);
  
  const { videos, getVideoById } = useVideoStore();
  const { qrCodes, incrementScans, recordScanDetails } = useQRCodeStore();
  
  // Carregamento único dos dados
  useEffect(() => {
    // Não fazemos nada aqui para evitar ciclos - os dados já estão carregados na QRScannerPage
    console.log("QRScanner montado");
    
    return () => {
      console.log("QRScanner desmontado");
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(error => {
          console.error("Erro ao parar o scanner:", error);
        });
      }
    };
  }, []);
  
  // Iniciar o escaneamento
  const startScanning = useCallback(async (camId = cameraId) => {
    if (!camId) {
      console.error("Nenhuma câmera selecionada para iniciar o scanner");
      toast({
        title: "Câmera não selecionada",
        description: "Por favor, selecione uma câmera para iniciar o escaneamento.",
        variant: "destructive"
      });
      return;
    }
    
    // Se já estiver escaneando, não inicie novamente
    if (scanning) {
      console.log("Scanner já está em execução, ignorando solicitação de início");
      return;
    }
    
    // Se o scanner já estiver em execução, pare-o primeiro
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        console.log("Scanner anterior parado com sucesso");
      } catch (error) {
        console.error("Erro ao parar o scanner existente:", error);
      }
    }
    
    try {
      console.log(`Iniciando scanner com câmera ID: ${camId}`);
      
      // Certifique-se de que o elemento existe
      const scannerElement = document.getElementById("qr-reader");
      if (!scannerElement) {
        console.error("Elemento #qr-reader não encontrado no DOM");
        toast({
          title: "Erro ao iniciar scanner",
          description: "Elemento do scanner não encontrado.",
          variant: "destructive"
        });
        return;
      }
      
      // Criar nova instância do scanner
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      // Atualizar estado antes da inicialização
      setScanning(true);
      setScannedVideo(null);
      setScanInitialized(true);
      
      // Configurações do scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false, // Permitir processamento de QR codes em qualquer orientação
      };
      
      // Iniciar o scanner
      await html5QrCode.start(
        camId,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        (errorMessage) => {
          // Suprimir logs de depuração durante o escaneamento normal
          if (errorMessage && typeof errorMessage === 'string' && 
              errorMessage.includes("No MultiFormat Readers were able to detect the code")) {
            return;
          }
          console.log("Mensagem de erro durante escaneamento:", errorMessage);
        }
      );
      
      console.log("Scanner iniciado com sucesso");
      toast({
        title: "Scanner iniciado",
        description: "Posicione um QR code na área indicada para escanear."
      });
    } catch (error) {
      console.error("Erro ao iniciar o scanner:", error);
      setScanning(false);
      setScanInitialized(false);
      
      // Mensagem mais descritiva com detalhes do erro
      toast({
        title: "Erro ao iniciar o scanner",
        description: `Verifique as permissões da câmera. Erro: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  }, [cameraId, scanning, toast]);
  
  // Parar o escaneamento
  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        console.log("Scanner parado com sucesso");
        setScanning(false);
        setScanInitialized(false);
      } catch (error) {
        console.error("Erro ao parar o scanner:", error);
        toast({
          title: "Erro ao parar scanner",
          description: "Não foi possível parar o scanner corretamente.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Inicialização da câmera - separado do useEffect principal
  useEffect(() => {
    // Evitar inicialização duplicada
    if (initializingRef.current) {
      console.log("Inicialização já em andamento, ignorando");
      return;
    }
    
    // Marcar como em inicialização
    initializingRef.current = true;
    
    const initializeScanner = async () => {
      console.log("Iniciando processo de inicialização da câmera...");
      setIsLoading(true);
      
      try {
        // Solicitar permissão para a câmera
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setHasPermission(true);
        } catch (permError) {
          console.error("Erro de permissão da câmera:", permError);
          setHasPermission(false);
          setIsLoading(false);
          initializingRef.current = false;
          return;
        }
        
        // Tentar obter a lista de câmeras
        try {
          const devices = await Html5Qrcode.getCameras();
          console.log("Câmeras disponíveis:", devices);
          
          if (devices && devices.length) {
            setCameras(devices);
            setCameraId(devices[0].id);
            
            // Iniciar scanner com atraso para garantir que o DOM esteja pronto
            setTimeout(() => {
              startScanning(devices[0].id);
              setIsLoading(false);
              initializingRef.current = false;
            }, 1000);
          } else {
            console.warn("Nenhuma câmera encontrada");
            toast({
              title: "Câmera não encontrada",
              description: "Não foi possível encontrar uma câmera no seu dispositivo.",
              variant: "destructive"
            });
            setHasPermission(false);
            setIsLoading(false);
            initializingRef.current = false;
          }
        } catch (camError) {
          console.error("Erro ao acessar lista de câmeras:", camError);
          toast({
            title: "Erro ao listar câmeras",
            description: "Não foi possível listar as câmeras disponíveis.",
            variant: "destructive"
          });
          setIsLoading(false);
          initializingRef.current = false;
        }
      } catch (error) {
        console.error("Erro geral de inicialização:", error);
        setHasPermission(false);
        setIsLoading(false);
        initializingRef.current = false;
      }
    };
    
    initializeScanner();
  }, [startScanning, toast]);
  
  // Lógica de processamento do QR code
  const handleSuccessfulScan = (decodedText: string) => {
    // Parar o escaneamento após detectar um QR code
    stopScanning();
    
    console.log("QR Code escaneado:", decodedText);
    console.log("QR codes disponíveis:", qrCodes);
    console.log("Vídeos disponíveis:", videos);
    
    // Verificar se existem QR codes para comparar
    if (!qrCodes || qrCodes.length === 0) {
      console.error("Nenhum QR code carregado para comparação");
      toast({
        title: "Nenhum QR code disponível",
        description: "Não há QR codes cadastrados no sistema para comparação.",
        variant: "destructive"
      });
      startScanning();
      return;
    }
    
    // Primeiro método: verificação direta pelo ID completo
    let qrCode = qrCodes.find(qr => qr.id === decodedText);
    
    // Segundo método: verificação por conteúdo parcial
    if (!qrCode) {
      qrCode = qrCodes.find(qr => 
        decodedText.includes(qr.id) || 
        qr.id.includes(decodedText)
      );
    }
    
    // Terceiro método: verificação por URL em formato específico
    if (!qrCode && decodedText.includes('/ar/')) {
      const parts = decodedText.split('/ar/');
      const potentialId = parts[parts.length - 1];
      
      qrCode = qrCodes.find(qr => 
        qr.id === potentialId || 
        potentialId.includes(qr.id) || 
        qr.id.includes(potentialId)
      );
    }
    
    // Se encontramos um QR code correspondente
    if (qrCode) {
      console.log("QR code encontrado:", qrCode);
      
      // Verificação da existência do vídeo
      if (!qrCode.videoId) {
        toast({
          title: "QR Code incompleto",
          description: "Este QR code não tem um vídeo associado.",
          variant: "destructive"
        });
        startScanning();
        return;
      }
      
      // Verificar se o videoId existe na lista de vídeos
      const videoExists = videos.some(v => v.id === qrCode?.videoId);
      console.log(`Verificação do videoId ${qrCode.videoId}: ${videoExists ? 'Encontrado' : 'Não encontrado'}`);
      
      // Tentar obter o vídeo pelo ID
      const video = getVideoById(qrCode.videoId);
      
      if (video && video.url) {
        console.log("Vídeo encontrado:", video);
        
        // Exibir o vídeo
        setScannedVideo({
          url: video.url,
          title: video.title
        });
        
        // Registrar o escaneamento
        incrementScans(qrCode.id);
        if (qrCode.analyticsEnabled) {
          recordScanDetails(qrCode.id, {});
        }
        
        toast({
          title: "QR Code reconhecido!",
          description: `Exibindo vídeo: ${video.title}`
        });
        
        // Iniciar reprodução automática
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
        
        // Reiniciar o scanner
        startScanning();
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
      
      // Reiniciar o scanner
      startScanning();
    }
  };
  
  // Alternar entre câmeras
  const changeCamera = async (deviceId: string) => {
    if (scanning) {
      await stopScanning();
    }
    
    setCameraId(deviceId);
    
    // Iniciar scanner com a nova câmera após um breve intervalo
    setTimeout(() => startScanning(deviceId), 500);
  };

  // Solicitar permissão de câmera
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      
      // Reiniciar processo de inicialização
      initializingRef.current = false;
      
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        setCameraId(devices[0].id);
        
        // Iniciar scanner automaticamente após obter permissão
        setTimeout(() => startScanning(devices[0].id), 500);
      } else {
        toast({
          title: "Nenhuma câmera encontrada",
          description: "Seu dispositivo não possui câmeras disponíveis.",
          variant: "destructive"
        });
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
  
  // Forçar recarregamento dos dados
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
      {cameras.length > 0 && (
        <div className="mb-4">
          <label htmlFor="camera-select" className="block text-sm font-medium mb-2">
            Selecione a câmera:
          </label>
          <select
            id="camera-select"
            className="bg-background border border-input rounded-md w-full p-2"
            value={cameraId}
            onChange={(e) => changeCamera(e.target.value)}
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
            
            {/* Mensagem quando o scanner não está inicializado */}
            {!scanning && !scanInitialized && (
              <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-primary rounded-lg">
                <div className="text-center p-4">
                  <Camera className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-primary">Clique em "Iniciar Scanner" para ativar a câmera</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full relative bg-black rounded-lg overflow-hidden">
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
            onClick={scanning ? stopScanning : () => startScanning()}
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
      {!scannedVideo && !scanning && !scanInitialized && (
        <div className="mt-4 text-center text-muted-foreground">
          <p>Toque em "Iniciar Scanner" para escanear um QR Code.</p>
          <p className="text-sm mt-1">Posicione o QR Code em frente à câmera para detectá-lo.</p>
        </div>
      )}

      {/* Área de debug */}
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
      <div className="mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={forceDataReload}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar QR Codes e Vídeos
        </Button>
      </div>
    </div>
  );
};

export default QRScanner;
