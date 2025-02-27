
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { saveAs } from "file-saver";
import { Eye, PenSquare, Trash2, Clock, Download, Share2, Camera, Globe, BarChart } from "lucide-react";
import { QRCode } from "@/store/qrCodeStore";
import { useVideoStore } from "@/store/videoStore";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface QRCardProps {
  qrCode: QRCode;
  onCustomize: () => void;
  onDelete: () => void;
  onSimulateAR: () => void;
  onViewStats?: () => void;
}

const QRCard: React.FC<QRCardProps> = ({
  qrCode,
  onCustomize,
  onDelete,
  onSimulateAR,
  onViewStats
}) => {
  const { getVideoById } = useVideoStore();
  const video = getVideoById(qrCode.videoId);
  const [isCheckingAR, setIsCheckingAR] = useState(false);
  const navigate = useNavigate();
  
  // Obter a URL base atual
  const getBaseUrl = () => {
    // Em ambiente de produção, use a URL real do site
    if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('.lovableproject.com')) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    // Para desenvolvimento e sandbox, use a URL relativa
    return '';
  };
  
  // URL única para AR
  const arUrl = `${getBaseUrl()}/ar/${qrCode.id}`;
  
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
  
  // Verificar suporte a WebXR no dispositivo
  const checkARSupport = () => {
    setIsCheckingAR(true);
    
    // Verificar se o navegador suporta WebXR
    if ('xr' in navigator) {
      // @ts-ignore - TypeScript pode não reconhecer a API WebXR
      navigator.xr.isSessionSupported('immersive-ar')
        .then((supported) => {
          setIsCheckingAR(false);
          
          if (supported) {
            toast({
              title: "AR suportado!",
              description: "Seu dispositivo suporta Realidade Aumentada. Você pode experimentar a visualização AR real."
            });
            
            // Redirecionar para a experiência AR real
            navigate(`/ar/${qrCode.id}`);
          } else {
            toast({
              title: "AR não suportado",
              description: "Seu dispositivo não suporta Realidade Aumentada. Você pode usar a simulação.",
              variant: "destructive"
            });
            // Cair de volta para a simulação
            navigate(`/qrcodes/simulate/${qrCode.id}`);
          }
        })
        .catch((error) => {
          console.error('Erro ao verificar suporte a AR:', error);
          setIsCheckingAR(false);
          toast({
            title: "Erro ao verificar AR",
            description: "Houve um problema ao verificar o suporte a AR. Tentando simulação.",
            variant: "destructive"
          });
          // Cair de volta para a simulação
          navigate(`/qrcodes/simulate/${qrCode.id}`);
        });
    } else {
      setIsCheckingAR(false);
      toast({
        title: "WebXR não disponível",
        description: "Seu navegador não suporta WebXR. Abrindo simulação.",
        variant: "destructive"
      });
      // Cair de volta para a simulação
      navigate(`/qrcodes/simulate/${qrCode.id}`);
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
  
  // Obter informações de uso nos últimos 7 dias
  const getRecentActivity = () => {
    if (!qrCode.scanHistory || qrCode.scanHistory.length === 0) {
      return { count: 0, percentage: 0 };
    }
    
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const recentScans = qrCode.scanHistory.filter(
      scan => new Date(scan.timestamp) >= sevenDaysAgo
    );
    
    const percentage = qrCode.scans > 0 
      ? Math.round((recentScans.length / qrCode.scans) * 100) 
      : 0;
    
    return {
      count: recentScans.length,
      percentage
    };
  };
  
  const recentActivity = getRecentActivity();
  const { style } = qrCode;
  
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
          <QRCodeSVG
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
          
          {/* Atividade recente */}
          {qrCode.analyticsEnabled && qrCode.scans > 0 && (
            <div className="mt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Últimos 7 dias:</span>
                <span className="font-medium">{recentActivity.count} escaneamentos</span>
              </div>
              {qrCode.scans > 5 && (
                <div className="mt-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full" 
                    style={{ width: `${recentActivity.percentage}%` }}
                  ></div>
                </div>
              )}
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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkARSupport} 
            disabled={isCheckingAR}
          >
            {isCheckingAR ? (
              <span className="flex items-center">
                <Globe className="mr-1 h-4 w-4 animate-spin" />
                Verificando...
              </span>
            ) : (
              <>
                <Camera className="mr-1 h-4 w-4" />
                AR Real
              </>
            )}
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
        
        {qrCode.analyticsEnabled && onViewStats && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewStats} 
            className="w-full mt-1"
          >
            <BarChart className="mr-2 h-4 w-4" />
            Ver estatísticas detalhadas
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QRCard;
