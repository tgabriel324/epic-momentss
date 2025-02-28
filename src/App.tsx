
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

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
