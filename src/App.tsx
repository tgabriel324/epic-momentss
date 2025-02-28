
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Library from "./pages/Library";
import QRCodes from "./pages/QRCodes";
import VideoEdit from "./pages/VideoEdit";
import Auth from "./pages/Auth";
import AR from "./pages/AR";
import ARSimulate from "./pages/ARSimulate";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { initializeAuth } from "./store/authStore";
import { supabase } from "./integrations/supabase/client";
import QRScannerPage from "./pages/QRScannerPage";

const queryClient = new QueryClient();

// Componente para lidar com redirecionamentos de autenticação
const AuthRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Verificar se há um token de confirmação
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    const handleSession = async () => {
      if (accessToken && refreshToken && type) {
        try {
          // Tentar atualizar a sessão com os tokens recebidos
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Erro ao configurar sessão:', error);
            navigate('/auth');
            return;
          }
          
          if (data?.user) {
            navigate('/');  // Redirecionar para a página inicial
          } else {
            navigate('/auth');
          }
        } catch (err) {
          console.error('Erro:', err);
          navigate('/auth');
        }
      } else {
        navigate('/auth');
      }
    };
    
    handleSession();
  }, [navigate, searchParams]);
  
  return <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2">Processando autenticação...</h2>
      <p>Você será redirecionado em instantes.</p>
    </div>
  </div>;
};

const App = () => {
  // Inicializar autenticação ao carregar o app
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Routes>
              <Route path="/ar/:id" element={<AR />} />
              <Route path="/qrcodes/simulate/:id" element={<ARSimulate />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthRedirect />} />
              <Route
                path="*"
                element={
                  <>
                    <Navbar />
                    <main className="flex-grow">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/upload" element={
                          <ProtectedRoute>
                            <Upload />
                          </ProtectedRoute>
                        } />
                        <Route path="/library" element={
                          <ProtectedRoute>
                            <Library />
                          </ProtectedRoute>
                        } />
                        <Route path="/qrcodes" element={
                          <ProtectedRoute>
                            <QRCodes />
                          </ProtectedRoute>
                        } />
                        <Route path="/qrcodes/scanner" element={
                          <ProtectedRoute>
                            <QRScannerPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/video/edit/:id" element={
                          <ProtectedRoute>
                            <VideoEdit />
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
