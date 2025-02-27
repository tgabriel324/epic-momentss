
import React, { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileVideo, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVideoStore } from "@/store/videoStore";

// Tipos para o gerenciamento de upload
type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

const Upload = () => {
  const navigate = useNavigate();
  const addVideo = useVideoStore((state) => state.addVideo);
  
  // Estados para gerenciar o upload
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // Estados para os metadados do vídeo
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [tags, setTags] = useState("");

  // Função para verificar tipos de arquivo
  const isVideoFile = (file: File) => {
    const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    return validTypes.includes(file.type);
  };

  // Função para verificar tamanho do arquivo
  const isSizeValid = (file: File) => {
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    return file.size <= MAX_SIZE;
  };

  // Gerenciar o drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Gerenciar o soltar do arquivo
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  }, []);

  // Lidar com a seleção do arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  // Processar o arquivo selecionado
  const handleFiles = (file: File) => {
    if (!isVideoFile(file)) {
      toast({
        title: "Formato não suportado",
        description: "Por favor, envie apenas arquivos MP4, MOV ou AVI.",
        variant: "destructive"
      });
      return;
    }
    
    if (!isSizeValid(file)) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 500MB.",
        variant: "destructive"
      });
      return;
    }
    
    setFile(file);
    setTitle(file.name.split('.')[0]); // Nome do arquivo como título padrão
  };

  // Remover o arquivo selecionado
  const handleRemoveFile = () => {
    setFile(null);
    setProgress(0);
    setUploadStatus("idle");
  };

  // Simular o upload do arquivo
  const handleUpload = () => {
    if (!file) return;
    
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para o vídeo.",
        variant: "destructive"
      });
      return;
    }

    setUploadStatus("uploading");
    
    // Simulação do progresso de upload
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 10;
      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(interval);
        setProgress(100);
        setUploadStatus("processing");
        
        // Simular processamento
        setTimeout(() => {
          handleUploadSuccess();
        }, 1500);
      } else {
        setProgress(Math.min(progressValue, 99));
      }
    }, 300);
  };

  // Lidar com o sucesso do upload
  const handleUploadSuccess = () => {
    setUploadStatus("success");
    
    // Adicionar o vídeo à biblioteca
    const videoId = Date.now().toString();
    const videoUrl = URL.createObjectURL(file!);
    const thumbnailUrl = "/placeholder.svg"; // Placeholder, em um app real geraria thumbnails
    
    addVideo({
      id: videoId,
      title: title,
      description: description,
      url: videoUrl,
      thumbnailUrl: thumbnailUrl,
      category: category,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
      dateUploaded: new Date().toISOString(),
      duration: 0, // Em um app real calcularia a duração
      size: file!.size,
      views: 0,
      localFile: file
    });
    
    toast({
      title: "Upload concluído!",
      description: "Seu vídeo foi adicionado à biblioteca."
    });
    
    // Navegar para a biblioteca após 2 segundos
    setTimeout(() => {
      navigate("/library");
    }, 2000);
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
          {!file ? (
            // Área de drop quando não há arquivo
            <div 
              className={`border-2 border-dashed ${dragActive ? 'border-primary bg-primary/5' : 'border-secondary/50'} rounded-lg p-12 text-center hover:bg-secondary/5 transition-colors cursor-pointer`}
              onClick={() => document.getElementById('file-upload')?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
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
                <input
                  id="file-upload"
                  type="file"
                  accept="video/mp4,video/quicktime,video/avi"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            // Exibição do arquivo e formulário de metadados
            <div className="space-y-6">
              {/* Exibição do arquivo selecionado */}
              <div className="flex items-center justify-between bg-secondary/10 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileVideo className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {uploadStatus === "idle" && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              {/* Barra de progresso */}
              {uploadStatus !== "idle" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {uploadStatus === "uploading" ? "Enviando..." : 
                       uploadStatus === "processing" ? "Processando..." :
                       uploadStatus === "success" ? "Upload concluído!" :
                       "Erro no upload"}
                    </span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  
                  {/* Ícone de status */}
                  <div className="flex justify-center pt-2">
                    {uploadStatus === "success" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : uploadStatus === "error" ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    ) : null}
                  </div>
                </div>
              )}
              
              {/* Formulário de metadados */}
              {uploadStatus === "idle" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do vídeo *</Label>
                    <Input 
                      id="title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Digite um título para o vídeo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Adicione uma descrição para o vídeo"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <select 
                        id="category" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="geral">Geral</option>
                        <option value="educacao">Educação</option>
                        <option value="marketing">Marketing</option>
                        <option value="produto">Produto</option>
                        <option value="eventos">Eventos</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tags">
                        Tags <span className="text-xs text-muted-foreground">(separadas por vírgula)</span>
                      </Label>
                      <Input 
                        id="tags" 
                        value={tags} 
                        onChange={(e) => setTags(e.target.value)} 
                        placeholder="ex: férias, família, praia"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleUpload}
                    disabled={!file || title.trim() === ""}
                  >
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Iniciar Upload
                  </Button>
                </div>
              )}
            </div>
          )}
          
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
