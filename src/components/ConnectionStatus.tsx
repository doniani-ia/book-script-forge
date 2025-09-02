import { useConnectionStatus } from '@/hooks/use-connection-status';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export const ConnectionStatus = () => {
  const { isOnline, wsConnected, isFullyConnected } = useConnectionStatus();

  if (isFullyConnected) {
    return null; // Don't show anything when everything is working
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <Badge variant="destructive" className="text-xs">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      ) : !wsConnected ? (
        <Badge variant="outline" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          WebSocket
        </Badge>
      ) : null}
    </div>
  );
};
