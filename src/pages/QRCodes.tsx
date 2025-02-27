
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { useVideoStore } from "@/store/videoStore";
import QRCreator from "@/components/qr/QRCreator";
import QRCustomizer from "@/components/qr/QRCustomizer";
import QRScanner from "@/components/qr/QRScanner";
import QRCard from "@/components/qr/QRCard";
import ARSimulation from "@/components/qr/ARSimulation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QrCode, Plus, Trash2, Settings, ScanLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";

const QRCodes = () => {
  const { qrCodes, deleteQRCode } = useQRCodeStore();
  const { videos } = useVideoStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [activeQRCode, setActiveQRCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filtrar QR codes com base na aba ativa
  const filteredQRCodes = React.useMemo(() => {
    if (activeTab === "all") return qrCodes;
    
    // Converter o timestamp para um objeto Date
    const now = new Date();
    
    // Filtrar com base na data de criação
    if (activeTab === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      return qrCodes.filter(qr => new Date(qr.dateCreated) >= thirtyDaysAgo);
    }
    
    // Filtrar com base na última digitalização
    if (activeTab === "active") {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      
      return qrCodes.filter(qr => {
        if (!qr.lastScan) return false;
        return new Date(qr.lastScan) >= ninetyDaysAgo;
      });
    }
    
    return qrCodes;
  }, [qrCodes, activeTab]);
  
  // Verificar se há QR codes
  const hasQRCodes = qrCodes.length > 0;
  
  // Verificar se há vídeos
  const hasVideos = videos.length > 0;
  
  // Abrir o componente de customização para um QR code específico
  const handleCustomize = (qrCodeId: string) => {
    setActiveQRCode(qrCodeId);
    setIsCustomizeOpen(true);
  };
  
  // Abrir o diálogo de exclusão para um QR code específico
  const handleDeletePrompt = (qrCodeId: string) => {
    setActiveQRCode(qrCodeId);
    setIsDeleteOpen(true);
  };
  
  // Excluir o QR code
  const handleDelete = () => {
    if (activeQRCode) {
      deleteQRCode(activeQRCode);
      setActiveQRCode(null);
      setIsDeleteOpen(false);
    }
  };
  
  // Abrir o componente de simulação para um QR code específico
  const handleSimulateAR = (qrCodeId: string) => {
    setActiveQRCode(qrCodeId);
    setIsSimulateOpen(true);
  };
  
  // Ver estatísticas de um QR code específico
  const handleViewStats = (qrCodeId: string) => {
    navigate(`/qrcodes/stats/${qrCodeId}`);
  };
  
  // Efeito para sincronizar a URL com o estado das modais
  React.useEffect(() => {
    if (id && id === "create") {
      setIsCreateOpen(true);
    } else if (id && id.startsWith("customize-")) {
      const qrId = id.replace("customize-", "");
      setActiveQRCode(qrId);
      setIsCustomizeOpen(true);
    } else if (id && id.startsWith("simulate-")) {
      const qrId = id.replace("simulate-", "");
      setActiveQRCode(qrId);
      setIsSimulateOpen(true);
    } else if (id && id.startsWith("scanner")) {
      setIsScannerOpen(true);
    }
  }, [id]);
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Codes</h1>
          <p className="text-muted-foreground">
            Crie e gerencie QR codes para seus vídeos em realidade aumentada.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsScannerOpen(true)}
          >
            <ScanLine className="mr-2 h-4 w-4" />
            Escanear QR Code
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            disabled={!hasVideos}
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar QR Code
          </Button>
        </div>
      </div>
      
      {!hasVideos && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <QrCode className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum vídeo encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Você precisa adicionar vídeos antes de criar QR codes.
          </p>
          <Button onClick={() => navigate("/upload")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Vídeo
          </Button>
        </div>
      )}
      
      {hasVideos && (
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="recent">Recentes</TabsTrigger>
              <TabsTrigger value="active">Ativos</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            {!hasQRCodes ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <QrCode className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sem QR codes</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhum QR code. Crie seu primeiro QR code agora.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar QR Code
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredQRCodes.map((qrCode) => (
                  <QRCard
                    key={qrCode.id}
                    qrCode={qrCode}
                    onCustomize={() => handleCustomize(qrCode.id)}
                    onDelete={() => handleDeletePrompt(qrCode.id)}
                    onSimulateAR={() => handleSimulateAR(qrCode.id)}
                    onViewStats={qrCode.analyticsEnabled ? () => handleViewStats(qrCode.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="mt-0">
            {filteredQRCodes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <QrCode className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum QR code recente</h3>
                <p className="text-muted-foreground mb-4">
                  Você não tem QR codes criados nos últimos 30 dias.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar QR Code
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredQRCodes.map((qrCode) => (
                  <QRCard
                    key={qrCode.id}
                    qrCode={qrCode}
                    onCustomize={() => handleCustomize(qrCode.id)}
                    onDelete={() => handleDeletePrompt(qrCode.id)}
                    onSimulateAR={() => handleSimulateAR(qrCode.id)}
                    onViewStats={qrCode.analyticsEnabled ? () => handleViewStats(qrCode.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            {filteredQRCodes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <QrCode className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum QR code ativo</h3>
                <p className="text-muted-foreground mb-4">
                  Você não tem QR codes escaneados nos últimos 90 dias.
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar QR Code
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredQRCodes.map((qrCode) => (
                  <QRCard
                    key={qrCode.id}
                    qrCode={qrCode}
                    onCustomize={() => handleCustomize(qrCode.id)}
                    onDelete={() => handleDeletePrompt(qrCode.id)}
                    onSimulateAR={() => handleSimulateAR(qrCode.id)}
                    onViewStats={qrCode.analyticsEnabled ? () => handleViewStats(qrCode.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Modal para criar QR Code */}
      <Dialog 
        open={isCreateOpen} 
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) navigate("/qrcodes");
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar novo QR Code</DialogTitle>
            <DialogDescription>
              Selecione um vídeo e personalize seu QR Code para realidade aumentada.
            </DialogDescription>
          </DialogHeader>
          <QRCreator onClose={() => {
            setIsCreateOpen(false);
            navigate("/qrcodes");
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Modal para escanear QR Code */}
      <Dialog 
        open={isScannerOpen} 
        onOpenChange={(open) => {
          setIsScannerOpen(open);
          if (!open) navigate("/qrcodes");
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Escanear QR Code</DialogTitle>
            <DialogDescription>
              Use a câmera para escanear um QR code e ver o vídeo associado.
            </DialogDescription>
          </DialogHeader>
          <QRScanner onClose={() => {
            setIsScannerOpen(false);
            navigate("/qrcodes");
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Modal para customizar QR Code */}
      <Dialog 
        open={isCustomizeOpen} 
        onOpenChange={(open) => {
          setIsCustomizeOpen(open);
          if (!open) {
            setActiveQRCode(null);
            navigate("/qrcodes");
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Personalizar QR Code</DialogTitle>
            <DialogDescription>
              Modifique a aparência do seu QR Code para realidade aumentada.
            </DialogDescription>
          </DialogHeader>
          
          {activeQRCode && (
            <QRCustomizer 
              qrCodeId={activeQRCode}
              onClose={() => {
                setIsCustomizeOpen(false);
                setActiveQRCode(null);
                navigate("/qrcodes");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para excluir QR Code */}
      <AlertDialog 
        open={isDeleteOpen} 
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setActiveQRCode(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir QR Code?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O QR Code será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Modal para simular experiência AR */}
      <Dialog 
        open={isSimulateOpen} 
        onOpenChange={(open) => {
          setIsSimulateOpen(open);
          if (!open) {
            setActiveQRCode(null);
            navigate("/qrcodes");
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Simulação de Realidade Aumentada</DialogTitle>
            <DialogDescription>
              Veja como sua experiência AR ficará quando alguém escanear o QR Code.
            </DialogDescription>
          </DialogHeader>
          
          {activeQRCode && (
            <ARSimulation
              qrCode={qrCodes.find(qr => qr.id === activeQRCode)!}
              onClose={() => {
                setIsSimulateOpen(false);
                setActiveQRCode(null);
                navigate("/qrcodes");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCodes;
