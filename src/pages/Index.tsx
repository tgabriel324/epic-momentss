
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Container from "@/components/ui/container";
import { QrCode, Upload, Library } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-secondary/10 py-16">
        <Container className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Transforme seus vídeos com 
            <span className="text-primary"> QR Codes Inteligentes</span>
          </h1>
          <p className="text-xl text-secondary-foreground max-w-2xl mx-auto mb-8">
            Epic Moments: Crie, gerencie e visualize seus vídeos através de QR codes com realidade aumentada
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/upload">
                <Upload className="mr-2 h-5 w-5" />
                Começar Upload
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/qrcodes">
                <QrCode className="mr-2 h-5 w-5" />
                Ver QR Codes
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <Container>
          <h2 className="text-3xl font-bold text-center mb-12">
            Recursos Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Upload className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Upload Simples</CardTitle>
                <CardDescription>
                  Arraste e solte vídeos ou selecione para upload rápido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-foreground">
                  Suporte a diversos formatos de vídeo. Processe e otimize automaticamente para melhor desempenho.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="link" asChild>
                  <Link to="/upload">Fazer upload</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Library className="h-12 w-12 text-primary mb-2" />
                <CardTitle>Biblioteca Organizada</CardTitle>
                <CardDescription>
                  Gerencie todos os seus vídeos em um só lugar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-foreground">
                  Adicione metadados, categorize e organize seus vídeos para fácil acesso e gerenciamento.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="link" asChild>
                  <Link to="/library">Explorar biblioteca</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <QrCode className="h-12 w-12 text-primary mb-2" />
                <CardTitle>QR Codes Inteligentes</CardTitle>
                <CardDescription>
                  Gere QR codes vinculados aos seus vídeos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-foreground">
                  Personalize os QR codes e visualize vídeos em AR ao escaneá-los com um dispositivo móvel.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="link" asChild>
                  <Link to="/qrcodes">Gerar QR codes</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary/10 py-16">
        <Container className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-secondary-foreground max-w-2xl mx-auto mb-8">
            Comece a criar seus Epic Moments agora mesmo
          </p>
          <Button size="lg" asChild>
            <Link to="/upload">Começar agora</Link>
          </Button>
        </Container>
      </section>
    </div>
  );
};

export default Index;
