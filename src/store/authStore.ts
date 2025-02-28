
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
  resendConfirmationEmail: (email: string) => Promise<void>;
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
            // Verificar se o erro é devido a email não confirmado
            if (error.message.includes('Email not confirmed') || error.message.includes('email not confirmed')) {
              toast({
                title: "E-mail não confirmado",
                description: "Por favor, verifique seu e-mail para confirmar sua conta ou solicite um novo link de confirmação.",
                variant: "destructive"
              });
              
              // Podemos oferecer para reenviar o e-mail de confirmação
              const shouldResend = confirm("Deseja receber um novo e-mail de confirmação?");
              if (shouldResend) {
                await get().resendConfirmationEmail(email);
              }
            } else {
              throw error;
            }
            
            set({ loading: false });
            return;
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
              },
              // Desativar a necessidade de confirmação por e-mail
              emailRedirectTo: window.location.origin
            }
          });
          
          if (error) {
            throw error;
          }
          
          set({ loading: false });
          
          if (data.user && !data.session) {
            // Se temos um usuário mas não uma sessão, é porque o e-mail precisa ser confirmado
            toast({
              title: "Conta criada com sucesso",
              description: "Um e-mail de confirmação foi enviado para o seu endereço. Por favor, verifique sua caixa de entrada para continuar.",
            });
          } else {
            // Caso a verificação de e-mail esteja desativada e o usuário já esteja logado
            set({ session: data.session });
            toast({
              title: "Conta criada com sucesso",
              description: "Bem-vindo ao Epic Moments!"
            });
            
            // Buscar perfil do usuário após cadastro
            if (data.session) {
              get().getProfile();
            }
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
      },
      
      // Novo método para reenviar e-mail de confirmação
      resendConfirmationEmail: async (email) => {
        try {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: window.location.origin
            }
          });
          
          if (error) {
            throw error;
          }
          
          toast({
            title: "E-mail enviado",
            description: "Um novo link de confirmação foi enviado para o seu e-mail."
          });
          
        } catch (error: any) {
          console.error('Erro ao reenviar e-mail:', error);
          toast({
            title: "Erro ao reenviar e-mail",
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
