
import React, { useEffect } from "react";
import QRScanner from "@/components/qr/QRScanner";
import Container from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { useVideoStore } from "@/store/videoStore";

const QRScannerPage = () => {
  const navigate = useNavigate();
  const { qrCodes, fetchQRCodes, loading: loadingQRCodes } = useQRCodeStore();
  const { videos, fetchVideos, loading: loadingVideos } = useVideoStore();

  // Carregar QR codes e vídeos quando a página for montada
  useEffect(() => {
    // Recarregar os dados do banco de dados para garantir dados atualizados
    const loadData = async () => {
      try {
        await Promise.all([fetchQRCodes(), fetchVideos()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    
    loadData();
  }, [fetchQRCodes, fetchVideos]);

  const loading = loadingQRCodes || loadingVideos;

  return (
    <Container className="max-w-4xl">
      <div className="flex flex-col space-y-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Scanner de QR Code</h1>
          <Button variant="ghost" onClick={() => navigate("/qrcodes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
        </div>

        <div className="bg-background rounded-lg border p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                Carregando dados...
              </p>
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum QR code encontrado. Crie um QR code primeiro antes de usar o scanner.
              </p>
              <Button onClick={() => navigate("/qrcodes")}>
                Voltar para QR Codes
              </Button>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum vídeo encontrado. Adicione vídeos à biblioteca antes de usar o scanner.
              </p>
              <Button onClick={() => navigate("/library")}>
                Ir para Biblioteca de Vídeos
              </Button>
            </div>
          ) : (
            <QRScanner 
              onClose={() => navigate("/qrcodes")} 
              forceInitialLoad={true} 
            />
          )}
        </div>

        {/* Informações sobre QR Codes e Vídeos disponíveis */}
        {qrCodes.length > 0 && videos.length > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* QR Codes disponíveis */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-2">QR Codes disponíveis:</p>
              <div className="max-h-48 overflow-y-auto">
                <ul className="space-y-1 text-sm">
                  {qrCodes.map(qr => (
                    <li key={qr.id} className="text-muted-foreground">
                      {qr.videoTitle} (ID: {qr.id.substring(0, 8)}...)
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Vídeos disponíveis */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-2">Vídeos disponíveis:</p>
              <div className="max-h-48 overflow-y-auto">
                <ul className="space-y-1 text-sm">
                  {videos.map(video => (
                    <li key={video.id} className="text-muted-foreground">
                      {video.title} (ID: {video.id.substring(0, 8)}...)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default QRScannerPage;
