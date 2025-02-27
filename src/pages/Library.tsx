
import React from "react";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library as LibraryIcon, Upload } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

const Library = () => {
  const handleLibraryAction = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A biblioteca de vídeos será implementada na Fase 2",
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
            <BreadcrumbPage>Biblioteca</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Biblioteca de Vídeos</h1>
        <Button asChild>
          <Link to="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Adicionar vídeo
          </Link>
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Seus Vídeos</CardTitle>
          <CardDescription>
            Gerencie todos os seus vídeos em um só lugar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-4">
            <div className="bg-secondary/10 p-4 rounded-full">
              <LibraryIcon className="h-12 w-12 text-secondary" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium">Nenhum vídeo encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Faça upload de vídeos para começar a criar QR codes
              </p>
            </div>
            <Button 
              className="mt-2" 
              asChild
            >
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Fazer upload
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Library;
