
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Container from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library as LibraryIcon, Upload, Search, Filter, Clock, Eye, Clock3, Plus, Trash2, Edit } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { useVideoStore, Video } from "@/store/videoStore";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoCard from "@/components/video/VideoCard";

const Library = () => {
  const navigate = useNavigate();
  const { videos, searchVideos, filterVideosByCategory, deleteVideo } = useVideoStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Atualizar os vídeos filtrados quando houver mudanças
  useEffect(() => {
    let result = videos;
    
    // Aplicar filtro de categoria
    if (selectedCategory !== "todos") {
      result = filterVideosByCategory(selectedCategory);
    }
    
    // Aplicar filtro de pesquisa
    if (searchQuery) {
      result = searchVideos(searchQuery);
    }
    
    setFilteredVideos(result);
  }, [videos, searchQuery, selectedCategory, searchVideos, filterVideosByCategory]);

  // Lidar com a pesquisa
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Lidar com a seleção de categoria
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  // Abrir o diálogo de confirmação para excluir um vídeo
  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar a exclusão do vídeo
  const confirmDelete = () => {
    if (!videoToDelete) return;
    
    deleteVideo(videoToDelete.id);
    setIsDeleteDialogOpen(false);
    setVideoToDelete(null);
    
    toast({
      title: "Vídeo excluído",
      description: "O vídeo foi removido da sua biblioteca."
    });
  };

  // Abrir preview do vídeo
  const handlePreviewClick = (video: Video) => {
    setSelectedVideo(video);
    setIsPreviewOpen(true);
  };

  // Editar vídeo
  const handleEditClick = (videoId: string) => {
    navigate(`/video/edit/${videoId}`);
  };

  // Categorias disponíveis
  const categories = [
    { id: "todos", name: "Todos" },
    { id: "geral", name: "Geral" },
    { id: "educacao", name: "Educação" },
    { id: "marketing", name: "Marketing" },
    { id: "produto", name: "Produto" },
    { id: "eventos", name: "Eventos" },
    { id: "outros", name: "Outros" }
  ];

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      
      {/* Filtros e Pesquisa */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar vídeos..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Categorias
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrar por categoria</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.map((category) => (
              <DropdownMenuItem 
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={selectedCategory === category.id ? "bg-secondary/20" : ""}
              >
                {category.name}
                {selectedCategory === category.id && (
                  <span className="ml-auto">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Lista de Vídeos */}
      {videos.length === 0 ? (
        <Card className="w-full">
          <CardContent className="pt-6">
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
      ) : filteredVideos.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-4">
          <div className="bg-secondary/10 p-4 rounded-full">
            <Search className="h-12 w-12 text-secondary" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium">Nenhum resultado encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tente usar termos diferentes ou remover os filtros
            </p>
          </div>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("todos");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard 
              key={video.id}
              video={video}
              onPreview={() => handlePreviewClick(video)}
              onEdit={() => handleEditClick(video.id)}
              onDelete={() => handleDeleteClick(video)}
            />
          ))}
        </div>
      )}
      
      {/* Diálogo de pré-visualização do vídeo */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>
              {selectedVideo?.description || "Sem descrição"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVideo && (
            <VideoPlayer videoUrl={selectedVideo.url} />
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedVideo?.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock3 className="h-4 w-4" />
              <span>{formatDate(selectedVideo?.dateUploaded || "")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{selectedVideo?.views || 0} visualizações</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir vídeo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o vídeo "{videoToDelete?.title}"? Esta ação não pode ser desfeita.
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
    </Container>
  );
};

export default Library;
