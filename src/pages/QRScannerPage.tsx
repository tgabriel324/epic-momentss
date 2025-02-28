
import React, { useEffect } from "react";
import QRScanner from "@/components/qr/QRScanner";
import Container from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQRCodeStore } from "@/store/qrCodeStore";

const QRScannerPage = () => {
  const navigate = useNavigate();
  const { qrCodes, fetchQRCodes, loading } = useQRCodeStore();

  // Carregar QR codes quando a página for montada
  useEffect(() => {
    // Recarregar os QR codes do banco de dados para garantir dados atualizados
    fetchQRCodes();
  }, [fetchQRCodes]);

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
                Carregando QR codes...
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
          ) : (
            <QRScanner 
              onClose={() => navigate("/qrcodes")} 
              forceInitialLoad={true} 
            />
          )}
        </div>

        {qrCodes.length > 0 && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">QR Codes disponíveis:</p>
            <ul className="space-y-1 text-sm">
              {qrCodes.map(qr => (
                <li key={qr.id} className="text-muted-foreground">
                  {qr.videoTitle} (ID: {qr.id.substring(0, 8)}...)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Container>
  );
};

export default QRScannerPage;
