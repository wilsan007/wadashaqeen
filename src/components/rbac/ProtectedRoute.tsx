/**
 * ProtectedRoute — Route-level access guard.
 *
 * Supports three orthogonal access criteria (use the most semantically
 * appropriate one for each route):
 *   - feature:       AppFeature key (preferred — maps to FEATURE_PERMISSIONS)
 *   - permission:    explicit Permission string
 *   - minimumRole:   RoleName floor in the hierarchy
 *
 * Behaviour:
 *   - While loading: renders a branded spinner (deny-by-default UX).
 *   - Access denied + showAccessDenied=true:  renders an inline denial card.
 *   - Access denied + showAccessDenied=false: redirects to redirectTo (default '/').
 *   - Access granted: renders children.
 */

import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAccessContext } from '@/contexts/AccessContext';
import type { AppFeature, Permission, RoleName } from '@/lib/rbac/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProtectedRouteProps {
  children: ReactNode;
  /** Check via FEATURE_PERMISSIONS map (preferred). */
  feature?: AppFeature;
  /** Check a specific Permission string directly. */
  permission?: Permission;
  /** Check that the user meets or exceeds this role level. */
  minimumRole?: RoleName;
  /** Where to redirect on denied access (default: '/'). */
  redirectTo?: string;
  /**
   * When true, render an inline denial card instead of redirecting.
   * Defaults to true so the user gets feedback rather than a silent redirect.
   */
  showAccessDenied?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  feature,
  permission,
  minimumRole,
  redirectTo = '/',
  showAccessDenied = true,
}) => {
  const { access, isLoading, hasPermission, hasMinimumRole, canAccess } = useAccessContext();

  // ------------------------------------------------------------------
  // 1. Loading state — deny by default until we have resolved access.
  // ------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2" />
          <p className="text-muted-foreground text-sm">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. Not authenticated — redirect.
  // ------------------------------------------------------------------

  if (!access) {
    return <Navigate to={redirectTo} replace />;
  }

  // ------------------------------------------------------------------
  // 3. Access check — deny-by-default (hasAccess starts false).
  // ------------------------------------------------------------------

  let hasAccess = false;
  let denialContext = '';

  if (feature !== undefined) {
    hasAccess = canAccess(feature);
    denialContext = `Fonctionnalité requise : ${feature}`;
  } else if (permission !== undefined) {
    hasAccess = hasPermission(permission);
    denialContext = `Permission requise : ${permission}`;
  } else if (minimumRole !== undefined) {
    hasAccess = hasMinimumRole(minimumRole);
    denialContext = `Rôle minimum requis : ${minimumRole}`;
  } else {
    // No guard specified — allow any authenticated user.
    hasAccess = true;
  }

  // ------------------------------------------------------------------
  // 4. Access denied.
  // ------------------------------------------------------------------

  if (!hasAccess) {
    if (!showAccessDenied) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-red-600">Accès Refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">Raison</p>
              <p className="mt-1 text-sm text-red-600">{denialContext}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Vos rôles actuels</p>
              <div className="flex flex-wrap gap-2">
                {access.roles.length > 0 ? (
                  access.roles.map(role => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Aucun rôle assigné</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button onClick={() => window.history.back()} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={() => (window.location.href = redirectTo)}
                className="w-full"
              >
                Aller au tableau de bord
              </Button>
            </div>

            <div className="border-t pt-4 text-center">
              <p className="text-muted-foreground text-xs">
                Si vous pensez que c'est une erreur, contactez votre administrateur.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 5. Access granted.
  // ------------------------------------------------------------------

  return <>{children}</>;
};
