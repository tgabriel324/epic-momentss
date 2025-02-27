
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCode as QRCodeReact } from "qrcode.react";
import { saveAs } from "file-saver";
import { Eye, PenSquare, Trash2, Clock, Download, Share2, Camera } from "lucide-react";
import { QRCode } from "@/store/qrCodeStore";
import { useVideoStore } from "@/store/videoStore";
import { toast } from "@/hooks/use-toast";

interface QRCardProps {
  qrCode: QRCode;
  onCustomize: () => void;
  onDelete: () => void;
  onSimulateAR: () => void;
}

const QRCard: React.FC<QRCardProps> = ({
  qrCode,
  onCustomize,
  onDelete,
  onSimulateAR
}) => {
  const { getVideoById } = useVideoStore();
  const video = getVideoById(qrCode.videoId);
  
  // Download QR code como PNG
  const handleDownload = () => {
    const canvas = document.getElementById(`qr-canvas-${qrCode.id}`) as HTMLCanvasElement;
    
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `qrcode-${qrCode.videoTitle.replace(/\s+/g, '-').toLowerCase()}.png`);
          
          toast({
            title: "QR code baixado",
            description: "O arquivo PNG foi salvo com sucesso."
          });
        }
      });
    }
  };
  
  // Compartilhar QR code
  const handleShare = async () => {
    const canvas = document.getElementById(`qr-canvas-${qrCode.id}`) as HTMLCanvasElement;
    
    if (canvas && navigator.share) {
      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob));
        });
        
        if (blob) {
          const file = new File([blob], `qrcode-${qrCode.videoTitle.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });
          
          await navigator.share({
            title: `QR Code para ${qrCode.videoTitle}`,
            text: 'Escaneie este QR code para ver o vídeo em realidade aumentada',
            files: [file]
          });
        }
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
        toast({
          title: "Não foi possível compartilhar",
          description: "Tente baixar o QR code e compartilhar manualmente.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Compartilhamento não suportado",
        description: "Seu navegador não suporta a API de compartilhamento. Tente baixar o QR code.",
        variant: "destructive"
      });
    }
  };
  
  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };
  
  const { style } = qrCode;
  
  // URL única para AR (simulada)
  const arUrl = `https://epicmoments.app/ar/${qrCode.id}`;
  
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardContent className="p-4 flex-grow flex flex-col items-center justify-center">
        <div className="mb-4 w-full text-center">
          <h3 className="text-lg font-medium line-clamp-1">{qrCode.videoTitle}</h3>
        </div>
        
        <div 
          className="p-4 flex items-center justify-center bg-card rounded-lg border border-border"
          style={{ background: style.background }}
        >
          <QRCodeReact
            id={`qr-canvas-${qrCode.id}`}
            value={arUrl}
            size={style.size}
            fgColor={style.foreground}
            bgColor={style.background}
            level="H"
            includeMargin={true}
            imageSettings={style.logoUrl ? {
              src: style.logoUrl,
              height: 24,
              width: 24,
              excavate: true,
            } : undefined}
            renderAs="canvas"
          />
        </div>
        
        <div className="mt-4 w-full flex flex-col gap-2">
          {/* Estatísticas */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(qrCode.dateCreated)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{qrCode.scans} escaneamentos</span>
            </div>
          </div>
          
          {qrCode.lastScan && (
            <div className="text-xs text-muted-foreground">
              Último escaneamento: {formatDate(qrCode.lastScan)}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-border flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onSimulateAR}>
            <Camera className="mr-1 h-4 w-4" />
            Simular
          </Button>
          <Button variant="ghost" size="sm" onClick={onCustomize}>
            <PenSquare className="mr-1 h-4 w-4" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QRCard;
