import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'teams' | 'webhook' | 'sms';
  config: any;
  enabled: boolean;
}

export const useNotificationChannels = () => {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendEmailNotifications = async (notificationIds: string[]) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: {
          notificationIds,
          type: 'send_emails',
        },
      });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${data.results.filter((r: any) => r.status === 'email_sent').length} emails envoyés`,
      });

      return data;
    } catch (error: any) {
      console.error('Error sending email notifications:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer les emails de notification",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendSlackNotification = async (notificationIds: string[], webhookUrl: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: {
          notificationIds,
          type: 'send_webhook',
          webhookUrl,
        },
      });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Notifications Slack envoyées',
      });

      return data;
    } catch (error: any) {
      console.error('Error sending Slack notification:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer les notifications Slack",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTeamsNotification = async (notificationIds: string[], webhookUrl: string) => {
    try {
      setLoading(true);

      // Pour Teams, on adapte le format du message
      const teamsData = await Promise.all(
        notificationIds.map(async id => {
          const { data: notification } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', id)
            .single();

          const { data: recipient } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', notification?.recipient_id)
            .maybeSingle();

          return {
            '@type': 'MessageCard',
            '@context': 'http://schema.org/extensions',
            themeColor: notification?.priority === 'urgent' ? 'd63384' : '0078d4',
            summary: notification?.title,
            sections: [
              {
                activityTitle: notification?.title,
                activitySubtitle: `Pour: ${recipient?.full_name || 'Utilisateur'}`,
                activityImage: 'https://via.placeholder.com/64/0078d4/ffffff?text=📢',
                facts: [
                  {
                    name: 'Message:',
                    value: notification?.message,
                  },
                  {
                    name: 'Priorité:',
                    value: notification?.priority,
                  },
                  {
                    name: 'Type:',
                    value: notification?.notification_type,
                  },
                ],
              },
            ],
          };
        })
      );

      for (const message of teamsData) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          throw new Error(`Teams webhook failed: ${response.statusText}`);
        }
      }

      toast({
        title: 'Succès',
        description: 'Notifications Teams envoyées',
      });
    } catch (error: any) {
      console.error('Error sending Teams notification:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer les notifications Teams",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendWebPushNotification = async (
    title: string,
    message: string,
    options?: NotificationOptions
  ) => {
    if (!('Notification' in window)) {
      toast({
        title: 'Non supporté',
        description: 'Les notifications push ne sont pas supportées sur ce navigateur',
        variant: 'destructive',
      });
      return;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: 'Permission refusée',
        description:
          'Les notifications push sont bloquées. Veuillez les autoriser dans les paramètres du navigateur.',
        variant: 'destructive',
      });
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission refusée',
          description: 'Permission de notification refusée',
          variant: 'destructive',
        });
        return;
      }
    }

    new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  };

  // Configuration des canaux par défaut
  const defaultChannels: NotificationChannel[] = [
    {
      id: 'email',
      name: 'Email',
      type: 'email',
      config: { enabled: true },
      enabled: true,
    },
    {
      id: 'browser',
      name: 'Notifications navigateur',
      type: 'webhook',
      config: { type: 'browser_push' },
      enabled: true,
    },
    {
      id: 'slack',
      name: 'Slack',
      type: 'slack',
      config: { webhookUrl: '' },
      enabled: false,
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      type: 'teams',
      config: { webhookUrl: '' },
      enabled: false,
    },
  ];

  useEffect(() => {
    setChannels(defaultChannels);
  }, []);

  return {
    channels,
    loading,
    sendEmailNotifications,
    sendSlackNotification,
    sendTeamsNotification,
    sendWebPushNotification,
    setChannels,
  };
};
