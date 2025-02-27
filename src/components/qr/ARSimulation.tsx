
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQRCodeStore, QRCode } from "@/store/qrCodeStore";
import { useVideoStore } from "@/store/videoStore";
import { QRCodeSVG } from "qrcode.react";
import { Camera, Smartphone, Scan, ArrowLeft } from "lucide-react";
import VideoPlayer from "@/components/video/VideoPlayer";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ARSimulationProps {
  qrCode: QRCode;
  onClose: () => void;
}

const ARSimulation: React.FC<ARSimulationProps> = ({ qrCode, onClose }) => {
  const { getVideoById } = useVideoStore();
  const { incrementScans, recordScanDetails } = useQRCodeStore();
  const video = getVideoById(qrCode.videoId);
  
  const [step, setStep] = useState<"scan" | "processing" | "ar">("scan");
  const [progress, setProgress] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // URL única para AR (simulada)
  const arUrl = `https://epicmoments.app/ar/${qrCode.id}`;
  
  // Simular o processamento de escaneamento
  useEffect(() => {
    if (step === "processing") {
      let progressValue = 0;
      const interval = setInterval(() => {
        progressValue += 10;
        if (progressValue >= 100) {
          clearInterval(interval);
          setProgress(100);
          
          // Simular o carregamento do vídeo
          setTimeout(() => {
            setStep("ar");
            incrementScans(qrCode.id);
            
            // Registrar detalhes simulados
            if (qrCode.analyticsEnabled) {
              try {
                // Tentar obter localização
                fetch('https://ipapi.co/json/')
                  .then(res => res.json())
                  .then(data => {
                    recordScanDetails(qrCode.id, {
                      location: {
                        country: data.country_name,
                        city: data.city,
                      }
                    });
                  })
                  .catch(() => {
                    // Fallback se a localização não for disponível
                    recordScanDetails(qrCode.id, {});
                  });
              } catch (error) {
                console.error("Erro ao registrar detalhes:", error);
              }
            }
            
            toast({
              title: "QR Code escaneado",
              description: "Experiência de AR iniciada com sucesso."
            });
          }, 500);
        } else {
          setProgress(progressValue);
        }
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [step, qrCode.id, incrementScans, recordScanDetails, qrCode.analyticsEnabled]);
  
  // Iniciar o escaneamento
  const handleStartScan = () => {
    setIsCameraActive(true);
    
    // Simular o escaneamento
    setTimeout(() => {
      setStep("processing");
    }, 1500);
  };
  
  if (!video) {
    return (
      <div className="text-center p-8">
        <p>O vídeo associado a este QR code não foi encontrado.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {step === "scan" && (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2">Simule o escaneamento do QR Code</h3>
            <p className="text-sm text-muted-foreground">
              Esta simulação mostra como a experiência de AR ficaria em um dispositivo real.
            </p>
          </div>
          
          <div className="bg-zinc-800 p-8 rounded-3xl w-full max-w-md mx-auto">
            <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden">
              {isCameraActive ? (
                <div className="absolute inset-0 bg-black/80">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute -inset-4 border-2 border-primary animate-pulse rounded-lg"></div>
                      <QRCodeSVG
                        value={arUrl}
                        size={180}
                        fgColor={qrCode.style.foreground}
                        bgColor={qrCode.style.background}
                        level="H"
                        includeMargin={true}
                        imageSettings={qrCode.style.logoUrl ? {
                          src: qrCode.style.logoUrl,
                          height: 24,
                          width: 24,
                          excavate: true,
                        } : undefined}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-black">
                  <Camera className="h-16 w-16 text-white opacity-20 mb-4" />
                  <p className="text-white text-center px-8">Toque no botão de escaneamento para começar</p>
                </div>
              )}
              
              {/* Botão da câmera */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center">
                <button 
                  className={`w-16 h-16 rounded-full ${isCameraActive ? 'bg-red-500' : 'bg-white'} flex items-center justify-center`}
                  onClick={handleStartScan}
                  disabled={isCameraActive}
                >
                  <Scan className={`h-8 w-8 ${isCameraActive ? 'text-white' : 'text-black'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {step === "processing" && (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2">Processando QR Code</h3>
            <p className="text-sm text-muted-foreground">
              Iniciando a experiência de realidade aumentada...
            </p>
          </div>
          
          <div className="bg-zinc-800 p-8 rounded-3xl w-full max-w-md mx-auto">
            <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6">
              <Smartphone className="h-16 w-16 text-white mb-6" />
              <div className="w-full space-y-2">
                <div className="flex justify-between text-white text-xs">
                  <span>Carregando experiência AR</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {step === "ar" && (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2">Experiência AR em andamento</h3>
            <p className="text-sm text-muted-foreground">
              O vídeo agora está sendo reproduzido em realidade aumentada.
            </p>
          </div>
          
          <div className="bg-zinc-800 p-8 rounded-3xl w-full max-w-md mx-auto">
            <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden">
              {/* Simulação do vídeo em AR */}
              <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <VideoPlayer 
                  videoUrl={video.url} 
                  autoPlay={true}
                  controls={true}
                  loop={true}
                  className="w-full h-auto max-h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setStep("scan")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o escaneamento
          </Button>
        </div>
      )}
    </div>
  );
};

export default ARSimulation;
