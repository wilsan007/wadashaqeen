import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { TaskNotificationEmail } from './_templates/task-notification.tsx';
import { HRNotificationEmail } from './_templates/hr-notification.tsx';
import { sendEmail } from '../_shared/smtpClient.ts';
import { validateWebhookSecret, corsHeaders } from '../_shared/validateWebhook.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function getNotificationDetails(notificationId) {
  const { data: notification, error: notifError } = await supabase
    .from('notifications')
    .select(
      `
      *,
      recipient:profiles!notifications_recipient_id_fkey(
        full_name,
        email,
        user_id
      )
    `
    )
    .eq('id', notificationId)
    .single();
  if (notifError || !notification) {
    throw new Error(`Notification not found: ${notifError?.message}`);
  }
  return notification;
}
async function sendTaskNotificationEmail(notification) {
  const emailHtml = await renderAsync(
    React.createElement(TaskNotificationEmail, {
      recipientName: notification.recipient?.full_name || 'Utilisateur',
      taskTitle: notification.metadata?.task_title || notification.title,
      notificationType: notification.notification_type.replace('task_', ''),
      message: notification.message,
      taskUrl: `${Deno.env.get('SITE_URL') || 'https://your-app.com'}/tasks?task=${notification.entity_id}`,
      priority: notification.priority,
      dueDate: notification.metadata?.due_date,
      projectName: notification.metadata?.project_name,
    })
  );

  try {
    await sendEmail({
      from: 'Gestion de Projet <notifications@wadashaqayn.org>',
      to: notification.recipient.email,
      subject: `${notification.title} - ${notification.metadata?.task_title || ''}`,
      html: emailHtml,
    });
  } catch (error) {
    throw error;
  }
}
async function sendHRNotificationEmail(notification) {
  const notificationType = notification.notification_type.includes('leave')
    ? 'leave_request'
    : notification.notification_type.includes('expense')
      ? 'expense_report'
      : 'hr_alert';
  const status = notification.notification_type.includes('approved')
    ? 'approved'
    : notification.notification_type.includes('rejected')
      ? 'rejected'
      : notification.notification_type.includes('submitted')
        ? 'submitted'
        : undefined;
  const emailHtml = await renderAsync(
    React.createElement(HRNotificationEmail, {
      recipientName: notification.recipient?.full_name || 'Utilisateur',
      notificationType,
      status,
      entityTitle: notification.metadata?.entity_title || notification.title,
      message: notification.message,
      entityUrl: `${Deno.env.get('SITE_URL') || 'https://your-app.com'}/hr`,
      submitterName: notification.metadata?.submitter_name,
      amount: notification.metadata?.amount,
      startDate: notification.metadata?.start_date,
      endDate: notification.metadata?.end_date,
    })
  );

  try {
    await sendEmail({
      from: 'Ressources Humaines <hr@wadashaqayn.org>',
      to: notification.recipient.email,
      subject: `${notification.title}`,
      html: emailHtml,
    });
  } catch (error) {
    throw error;
  }
}
async function sendSlackNotification(notification, webhookUrl) {
  const slackMessage = {
    text: `🔔 ${notification.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: notification.title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Pour:* ${notification.recipient?.full_name}\n*Message:* ${notification.message}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Priorité: ${notification.priority} | Type: ${notification.notification_type}`,
          },
        ],
      },
    ],
  };
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slackMessage),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
}
Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Valider le secret webhook (protection sans JWT)
  const authError = validateWebhookSecret(req);
  if (authError) return authError;

  try {
    const { notificationIds, type, webhookUrl } = await req.json();
    console.log(`Processing ${type} for ${notificationIds.length} notifications`);
    const results = [];
    for (const notificationId of notificationIds) {
      try {
        const notification = await getNotificationDetails(notificationId);
        // Check if user has email notifications enabled for this type
        const { data: preferences } = await supabase
          .from('notification_preferences')
          .select('email_enabled')
          .eq('user_id', notification.recipient.user_id)
          .eq('notification_type', notification.notification_type)
          .single();
        const emailEnabled = preferences?.email_enabled !== false; // Default to true
        if (type === 'send_emails' && emailEnabled) {
          // Determine email template based on notification type
          if (notification.notification_type.startsWith('task_')) {
            await sendTaskNotificationEmail(notification);
          } else if (
            notification.notification_type.includes('leave') ||
            notification.notification_type.includes('expense')
          ) {
            await sendHRNotificationEmail(notification);
          }
          results.push({
            notificationId,
            status: 'email_sent',
            recipient: notification.recipient.email,
          });
        } else if (type === 'send_webhook' && webhookUrl) {
          await sendSlackNotification(notification, webhookUrl);
          results.push({
            notificationId,
            status: 'webhook_sent',
            webhook: webhookUrl,
          });
        } else {
          results.push({
            notificationId,
            status: 'skipped',
            reason: emailEnabled ? 'type_not_supported' : 'email_disabled',
          });
        }
      } catch (error) {
        console.error(`Error processing notification ${notificationId}:`, error);
        results.push({
          notificationId,
          status: 'error',
          error: error.message,
        });
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in send-notifications function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
