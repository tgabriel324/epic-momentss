
import React from "react";
import QRScanner from "@/components/qr/QRScanner";
import Container from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QRScannerPage = () => {
  const navigate = useNavigate();

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
          <QRScanner onClose={() => navigate("/qrcodes")} />
        </div>
      </div>
    </Container>
  );
};

export default QRScannerPage;
