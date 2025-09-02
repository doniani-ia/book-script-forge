import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão restaurada",
        description: "Você está online novamente.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Conexão perdida",
        description: "Verifique sua conexão com a internet.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return {
    isOnline,
    wsConnected: true, // Simplified - assume WebSocket is always connected
    isFullyConnected: isOnline
  };
};
