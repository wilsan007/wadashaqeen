import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number;
  is_system_role: boolean;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  context?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  context_type?: string;
  context_id?: string;
  is_active: boolean;
  expires_at?: string;
  role: Role;
}

export const useRoleManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('*').order('hierarchy_level');
      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les rôles',
          variant: 'destructive',
        });
        throw error;
      }
      return data || [];
    },
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource, action');
      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les permissions',
          variant: 'destructive',
        });
        throw error;
      }
      return data || [];
    },
  });

  const { data: userRoles = [], isLoading: userRolesLoading } = useQuery<UserRole[]>({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(
          `
          *,
          role:roles(*)
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les rôles utilisateurs',
          variant: 'destructive',
        });
        throw error;
      }
      return data || [];
    },
  });

  const loading = rolesLoading || permissionsLoading || userRolesLoading;

  const assignUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      roleId,
      contextType,
      contextId,
      expiresAt,
    }: {
      userId: string;
      roleId: string;
      contextType?: string;
      contextId?: string;
      expiresAt?: string;
    }) => {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        context_type: contextType,
        context_id: contextId,
        expires_at: expiresAt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Rôle assigné avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error: any) => {
      console.error('Error assigning role:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'assigner le rôle",
        variant: 'destructive',
      });
    },
  });

  const removeUserRoleMutation = useMutation({
    mutationFn: async (userRoleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', userRoleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Rôle retiré avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error: any) => {
      console.error('Error removing role:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le rôle',
        variant: 'destructive',
      });
    },
  });

  const assignUserRole = async (
    userId: string,
    roleId: string,
    contextType?: string,
    contextId?: string,
    expiresAt?: string
  ) => {
    return assignUserRoleMutation.mutateAsync({ userId, roleId, contextType, contextId, expiresAt });
  };

  const removeUserRole = async (userRoleId: string) => {
    return removeUserRoleMutation.mutateAsync(userRoleId);
  };

  const getUserPermissions = async (userId?: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  };

  const checkUserPermission = async (
    resource: string,
    action: string,
    context?: string,
    contextId?: string
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userRolesData, error } = await supabase
        .from('user_roles')
        .select(
          `
          *,
          roles:role_id (name)
        `
        )
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) return false;

      // Les admins ont toutes les permissions
      return (
        userRolesData?.some(role => ['admin', 'tenant_admin', 'owner'].includes(role.roles.name)) ||
        false
      );
    } catch (error: any) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const canAccessResource = async (
    resourceType: string,
    resourceId: string,
    action: string = 'read'
  ) => {
    // Utiliser la même logique que checkUserPermission
    return await checkUserPermission(resourceType, action);
  };

  const getRolePermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select(
          `
          permission:permissions(*)
        `
        )
        .eq('role_id', roleId);

      if (error) throw error;
      return data?.map(rp => rp.permission) || [];
    } catch (error: any) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  };

  const updateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      // Remove existing permissions
      await supabase.from('role_permissions').delete().eq('role_id', roleId);

      // Add new permissions
      const { error } = await supabase.from('role_permissions').insert(
        permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
        }))
      );

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Permissions du rôle mises à jour',
      });
    } catch (error: any) {
      console.error('Error updating role permissions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les permissions',
        variant: 'destructive',
      });
    }
  };

  const getPermissionsByResource = () => {
    const grouped = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>
    );

    return grouped;
  };

  return {
    roles,
    permissions,
    userRoles,
    loading,
    assignUserRole,
    removeUserRole,
    getUserPermissions,
    checkUserPermission,
    canAccessResource,
    getRolePermissions,
    updateRolePermissions,
    getPermissionsByResource,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  };
};
