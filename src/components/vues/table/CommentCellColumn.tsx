import { useState } from 'react';
import { MessageSquare, Send } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
}

interface CommentCellProps {
  task: Task;
  isSubtask?: boolean;
}

interface TaskComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string | null;
  comment_type: string | null;
}

const isDemoTask = (id: string) =>
  id.startsWith('00000000-0000-0000-0000') || id.startsWith('ghost-task-');

export const CommentCellColumn = ({ task, isSubtask }: CommentCellProps) => {
  const [newComment, setNewComment] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery<TaskComment[]>({
    queryKey: ['task-comments', task.id],
    queryFn: async () => {
      if (isDemoTask(task.id)) return [];
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!task.id && !isDemoTask(task.id),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('task_comments').insert({
        task_id: task.id,
        content,
        comment_type: 'general',
        tenant_id: '00000000-0000-0000-0000-000000000001',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      toast({ title: 'Succès', description: 'Commentaire ajouté' });
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erreur',
        description: "Échec de l'ajout du commentaire",
        variant: 'destructive',
      });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${isSubtask ? 'h-6 px-1 text-xs' : 'h-8 px-2 text-sm'}`}
        >
          <MessageSquare className={`${isSubtask ? 'mr-1 h-3 w-3' : 'mr-1 h-4 w-4'}`} />
          {comments.length}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Commentaires - {task.title}</DialogTitle>
        </DialogHeader>

        <div className="flex h-96 flex-col">
          <ScrollArea className="mb-3 flex-1">
            <div className="space-y-3 pr-2">
              {comments.length === 0 ? (
                <div className="text-muted-foreground text-center text-sm">Aucun commentaire</div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="bg-muted/30 rounded-md p-2">
                    <div className="text-muted-foreground mb-1 text-xs">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                    <div className="text-sm">{comment.content}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t pt-3">
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="mb-2 min-h-[60px] resize-none"
              disabled={addCommentMutation.isPending}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              size="sm"
              className="w-full"
            >
              <Send className="mr-1 h-3 w-3" />
              {addCommentMutation.isPending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
