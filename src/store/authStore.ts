
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  nome?: string;
}

interface AuthState {
  session: any | null; // Tipo do Supabase Auth Session
  user: UserProfile | null;
  loading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nome?: string) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      loading: false,
      
      login: async (email, password) => {
        set({ loading: true });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) {
            throw error;
          }
          
          set({ session: data.session, loading: false });
          toast({
            title: "Login realizado com sucesso",
            description: "Bem-vindo de volta!"
          });
          
          // Buscar perfil do usuário após login
          get().getProfile();
          
        } catch (error: any) {
          console.error('Erro no login:', error);
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive"
          });
          set({ loading: false });
        }
      },
      
      signup: async (email, password, nome) => {
        set({ loading: true });
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                nome
              }
            }
          });
          
          if (error) {
            throw error;
          }
          
          set({ session: data.session, loading: false });
          toast({
            title: "Conta criada com sucesso",
            description: "Bem-vindo ao Epic Moments!"
          });
          
          // Buscar perfil do usuário após cadastro
          if (data.session) {
            get().getProfile();
          }
          
        } catch (error: any) {
          console.error('Erro no cadastro:', error);
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive"
          });
          set({ loading: false });
        }
      },
      
      logout: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            throw error;
          }
          
          set({ session: null, user: null });
          toast({
            title: "Logout realizado",
            description: "Você saiu da sua conta."
          });
          
        } catch (error: any) {
          console.error('Erro no logout:', error);
          toast({
            title: "Erro no logout",
            description: error.message,
            variant: "destructive"
          });
        }
      },
      
      getProfile: async () => {
        const session = get().session;
        if (!session) return;
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            throw error;
          }
          
          set({ 
            user: {
              id: data.id,
              email: session.user.email,
              nome: data.nome
            } 
          });
          
        } catch (error: any) {
          console.error('Erro ao buscar perfil:', error);
        }
      },
      
      updateProfile: async (updates) => {
        const session = get().session;
        if (!session) return;
        
        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id);
          
          if (error) {
            throw error;
          }
          
          set({ user: { ...get().user, ...updates } as UserProfile });
          toast({
            title: "Perfil atualizado",
            description: "Suas informações foram atualizadas com sucesso."
          });
          
        } catch (error: any) {
          console.error('Erro ao atualizar perfil:', error);
          toast({
            title: "Erro ao atualizar perfil",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    }),
    {
      name: "epic-moments-auth",
    }
  )
);

// Função para verificar a sessão inicial
export const initializeAuth = async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    useAuthStore.getState().session = data.session;
    useAuthStore.getState().getProfile();
  }
  
  // Ouvir mudanças na autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.getState().session = session;
    
    if (session) {
      useAuthStore.getState().getProfile();
    } else {
      useAuthStore.getState().user = null;
    }
  });
};
