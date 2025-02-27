
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

// Interface da store de vídeos
interface VideoStore {
  videos: Video[];
  addVideo: (video: Video) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  incrementViews: (id: string) => void;
  getVideoById: (id: string) => Video | undefined;
  searchVideos: (query: string) => Video[];
  filterVideosByCategory: (category: string) => Video[];
}

// Criação da store com persistência local
export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      videos: [],
      
      // Adicionar novo vídeo
      addVideo: (video) => 
        set((state) => ({ 
          videos: [video, ...state.videos] 
        })),
      
      // Atualizar vídeo existente
      updateVideo: (id, updates) => 
        set((state) => ({
          videos: state.videos.map((video) => 
            video.id === id ? { ...video, ...updates } : video
          )
        })),
      
      // Excluir vídeo
      deleteVideo: (id) => 
        set((state) => ({
          videos: state.videos.filter((video) => video.id !== id)
        })),
      
      // Incrementar contagem de visualizações
      incrementViews: (id) => 
        set((state) => ({
          videos: state.videos.map((video) => 
            video.id === id ? { ...video, views: video.views + 1 } : video
          )
        })),
      
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
