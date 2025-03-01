
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, PauseCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Definição do tipo CameraDevice
export interface CameraDevice {
  id: string;
  label: string;
}

export interface CameraManagerProps {
  onScan: (decodedText: string) => void;
  onCameraInitialized: (isInitialized: boolean) => void;
}

const CameraManager: React.FC<CameraManagerProps> = ({ onScan, onCameraInitialized }) => {
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraId, setCameraId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  
  // Inicialização da câmera
  useEffect(() => {
    console.log("CameraManager montado");
    
    // Esperamos um tempo curto para garantir que o elemento DOM esteja pronto
    const timer = setTimeout(() => {
      initializeCamera();
    }, 300);
    
    return () => {
      clearTimeout(timer);
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(error => {
          console.error("Erro ao parar o scanner:", error);
        });
      }
    };
  }, []);
  
  const initializeCamera = async () => {
    console.log("Inicializando câmeras...");
    setIsLoading(true);
    
    if (!qrReaderRef.current) {
      console.error("Elemento qr-reader ainda não está disponível no DOM");
      setIsLoading(false);
      return;
    }
    
    try {
      // Verificar permissão da câmera
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
      } catch (permError) {
        console.error("Erro de permissão da câmera:", permError);
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
      
      // Tentar obter lista de câmeras
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log("Câmeras disponíveis:", devices);
        
        if (devices && devices.length) {
          setCameras(devices);
          setCameraId(devices[0].id);
          setIsLoading(false);
          
          // Certifique-se de que o elemento existe
          if (qrReaderRef.current) {
            const html5QrCode = new Html5Qrcode(qrReaderRef.current.id);
            setScanner(html5QrCode);
            setIsInitialized(true);
            onCameraInitialized(true);
          } else {
            console.error("Elemento qr-reader não encontrado durante a inicialização do scanner");
            toast({
              title: "Erro de inicialização",
              description: "Não foi possível inicializar o scanner. Tente recarregar a página.",
              variant: "destructive"
            });
          }
        } else {
          console.warn("Nenhuma câmera encontrada");
          toast({
            title: "Câmera não encontrada",
            description: "Não foi possível encontrar uma câmera no seu dispositivo.",
            variant: "destructive"
          });
          setHasPermission(false);
          setIsLoading(false);
        }
      } catch (camError) {
        console.error("Erro ao acessar lista de câmeras:", camError);
        toast({
          title: "Erro ao listar câmeras",
          description: "Não foi possível listar as câmeras disponíveis.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro geral de inicialização:", error);
      setHasPermission(false);
      setIsLoading(false);
    }
  };
  
  // Iniciar escaneamento
  const startScanning = useCallback(async () => {
    if (!cameraId || !scanner) {
      console.error("Câmera ou scanner não disponível");
      toast({
        title: "Câmera não disponível",
        description: "Por favor, verifique as permissões da câmera e tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    if (scanning) {
      console.log("Scanner já está em execução");
      return;
    }
    
    try {
      console.log(`Iniciando scanner com câmera ID: ${cameraId}`);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };
      
      await scanner.start(
        cameraId,
        config,
        (decodedText) => {
          console.log("QR Code detectado:", decodedText);
          onScan(decodedText);
        },
        (errorMessage) => {
          if (errorMessage && typeof errorMessage === 'string' && 
              errorMessage.includes("No MultiFormat Readers were able to detect the code")) {
            return;
          }
          console.log("Erro durante escaneamento:", errorMessage);
        }
      );
      
      setScanning(true);
      console.log("Scanner iniciado com sucesso");
      toast({
        title: "Scanner iniciado",
        description: "Posicione um QR code na área indicada para escanear."
      });
    } catch (error) {
      console.error("Erro ao iniciar o scanner:", error);
      setScanning(false);
      
      toast({
        title: "Erro ao iniciar o scanner",
        description: `Verifique as permissões da câmera. Erro: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  }, [cameraId, scanner, scanning, onScan]);
  
  // Parar escaneamento
  const stopScanning = async () => {
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
        console.log("Scanner parado com sucesso");
        setScanning(false);
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
  
  // Solicitar permissão da câmera
  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        setCameraId(devices[0].id);
        
        // Criar instância do scanner
        const html5QrCode = new Html5Qrcode("qr-reader");
        setScanner(html5QrCode);
        setIsInitialized(true);
        onCameraInitialized(true);
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
  
  // Mudar câmera
  const changeCamera = async (deviceId: string) => {
    if (scanning) {
      await stopScanning();
    }
    
    setCameraId(deviceId);
  };
  
  // Renderização condicional se estiver carregando
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

  // Renderização se não tiver permissão
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
        <Button onClick={requestCameraPermission}>
          <Camera className="mr-2 h-4 w-4" />
          Permitir Acesso
        </Button>
      </div>
    );
  }
  
  // Renderização principal
  return (
    <div className="flex flex-col space-y-4">
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
      
      <div className="relative aspect-square md:aspect-video w-full">
        <div id="camera-container" className="h-full">
          <div 
            id="qr-reader" 
            ref={qrReaderRef}
            className="w-full h-full rounded-lg overflow-hidden"
          ></div>
          
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                <div className="text-primary text-center px-4 py-2 bg-background/80 rounded-md">
                  Posicione o QR Code aqui
                </div>
              </div>
            </div>
          )}
          
          {!scanning && isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-primary rounded-lg">
              <div className="text-center p-4">
                <Camera className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-primary">Clique em "Iniciar Scanner" para ativar a câmera</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center mt-4">
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
      </div>
      
      {!scanning && isInitialized && (
        <div className="mt-4 text-center text-muted-foreground">
          <p>Toque em "Iniciar Scanner" para escanear um QR Code.</p>
          <p className="text-sm mt-1">Posicione o QR Code em frente à câmera para detectá-lo.</p>
        </div>
      )}
    </div>
  );
};

export default CameraManager;
