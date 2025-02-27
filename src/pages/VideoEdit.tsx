
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video, useVideoStore } from "@/store/videoStore";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import VideoPlayer from "@/components/video/VideoPlayer";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VideoEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVideoById, updateVideo, deleteVideo } = useVideoStore();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [tags, setTags] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Carregar o vídeo
  useEffect(() => {
    if (!id) return;
    
    const videoData = getVideoById(id);
    if (videoData) {
      setVideo(videoData);
      setTitle(videoData.title);
      setDescription(videoData.description);
      setCategory(videoData.category);
      setTags(videoData.tags.join(", "));
    } else {
      toast({
        title: "Vídeo não encontrado",
        description: "O vídeo que você está tentando editar não existe.",
        variant: "destructive"
      });
      navigate("/library");
    }
  }, [id, getVideoById, navigate]);
  
  // Salvar alterações
  const handleSave = () => {
    if (!id || !video) return;
    
    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, adicione um título para o vídeo.",
        variant: "destructive"
      });
      return;
    }
    
    // Processar tags
    const processedTags = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag !== "");
    
    updateVideo(id, {
      title,
      description,
      category,
      tags: processedTags
    });
    
    toast({
      title: "Alterações salvas",
      description: "As alterações foram salvas com sucesso."
    });
    
    navigate("/library");
  };
  
  // Excluir vídeo
  const handleDelete = () => {
    if (!id) return;
    
    deleteVideo(id);
    
    toast({
      title: "Vídeo excluído",
      description: "O vídeo foi removido da sua biblioteca."
    });
    
    navigate("/library");
  };
  
  // Categorias disponíveis
  const categories = [
    { id: "geral", name: "Geral" },
    { id: "educacao", name: "Educação" },
    { id: "marketing", name: "Marketing" },
    { id: "produto", name: "Produto" },
    { id: "eventos", name: "Eventos" },
    { id: "outros", name: "Outros" }
  ];
  
  if (!video) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[300px]">
          <p>Carregando...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/library">Biblioteca</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Editar Vídeo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Editar Vídeo</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate("/library")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a biblioteca
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview do vídeo */}
        <Card>
          <CardHeader>
            <CardTitle>Prévia</CardTitle>
            <CardDescription>
              Visualize como o vídeo aparece
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoPlayer videoUrl={video.url} controls />
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {description || "Sem descrição"}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {tags.split(",").map((tag, index) => (
                  tag.trim() && (
                    <Badge key={index} variant="secondary">
                      {tag.trim()}
                    </Badge>
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Formulário de edição */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do vídeo</CardTitle>
            <CardDescription>
              Edite as informações do seu vídeo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <select 
                id="category" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar alterações
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir vídeo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o vídeo "{video.title}"? Esta ação não pode ser desfeita.
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
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default VideoEdit;
