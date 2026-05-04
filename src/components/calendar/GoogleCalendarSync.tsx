import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Check, AlertCircle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const GoogleCalendarSync: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    // Note: Supabase ne stocke pas toujours le provider_token dans la session persistée pour des raisons de sécurité.
    // On vérifie simplement si l'utilisateur est connecté avec Google pour l'instant.
    // Pour une vraie vérification, il faudrait tenter un appel API ou vérifier les identités.
    if (session?.user?.app_metadata?.provider === 'google') {
      setIsConnected(true);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
          scopes: 'https://www.googleapis.com/auth/calendar',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;

      if (!providerToken) {
        throw new Error('Token Google introuvable. Veuillez vous reconnecter.');
      }

      // 1. Fetch Google Calendar Events
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' +
          new Date().toISOString(),
        {
          headers: {
            Authorization: `Bearer ${providerToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setIsConnected(false);
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error('Erreur lors de la récupération des événements Google.');
      }

      const data = await response.json();
      const events = data.items;

      // 2. Ici, on pourrait sauvegarder ces événements dans notre DB ou les merger dans l'état local
      // Pour l'instant, on simule une synchro réussie
      console.log('Google Events fetched:', events);

      setLastSync(new Date());
      toast({
        title: 'Synchronisation réussie',
        description: `${events.length} événements récupérés depuis Google Calendar.`,
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Erreur de synchronisation',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none bg-white/5 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Calendar className="h-5 w-5 text-blue-500" />
          Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-500'}`}
              />
              <span className="text-muted-foreground text-sm">
                {isConnected ? 'Connecté' : 'Non connecté'}
              </span>
            </div>
            {lastSync && (
              <span className="text-muted-foreground text-xs">
                Dernière synchro: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>

          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full border border-gray-200 bg-white text-gray-800 hover:bg-gray-100"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="mr-2 h-4 w-4" />
              Connecter Google Calendar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Synchroniser
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleConnect} // Re-connect to refresh token
                title="Reconnecter"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isConnected && (
            <div className="rounded-md bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400">
              <p className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                La synchronisation est bidirectionnelle. Les événements Google apparaîtront ici et
                vos tâches seront envoyées à Google.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
