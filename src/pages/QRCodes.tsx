
import React from "react";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Library, Upload } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

const QRCodes = () => {
  const handleQRCodeAction = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A geração de QR codes será implementada na Fase 3",
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
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Seus QR Codes</CardTitle>
          <CardDescription>
            Gerencie todos os seus QR codes vinculados a vídeos
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                onClick={handleQRCodeAction}
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
        </CardContent>
      </Card>
    </Container>
  );
};

export default QRCodes;
