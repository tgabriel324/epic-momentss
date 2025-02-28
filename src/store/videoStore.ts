
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Definição do tipo de vídeo
export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  dateUploaded: string;
  duration: number;
  size: number;
  views: number;
  localFile?: File; // Para armazenar o arquivo local (simulação de upload)
  storagePath?: string; // Caminho no Storage do Supabase
}

// Interface da store de vídeos
interface VideoStore {
  videos: Video[];
  loading: boolean;
  addVideo: (video: Video) => Promise<void>;
  updateVideo: (id: string, updates: Partial<Video>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  getVideoById: (id: string) => Video | undefined;
  searchVideos: (query: string) => Video[];
  filterVideosByCategory: (category: string) => Video[];
  fetchVideos: () => Promise<void>;
}

// URL base do Supabase (usar a URL pública em vez da propriedade protegida)
const SUPABASE_URL = "https://cncqxbhjhfotbrvhtplq.supabase.co";

// Criação da store com persistência local
export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videos: [],
      loading: false,
      
      // Buscar vídeos do Supabase
      fetchVideos: async () => {
        set({ loading: true });
        
        try {
          const { data: videos, error } = await supabase
            .from('videos')
            .select('*')
            .order('date_uploaded', { ascending: false });
          
          if (error) {
            console.error('Erro ao buscar vídeos:', error);
            toast({
              title: "Erro ao carregar vídeos",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          
          // Converter os vídeos do formato do banco para o formato da store
          const formattedVideos = videos.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description || "",
            url: video.url || "",
            thumbnailUrl: video.thumbnail_url || "/placeholder.svg",
            category: video.category || "geral",
            tags: video.tags || [],
            dateUploaded: video.date_uploaded,
            duration: video.duration || 0,
            size: video.size || 0,
            views: video.views || 0,
            storagePath: video.url ? video.url.replace(`${SUPABASE_URL}/storage/v1/object/public/videos/`, '') : undefined
          }));
          
          set({ videos: formattedVideos, loading: false });
        } catch (error) {
          console.error('Erro ao buscar vídeos:', error);
          set({ loading: false });
        }
      },
      
      // Adicionar novo vídeo
      addVideo: async (video) => {
        let storagePath = null;
        let videoUrl = video.url;
        
        // Se houver um arquivo local, fazer upload para o Storage
        if (video.localFile) {
          const fileName = video.localFile.name;
          // Usando type assertion para garantir que fileName é tratado como string
          const fileExt = (fileName as string).split('.').pop();
          const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('videos')
            .upload(filePath, video.localFile);
          
          if (uploadError) {
            console.error('Erro ao fazer upload do vídeo:', uploadError);
            toast({
              title: "Erro no upload",
              description: uploadError.message,
              variant: "destructive"
            });
            return;
          }
          
          storagePath = filePath;
          videoUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${filePath}`;
        }
        
        // Converter tags de string para array se necessário
        let processedTags: string[] = [];
        if (Array.isArray(video.tags)) {
          processedTags = video.tags;
        } else if (typeof video.tags === 'string') {
          // Garantir que estamos trabalhando com string
          processedTags = (video.tags as string).split(',').map(tag => tag.trim());
        }
        
        // Obter o ID do usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Erro de autenticação",
            description: "Você precisa estar logado para realizar esta ação.",
            variant: "destructive"
          });
          return;
        }
        
        // Inserir no banco de dados
        const { data: newVideo, error } = await supabase
          .from('videos')
          .insert({
            title: video.title,
            description: video.description,
            url: videoUrl,
            thumbnail_url: video.thumbnailUrl,
            category: video.category,
            tags: processedTags,
            size: video.size,
            duration: video.duration,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao adicionar vídeo:', error);
          toast({
            title: "Erro ao salvar vídeo",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Converter para o formato da store e adicionar ao estado
        const formattedVideo: Video = {
          id: newVideo.id,
          title: newVideo.title,
          description: newVideo.description || "",
          url: newVideo.url || "",
          thumbnailUrl: newVideo.thumbnail_url || "/placeholder.svg",
          category: newVideo.category || "geral",
          tags: newVideo.tags || [],
          dateUploaded: newVideo.date_uploaded,
          duration: newVideo.duration || 0,
          size: newVideo.size || 0,
          views: newVideo.views || 0,
          storagePath
        };
        
        set((state) => ({ 
          videos: [formattedVideo, ...state.videos] 
        }));
        
        toast({
          title: "Vídeo adicionado",
          description: "O vídeo foi adicionado com sucesso à biblioteca."
        });
      },
      
      // Atualizar vídeo existente
      updateVideo: async (id, updates) => {
        // Converter tags de string para array se necessário
        let updatedTags: string[] | undefined = undefined;
        
        if (updates.tags) {
          if (Array.isArray(updates.tags)) {
            updatedTags = updates.tags;
          } else if (typeof updates.tags === 'string') {
            // Garantir que estamos trabalhando com string
            updatedTags = (updates.tags as string).split(',').map(tag => tag.trim());
          }
        }
        
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('videos')
          .update({
            title: updates.title,
            description: updates.description,
            category: updates.category,
            tags: updatedTags
          })
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao atualizar vídeo:', error);
          toast({
            title: "Erro ao atualizar vídeo",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Atualizar o estado local
        set((state) => ({
          videos: state.videos.map((video) => 
            video.id === id ? { ...video, ...updates } : video
          )
        }));
        
        toast({
          title: "Vídeo atualizado",
          description: "As alterações foram salvas com sucesso."
        });
      },
      
      // Excluir vídeo
      deleteVideo: async (id) => {
        const video = get().videos.find(v => v.id === id);
        
        // Se o vídeo tiver um caminho no storage, excluir o arquivo
        if (video?.storagePath) {
          const { error: storageError } = await supabase.storage
            .from('videos')
            .remove([video.storagePath]);
          
          if (storageError) {
            console.error('Erro ao excluir arquivo do storage:', storageError);
          }
        }
        
        // Excluir do banco de dados
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Erro ao excluir vídeo:', error);
          toast({
            title: "Erro ao excluir vídeo",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        // Atualizar o estado local
        set((state) => ({
          videos: state.videos.filter((video) => video.id !== id)
        }));
        
        toast({
          title: "Vídeo excluído",
          description: "O vídeo foi removido da sua biblioteca."
        });
      },
      
      // Incrementar contagem de visualizações
      incrementViews: async (id) => {
        try {
          // Vamos usar o RPC function criada no Supabase
          // Usar type casting para corrigir erro de tipagem
          const params = { 
            video_id: id 
          } as Record<string, any>;
          
          const { error } = await supabase.rpc('increment_views', params);
          
          if (error) {
            console.error('Erro ao incrementar visualizações:', error);
            return;
          }
          
          set((state) => ({
            videos: state.videos.map((video) => 
              video.id === id ? { ...video, views: video.views + 1 } : video
            )
          }));
        } catch (error) {
          console.error('Erro ao incrementar visualizações:', error);
        }
      },
      
      // Obter vídeo por ID
      getVideoById: (id) => 
        get().videos.find((video) => video.id === id),
      
      // Pesquisar vídeos por texto
      searchVideos: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().videos.filter((video) => 
          video.title.toLowerCase().includes(lowerQuery) || 
          video.description.toLowerCase().includes(lowerQuery) ||
          video.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      },
      
      // Filtrar vídeos por categoria
      filterVideosByCategory: (category) => {
        if (category === "todos") return get().videos;
        return get().videos.filter((video) => video.category === category);
      }
    }),
    {
      name: "epic-moments-videos", // Nome do armazenamento no localStorage
    }
  )
);
