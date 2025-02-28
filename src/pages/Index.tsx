
import React, { useEffect } from "react";
import Container from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Upload, BookOpen, QrCode, BookMarked } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useVideoStore } from "@/store/videoStore";
import { useQRCodeStore } from "@/store/qrCodeStore";

const Index = () => {
  const { session } = useAuthStore();
  const { videos, fetchVideos } = useVideoStore();
  const { qrCodes, fetchQRCodes } = useQRCodeStore();
  
  // Carregar dados quando o componente montar
  useEffect(() => {
    if (session) {
      fetchVideos();
      fetchQRCodes();
    }
  }, [session]);
  
  return (
    <Container className="py-10">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Epic Moments</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Transforme seus vídeos em experiências interativas de realidade aumentada com QR codes personalizados.
        </p>
        
        {!session ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground mb-2">
              Faça login para começar a criar suas experiências em RA
            </p>
            <Button asChild size="lg">
              <Link to="/auth">Começar agora</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Upload de Vídeos</h2>
              <p className="text-muted-foreground mb-4">
                Adicione vídeos à sua biblioteca para transformá-los em experiências em RA.
              </p>
              <Button asChild className="w-full mt-auto">
                <Link to="/upload">Fazer upload</Link>
              </Button>
            </div>
            
            <div className="bg-card border rounded-lg p-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <BookMarked className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Biblioteca</h2>
              <p className="text-muted-foreground mb-4">
                Gerencie sua coleção de vídeos com {videos.length} itens disponíveis.
              </p>
              <Button asChild variant="outline" className="w-full mt-auto">
                <Link to="/library">Ver biblioteca</Link>
              </Button>
            </div>
            
            <div className="bg-card border rounded-lg p-6 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">QR Codes</h2>
              <p className="text-muted-foreground mb-4">
                Crie QR codes personalizados para acessar seus vídeos em realidade aumentada.
              </p>
              <Button asChild variant="outline" className="w-full mt-auto">
                <Link to="/qrcodes">Gerenciar QR Codes</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Index;
