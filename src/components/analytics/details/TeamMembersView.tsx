import React from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, User, Briefcase, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TeamMembersView: React.FC = () => {
    const { employees, departments, loading } = useEmployees();

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
        );
    }

    // Build dept name map
    const deptMap = React.useMemo(() => {
        const m: Record<string, string> = {};
        departments.forEach(d => { m[d.id] = d.name; });
        return m;
    }, [departments]);

    // Group by department
    const byDept = React.useMemo(() => {
        const map: Record<string, typeof employees> = {};
        employees.forEach(emp => {
            const dept = emp.department_id ? deptMap[emp.department_id] || 'Sans département' : 'Sans département';
            if (!map[dept]) map[dept] = [];
            map[dept].push(emp);
        });
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }, [employees, deptMap]);

    if (!employees.length) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Aucun membre d'équipe trouvé.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                    <div className="text-primary font-bold text-xl">{employees.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</div>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
                    <div className="text-success font-bold text-xl">{departments.length}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Départements</div>
                </div>
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center">
                    <div className="text-accent font-bold text-xl">
                        {employees.filter(e => e.contract_type === 'CDI' || !e.contract_type).length}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">CDI</div>
                </div>
            </div>

            {/* By department */}
            {byDept.map(([deptName, members]) => (
                <div key={deptName}>
                    <div className="flex items-center gap-2 mb-2 border-b pb-1">
                        <Building className="w-3.5 h-3.5 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{deptName}</h3>
                        <Badge variant="secondary" className="ml-auto h-5 text-[10px]">{members.length}</Badge>
                    </div>
                    <div className="space-y-2">
                        {members.map(emp => (
                            <div key={emp.id} className="modern-card p-3 flex items-center gap-3 bg-card/60 backdrop-blur-sm hover:shadow-sm transition-shadow">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                    {emp.full_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{emp.full_name}</h4>
                                    {emp.job_title && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                            <Briefcase className="w-3 h-3" /> {emp.job_title}
                                        </p>
                                    )}
                                </div>
                                {emp.contract_type && (
                                    <Badge variant="outline" className="h-5 text-[10px] shrink-0">{emp.contract_type}</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
