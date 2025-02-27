
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, QrCode, Search } from "lucide-react";
import { useVideoStore, Video } from "@/store/videoStore";
import { useQRCodeStore, defaultQRStyle } from "@/store/qrCodeStore";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface QRCreatorProps {
  onClose: () => void;
}

const QRCreator: React.FC<QRCreatorProps> = ({ onClose }) => {
  const { videos } = useVideoStore();
  const { qrCodes, addQRCode, getQRCodeByVideoId } = useQRCodeStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [qrSize, setQrSize] = useState<number>(200);
  const [qrForeground, setQrForeground] = useState<string>("#000000");
  const [qrBackground, setQrBackground] = useState<string>("#ffffff");
  
  // Obter a URL base atual
  const getBaseUrl = () => {
    // Em ambiente de produção, use a URL real do site
    if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('.lovableproject.com')) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    // Para desenvolvimento e sandbox, use a URL relativa
    return '';
  };
  
  // Filtrar vídeos com base na pesquisa
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVideos(videos);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = videos.filter(video => 
        video.title.toLowerCase().includes(query) || 
        video.description.toLowerCase().includes(query)
      );
      setFilteredVideos(filtered);
    }
  }, [videos, searchQuery]);
  
  // Selecionar um vídeo
  const handleSelectVideo = (video: Video) => {
    // Verificar se já existe um QR code para este vídeo
    const existingQRCode = getQRCodeByVideoId(video.id);
    
    if (existingQRCode) {
      toast({
        title: "QR code já existe",
        description: "Este vídeo já possui um QR code. Você pode editá-lo na lista de QR codes.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedVideo(video);
  };
  
  // Criar o QR code
  const handleCreateQRCode = () => {
    if (!selectedVideo) return;
    
    const qrCodeId = `qr-${Date.now()}`;
    // Usar URL relativa ou absoluta dependendo do ambiente
    const baseUrl = getBaseUrl();
    const arUrl = `${baseUrl}/ar/${qrCodeId}`;
    
    // Adicionar o QR code à store
    addQRCode({
      id: qrCodeId,
      videoId: selectedVideo.id,
      videoTitle: selectedVideo.title,
      dateCreated: new Date().toISOString(),
      style: {
        foreground: qrForeground,
        background: qrBackground,
        cornerRadius: 0,
        size: qrSize,
      },
      scans: 0,
      scanHistory: [],
      analyticsEnabled: true,
    });
    
    toast({
      title: "QR code criado com sucesso",
      description: "Seu QR code foi adicionado à sua coleção."
    });
    
    onClose();
  };
  
  return (
    <div className="space-y-4">
      {!selectedVideo ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vídeos..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <ScrollArea className="h-[300px] rounded-md border">
            {filteredVideos.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum vídeo encontrado
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredVideos.map((video) => {
                  const hasQRCode = getQRCodeByVideoId(video.id);
                  
                  return (
                    <div
                      key={video.id}
                      className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer hover:bg-secondary/10 transition-colors ${hasQRCode ? 'opacity-50' : ''}`}
                      onClick={() => !hasQRCode && handleSelectVideo(video)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {video.category}
                            {video.tags.length > 0 && ` • ${video.tags.join(', ')}`}
                          </p>
                        </div>
                      </div>
                      
                      {hasQRCode ? (
                        <Badge variant="outline" className="text-xs">Já possui QR</Badge>
                      ) : (
                        <Button variant="ghost" size="sm">
                          Selecionar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-1">{selectedVideo.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedVideo.description || "Sem descrição"}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="qrSize">Tamanho</Label>
                    <Select
                      value={qrSize.toString()}
                      onValueChange={(value) => setQrSize(Number(value))}
                    >
                      <SelectTrigger id="qrSize">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="150">Pequeno (150px)</SelectItem>
                        <SelectItem value="200">Médio (200px)</SelectItem>
                        <SelectItem value="250">Grande (250px)</SelectItem>
                        <SelectItem value="300">Extra grande (300px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="qrForeground">Cor do QR code</Label>
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <Input
                          id="qrForeground"
                          type="text"
                          value={qrForeground}
                          onChange={(e) => setQrForeground(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                      <div>
                        <Input
                          type="color"
                          value={qrForeground}
                          onChange={(e) => setQrForeground(e.target.value)}
                          className="w-10 h-10 p-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="qrBackground">Cor de fundo</Label>
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <Input
                          id="qrBackground"
                          type="text"
                          value={qrBackground}
                          onChange={(e) => setQrBackground(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                      <div>
                        <Input
                          type="color"
                          value={qrBackground}
                          onChange={(e) => setQrBackground(e.target.value)}
                          className="w-10 h-10 p-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <div 
                className="p-4 rounded-lg border"
                style={{ background: qrBackground }}
              >
                <QRCodeSVG
                  value={`${getBaseUrl()}/ar/preview-${selectedVideo.id}`}
                  size={qrSize}
                  fgColor={qrForeground}
                  bgColor={qrBackground}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedVideo(null)}
            >
              Voltar
            </Button>
            <Button onClick={handleCreateQRCode}>
              <Check className="mr-2 h-4 w-4" />
              Criar QR Code
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default QRCreator;
