
import { supabase } from "@/integrations/supabase/client";

// Função para incrementar visualizações
export const incrementVideoViews = async (videoId: string) => {
  try {
    // Criar um objeto de parâmetros com type assertion para evitar erro
    const params = {
      video_id: videoId
    } as Record<string, any>;
    
    const { error } = await supabase.rpc('increment_views', params);
    
    if (error) {
      console.error('Erro ao incrementar visualizações:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao chamar função RPC:', error);
    return false;
  }
};
