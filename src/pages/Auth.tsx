
import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Container from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { Lock, Mail, User, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { login, signup, session, loading, resendConfirmationEmail } = useAuthStore();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [resendLoading, setResendLoading] = useState(false);
  const [confirmationState, setConfirmationState] = useState({
    loading: false,
    success: false,
    error: null as string | null,
  });
  
  // Verificar tokens na URL (para quando o usuário é redirecionado após confirmar o email)
  useEffect(() => {
    const handleConfirmationTokens = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      if (accessToken && refreshToken && type === 'recovery') {
        // Lógica para confirmação de recuperação de senha
        setConfirmationState({ loading: true, success: false, error: null });
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) throw error;
          
          setConfirmationState({ loading: false, success: true, error: null });
          toast({
            title: "Recuperação bem-sucedida",
            description: "Sua conta foi restaurada com sucesso!"
          });
        } catch (error: any) {
          setConfirmationState({ loading: false, success: false, error: error.message });
          toast({
            title: "Erro na recuperação",
            description: error.message,
            variant: "destructive"
          });
        }
      } else if (accessToken && refreshToken && type === 'signup') {
        // Lógica para confirmação de email após cadastro
        setConfirmationState({ loading: true, success: false, error: null });
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) throw error;
          
          setConfirmationState({ loading: false, success: true, error: null });
          toast({
            title: "E-mail confirmado",
            description: "Sua conta foi verificada com sucesso!"
          });
        } catch (error: any) {
          setConfirmationState({ loading: false, success: false, error: error.message });
          toast({
            title: "Erro na confirmação",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    };
    
    handleConfirmationTokens();
  }, [searchParams]);
  
  // Se já estiver logado, redirecionar para a página inicial
  if (session) {
    return <Navigate to="/" replace />;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    await login(email, password);
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    await signup(email, password, nome);
  };
  
  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu e-mail para receber o link de confirmação.",
        variant: "destructive"
      });
      return;
    }
    
    setResendLoading(true);
    await resendConfirmationEmail(email);
    setResendLoading(false);
  };
  
  // Exibir estado de carregamento durante a confirmação
  if (confirmationState.loading) {
    return (
      <Container className="max-w-md py-10">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Processando...</CardTitle>
            <CardDescription className="text-center">
              Estamos verificando suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          </CardContent>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container className="max-w-md py-10">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/eca1daa0-d180-497b-a269-82b5bfb9fe20.png" 
                alt="Epic Moments Logo" 
                className="h-12"
              />
              <span className="text-2xl font-bold text-primary ml-2">Epic Moments</span>
            </div>
          </div>
          <CardDescription className="text-center">
            Entre na sua conta ou crie uma nova
          </CardDescription>
        </CardHeader>
        <CardContent>
          {confirmationState.success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-800">
              <p className="font-medium">Autenticação bem-sucedida!</p>
              <p className="text-sm">Agora você pode fazer login com suas credenciais.</p>
            </div>
          )}
          
          {confirmationState.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-800">
              <p className="font-medium">Ocorreu um erro</p>
              <p className="text-sm">{confirmationState.error}</p>
            </div>
          )}
          
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-xs"
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                  >
                    <RefreshCcw className="mr-1 h-3 w-3" />
                    {resendLoading ? "Enviando..." : "Reenviar e-mail de confirmação"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      placeholder="Seu nome"
                      className="pl-10"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-center text-muted-foreground mt-2">
            Ao continuar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
          <p className="text-xs text-center text-muted-foreground mt-2">
            <strong>Nota para testes:</strong> Se você estiver usando uma conta recém-criada e encontrar o erro "E-mail não confirmado", 
            você pode usar o botão "Reenviar e-mail de confirmação" acima ou entre em contato com o administrador para ativar sua conta.
          </p>
        </CardFooter>
      </Card>
    </Container>
  );
};

export default Auth;
