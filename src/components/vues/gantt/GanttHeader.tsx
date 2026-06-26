import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays, Clock } from '@/lib/icons';
import { ZoomIn, CalendarRange } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ViewMode } from '@/lib/ganttHelpers';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';

interface GanttHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  yearBuffer?: number;
  onYearBufferChange?: (buffer: number) => void;
}

export const GanttHeader = ({ viewMode, onViewModeChange, yearBuffer = 5, onYearBufferChange }: GanttHeaderProps) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <CardHeader className="from-primary/10 to-accent/10 rounded-t-xl bg-gradient-to-r p-6 pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="from-primary to-accent text-foreground bg-gradient-to-r bg-clip-text text-xl">
          {t('gantt.title')}
        </CardTitle>
        {/* Contrôles de zoom */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'year' && onYearBufferChange && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-foreground/70 hidden sm:inline-block">{t('gantt.displayYears')}:</span>
              <Input
                type="number"
                min={1}
                max={50}
                value={yearBuffer}
                onChange={(e) => onYearBufferChange(Number(e.target.value) || 1)}
                className="w-16 h-8 text-center px-1"
              />
            </div>
          )}
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('day')}
            className="transition-smooth hover-glow gap-1"
          >
            <ZoomIn className="h-4 w-4" />
            {!isMobile && t('gantt.viewDay')}
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('week')}
            className="transition-smooth hover-glow gap-1"
          >
            <CalendarDays className="h-4 w-4" />
            {!isMobile && t('gantt.viewWeek')}
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('month')}
            className="transition-smooth hover-glow gap-1"
          >
            <Calendar className="h-4 w-4" />
            {!isMobile && t('gantt.viewMonth')}
          </Button>
          <Button
            variant={viewMode === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('quarter')}
            className="transition-smooth hover-glow gap-1"
          >
            <Clock className="h-4 w-4" />
            {!isMobile && t('gantt.viewQuarter')}
          </Button>
          <Button
            variant={viewMode === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('year')}
            className="transition-smooth hover-glow gap-1"
          >
            <CalendarRange className="h-4 w-4" />
            {!isMobile && t('gantt.viewYear')}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
