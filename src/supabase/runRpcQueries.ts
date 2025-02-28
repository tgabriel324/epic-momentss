
import { supabase } from "@/integrations/supabase/client";

// Função para incrementar visualizações
export const incrementVideoViews = async (videoId: string) => {
  try {
    // Usando uma abordagem mais direta com @ts-ignore para contornar o problema de tipagem
    // @ts-ignore - Ignorando verificação de tipo para resolver o problema
    const { error } = await supabase.rpc('increment_views', { video_id: videoId });
    
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
