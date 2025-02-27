
import React from "react";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileVideo } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const Upload = () => {
  const handleUploadClick = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O upload de vídeos será implementado na Fase 2",
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
            <BreadcrumbPage>Upload</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="page-title">Upload de Vídeos</h1>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Adicionar Novo Vídeo</CardTitle>
          <CardDescription>
            Arraste e solte seu vídeo ou clique para selecionar um arquivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-secondary/50 rounded-lg p-12 text-center hover:bg-secondary/5 transition-colors cursor-pointer"
            onClick={handleUploadClick}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <UploadIcon className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="text-xl font-medium">Arraste e solte aqui</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suporte para MP4, MOV, AVI (máx. 500MB)
                </p>
              </div>
              <Button variant="outline" className="mt-2">
                <FileVideo className="mr-2 h-4 w-4" />
                Selecionar arquivo
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Ao fazer upload, você concorda com nossos termos de serviço e confirma que este conteúdo não viola direitos autorais.
            </p>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Upload;
