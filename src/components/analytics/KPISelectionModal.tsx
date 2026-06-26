import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { FolderKanban, CheckSquare, Zap, Users, Settings2, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export const KPI_CATEGORIES = [
    { id: 'projects', labelKey: 'kpi.category.projects', icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'tasks', labelKey: 'kpi.category.tasks', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'performance', labelKey: 'kpi.category.performance', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'team', labelKey: 'kpi.category.team', icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
] as const;

export type KPICategoryId = typeof KPI_CATEGORIES[number]['id'];

export interface KPIConfig {
    id: string;
    label: string;
    category: KPICategoryId;
    description?: string;
}

interface KPISelectionModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    kpis: KPIConfig[];
    preferences: Record<string, boolean>;
    onToggle: (kpiId: string) => void;
    onShowAll: () => void;
    onHideAll: () => void;
}

export const KPISelectionModal: React.FC<KPISelectionModalProps> = ({
    isOpen,
    onOpenChange,
    kpis,
    preferences,
    onToggle,
    onShowAll,
    onHideAll,
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<KPICategoryId>('projects');

    const activeKpis = kpis.filter(k => k.category === activeTab);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border/50 shadow-2xl rounded-xl sm:rounded-2xl gap-0 h-[600px] flex flex-col sm:flex-row">

                {/* Sidebar - macOS Style */}
                <div className="w-full sm:w-64 bg-muted/30 border-r border-border/50 flex flex-col h-full">
                    <DialogHeader className="p-6 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                            <Settings2 className="w-5 h-5 text-primary" />
                            {t('kpi.modal.title')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1">
                            {t('kpi.modal.subtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                        {KPI_CATEGORIES.map((category) => {
                            const Icon = category.icon;
                            const isActive = activeTab === category.id;
                            // Count how many KPIs in this category are currently enabled
                            const categoryKpis = kpis.filter(k => k.category === category.id);
                            const enabledCount = categoryKpis.filter(k => preferences[k.id]).length;

                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveTab(category.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                        isActive
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <div className={cn("p-1.5 rounded-md", isActive ? category.bg : "bg-muted")}>
                                        <Icon className={cn("w-4 h-4", isActive ? category.color : "")} />
                                    </div>
                                    <span className="flex-1 text-left">{t(category.labelKey)}</span>
                                    {enabledCount > 0 && (
                                        <span className="text-[10px] tabular-nums font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                            {enabledCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-border/50 space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-center text-xs" onClick={onShowAll}>
                            {t('managerDashboard.showAll')}
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-center text-xs opacity-70 hover:opacity-100" onClick={onHideAll}>
                            {t('managerDashboard.hideAll')}
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-background/50 flex flex-col h-full">
                    <div className="p-6 border-b border-border/50 flex items-center justify-between">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
                            {t(KPI_CATEGORIES.find(c => c.id === activeTab)?.labelKey || '')}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-4 max-w-2xl mx-auto">
                            {activeKpis.map((kpi) => (
                                <label
                                    key={kpi.id}
                                    className={cn(
                                        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:border-primary/50",
                                        preferences[kpi.id] ? "bg-primary/5 border-primary/30" : "bg-card border-border/50 hover:bg-muted/20"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-foreground">
                                            {kpi.label}
                                        </p>
                                        {kpi.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {kpi.description}
                                            </p>
                                        )}
                                    </div>
                                    <Switch
                                        checked={preferences[kpi.id]}
                                        onCheckedChange={() => onToggle(kpi.id)}
                                        className="data-[state=checked]:bg-primary shrink-0"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
};
