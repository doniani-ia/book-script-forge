import { useAuth } from '@/components/auth/AuthProvider';
import { useState, useEffect } from 'react';

export const DebugInfo = () => {
  const { user, loading, profile } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    // Verificar conexão com Supabase
    const checkConnection = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          setConnectionStatus('error');
        } else {
          setConnectionStatus('connected');
        }
      } catch (err) {
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, []);

  // Só mostra em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-gray-800 text-white px-3 py-1 rounded text-xs"
      >
        Debug
      </button>
      
      {showDebug && (
        <div className="absolute bottom-8 right-0 bg-gray-900 text-white p-4 rounded text-xs max-w-xs">
          <div className="space-y-2">
            <div><strong>Loading:</strong> {loading ? 'Sim' : 'Não'}</div>
            <div><strong>Usuário:</strong> {user ? 'Logado' : 'Não logado'}</div>
            <div><strong>Perfil:</strong> {profile ? 'Carregado' : 'Não carregado'}</div>
            <div><strong>Conexão:</strong> {connectionStatus}</div>
            <div><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};
