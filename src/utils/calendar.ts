import ical, { ICalCalendarMethod } from 'ical-generator';
import { Task } from '@/hooks/optimized';

export const generateICal = (tasks: Task[]) => {
  const calendar = ical({
    name: 'Gantt Flow Tasks',
    method: ICalCalendarMethod.PUBLISH,
  });

  tasks.forEach(task => {
    if (task.due_date) {
      calendar.createEvent({
        start: new Date(task.due_date),
        end: new Date(task.due_date), // Pour l'instant, événements d'une journée
        summary: task.title,
        description: task.description || '',
        location: 'Gantt Flow',
        url: window.location.href,
      });
    }
  });

  const blob = new Blob([calendar.toString()], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'tasks.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
