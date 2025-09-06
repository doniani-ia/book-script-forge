import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { AuthForm } from "@/components/auth/AuthForm";
import { Navbar } from "@/components/layout/Navbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DebugInfo } from "@/components/DebugInfo";
import Index from "./pages/Index";
import Generator from "./pages/Generator";
import Admin from "./pages/Admin";
import Scripts from "./pages/Scripts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  // Timeout de segurança para evitar loading infinito
  const [showFallback, setShowFallback] = useState(false);
  
  useEffect(() => {
    console.log('🔄 [App] Loading state changed:', loading);
    
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [App] Loading timeout reached (10s), showing fallback');
        setShowFallback(true);
      }
    }, 10000); // Reduzido para 10 segundos

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Fallback se o loading demorar muito
  if (showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Erro de Carregamento</h1>
          <p className="text-muted-foreground">A aplicação está demorando para carregar.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DebugInfo />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<AuthForm />} />
        
        {/* Rotas protegidas */}
        {user ? (
          <>
            <Route path="/generator" element={
              <>
                <Navbar />
                <Generator />
              </>
            } />
            <Route path="/admin" element={
              <>
                <Navbar />
                <Admin />
              </>
            } />
            <Route path="/scripts" element={
              <>
                <Navbar />
                <Scripts />
              </>
            } />
          </>
        ) : (
          // Redirecionar para login se tentar acessar rota protegida
          <Route path="*" element={<AuthForm />} />
        )}
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
