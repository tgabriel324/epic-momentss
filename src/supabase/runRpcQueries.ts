
import { supabase } from "@/integrations/supabase/client";

// Função para incrementar visualizações
export const incrementVideoViews = async (videoId: string) => {
  try {
    // Usando type assertion (any) para contornar o problema de tipagem
    const params: Record<string, any> = { video_id: videoId };
    
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
