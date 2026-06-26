import { Upload, FileText, Download, Trash2 } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  project_id?: string | null;
}

interface DocumentsColumnProps {
  task: Task;
}

interface TaskDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
  uploader_id: string | null;
}

export const DocumentsColumn = ({ task }: DocumentsColumnProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<TaskDocument[]>({
    queryKey: ['task-documents', task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_documents')
        .select('*')
        .eq('task_id', task.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!task.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('task-documents')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('task_documents').insert({
        task_id: task.id,
        project_id: task.project_id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        // Le tenant_id sera automatiquement rempli par le trigger
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-documents', task.id] });
      toast({ title: 'Succès', description: 'Document uploadé avec succès' });
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast({ title: 'Erreur', description: "Échec de l'upload du document", variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: TaskDocument) => {
      const { error: storageError } = await supabase.storage
        .from('task-documents')
        .remove([doc.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('task_documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-documents', task.id] });
      toast({ title: 'Succès', description: 'Document supprimé' });
    },
    onError: (error) => {
      console.error('Error deleting file:', error);
      toast({ title: 'Erreur', description: 'Échec de la suppression', variant: 'destructive' });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    event.target.value = '';
  };

  const downloadDocument = async (doc: TaskDocument) => {
    try {
      const { data, error } = await supabase.storage.from('task-documents').download(doc.file_path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: 'Erreur', description: 'Échec du téléchargement', variant: 'destructive' });
    }
  };

  return (
    <div className="w-64 border-l p-2">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span className="text-sm font-medium">Documents</span>
      </div>

      <div className="space-y-2">
        <label className="block">
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={uploadMutation.isPending}
            className="hidden"
            id={`file-${task.id}`}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={uploadMutation.isPending}
            className="w-full"
            onClick={() => document.getElementById(`file-${task.id}`)?.click()}
          >
            <Upload className="mr-1 h-3 w-3" />
            {uploadMutation.isPending ? 'Upload...' : 'Upload'}
          </Button>
        </label>

        <div className="text-muted-foreground text-center text-sm">
          {isLoading ? 'Chargement...' : `Docs (${documents.length})`}
        </div>

        {documents.length > 0 && (
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {documents.map(doc => (
              <div key={doc.id} className="bg-muted/50 flex items-center gap-1 rounded p-1 text-xs">
                <span className="flex-1 truncate">{doc.file_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(doc)}
                  disabled={deleteMutation.isPending}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
