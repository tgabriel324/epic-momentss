
import React, { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Library, Upload, Search, Plus, Download, Share2, Eye, Clock, PenSquare, Trash2, Camera, Smartphone } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { QRCode as QRCodeReact } from "qrcode.react";
import { saveAs } from "file-saver";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useVideoStore, Video } from "@/store/videoStore";
import { useQRCodeStore, QRCode as QRCodeType, defaultQRStyle } from "@/store/qrCodeStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCreator from "@/components/qr/QRCreator";
import QRCard from "@/components/qr/QRCard";
import QRCustomizer from "@/components/qr/QRCustomizer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ARSimulation from "@/components/qr/ARSimulation";

const QRCodes = () => {
  const { videos } = useVideoStore();
  const { qrCodes, deleteQRCode } = useQRCodeStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQRCodes, setFilteredQRCodes] = useState<QRCodeType[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<QRCodeType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSimulationDialogOpen, setIsSimulationDialogOpen] = useState(false);
  
  // Filtrar QR codes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQRCodes(qrCodes);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredQRCodes(
        qrCodes.filter(qrCode => 
          qrCode.videoTitle.toLowerCase().includes(query)
        )
      );
    }
  }, [qrCodes, searchQuery]);
  
  // Abrir diálogo de criação de QR code
  const handleCreateQRCode = () => {
    if (videos.length === 0) {
      toast({
        title: "Nenhum vídeo encontrado",
        description: "Você precisa fazer upload de vídeos antes de gerar QR codes.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreateDialogOpen(true);
  };
  
  // Abrir diálogo de personalização de QR code
  const handleCustomizeQRCode = (qrCode: QRCodeType) => {
    setSelectedQRCode(qrCode);
    setIsCustomizeDialogOpen(true);
  };
  
  // Abrir diálogo de confirmação de exclusão
  const handleDeleteClick = (qrCode: QRCodeType) => {
    setSelectedQRCode(qrCode);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirmar exclusão do QR code
  const confirmDelete = () => {
    if (!selectedQRCode) return;
    
    deleteQRCode(selectedQRCode.id);
    setIsDeleteDialogOpen(false);
    setSelectedQRCode(null);
    
    toast({
      title: "QR code excluído",
      description: "O QR code foi removido com sucesso."
    });
  };
  
  // Abrir simulação de AR
  const handleSimulateAR = (qrCode: QRCodeType) => {
    setSelectedQRCode(qrCode);
    setIsSimulationDialogOpen(true);
  };
  
  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return (
    <Container>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>QR Codes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Gerenciar QR Codes</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/library">
              <Library className="mr-2 h-4 w-4" />
              Biblioteca
            </Link>
          </Button>
          <Button asChild>
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Adicionar vídeo
            </Link>
          </Button>
        </div>
      </div>
      
      <Card className="w-full mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Seus QR Codes</CardTitle>
              <CardDescription>
                Gerencie todos os seus QR codes vinculados a vídeos
              </CardDescription>
            </div>
            <Button onClick={handleCreateQRCode}>
              <Plus className="mr-2 h-4 w-4" />
              Criar QR Code
            </Button>
          </div>
        </CardHeader>
        
        {qrCodes.length > 0 && (
          <CardContent>
            <div className="relative w-full mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar QR codes..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        )}
        
        <CardContent>
          {qrCodes.length === 0 ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center gap-4">
              <div className="bg-secondary/10 p-4 rounded-full">
                <QrCode className="h-12 w-12 text-secondary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-medium">Nenhum QR code encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça upload de vídeos para gerar QR codes vinculados
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  onClick={handleCreateQRCode}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar QR code
                </Button>
                <Button asChild>
                  <Link to="/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Fazer upload
                  </Link>
                </Button>
              </div>
            </div>
          ) : filteredQRCodes.length === 0 ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center gap-4">
              <div className="bg-secondary/10 p-4 rounded-full">
                <Search className="h-12 w-12 text-secondary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-medium">Nenhum resultado encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tente usar termos diferentes para sua busca
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQRCodes.map((qrCode) => (
                <QRCard 
                  key={qrCode.id}
                  qrCode={qrCode}
                  onCustomize={() => handleCustomizeQRCode(qrCode)}
                  onDelete={() => handleDeleteClick(qrCode)}
                  onSimulateAR={() => handleSimulateAR(qrCode)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Seção informativa sobre AR */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Realidade Aumentada com QR Codes</CardTitle>
          <CardDescription>
            Como funciona a experiência de AR com seus vídeos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">1. Gere QR Codes</h3>
              <p className="text-sm text-muted-foreground">
                Personalize e crie QR codes únicos para cada vídeo da sua biblioteca.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">2. Escaneie o código</h3>
              <p className="text-sm text-muted-foreground">
                Use qualquer app de leitura de QR code para escanear e acessar o conteúdo AR.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">3. Veja a mágica acontecer</h3>
              <p className="text-sm text-muted-foreground">
                O vídeo será exibido em realidade aumentada no ambiente real do usuário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo de criação de QR code */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar QR Code</DialogTitle>
            <DialogDescription>
              Selecione um vídeo para gerar um QR code vinculado
            </DialogDescription>
          </DialogHeader>
          
          <QRCreator 
            onClose={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de personalização de QR code */}
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Personalizar QR Code</DialogTitle>
            <DialogDescription>
              Ajuste as cores e o estilo do seu QR code
            </DialogDescription>
          </DialogHeader>
          
          {selectedQRCode && (
            <QRCustomizer 
              qrCode={selectedQRCode}
              onClose={() => setIsCustomizeDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir QR code</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este QR code? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de simulação de AR */}
      <Dialog open={isSimulationDialogOpen} onOpenChange={setIsSimulationDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Simulação de Realidade Aumentada</DialogTitle>
            <DialogDescription>
              Veja como seu vídeo aparecerá quando o QR code for escaneado
            </DialogDescription>
          </DialogHeader>
          
          {selectedQRCode && (
            <ARSimulation 
              qrCode={selectedQRCode}
              onClose={() => setIsSimulationDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default QRCodes;
