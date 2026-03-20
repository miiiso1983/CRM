import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { meetingsAPI } from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', dateRange],
    queryFn: () => meetingsAPI.getCalendar(dateRange),
    enabled: true,
  });

  const events = (data?.data || []).map(event => ({
    id: event.id,
    title: `${event.title} - ${event.lead?.name}`,
    start: event.start,
    end: event.end,
    extendedProps: event,
    backgroundColor: event.status === 'completed' ? '#10b981' : event.status === 'cancelled' ? '#ef4444' : '#3b82f6',
    borderColor: 'transparent',
  }));

  const handleDatesSet = (arg) => {
    setDateRange({ start: arg.startStr, end: arg.endStr });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={24} className="text-primary-500" /> التقويم
        </h1>
        <p className="text-gray-500 text-sm">عرض الاجتماعات ومواعيد المتابعة</p>
      </div>

      <div className="card">
        <style>{`
          .fc { font-family: 'Cairo', sans-serif; direction: rtl; }
          .fc-toolbar-title { font-size: 1.1rem; font-weight: 700; }
          .fc-button { background: linear-gradient(135deg, #2BB8B0, #1A6085) !important; border: none !important; border-radius: 8px !important; }
          .fc-button:hover { opacity: 0.9 !important; }
          .fc-event { border-radius: 6px !important; padding: 2px 4px !important; font-size: 0.75rem !important; }
          .fc-day-today { background-color: #eff6ff !important; }
        `}</style>

        {isLoading && <div className="h-20 flex items-center justify-center"><LoadingSpinner size="sm" text="" /></div>}

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ar"
          direction="rtl"
          headerToolbar={{
            right: 'prev,next today',
            center: 'title',
            left: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: 'اليوم',
            month: 'شهر',
            week: 'أسبوع',
            day: 'يوم',
          }}
          events={events}
          datesSet={handleDatesSet}
          eventClick={(info) => setSelectedEvent(info.event.extendedProps)}
          height="auto"
        />
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedEvent.title}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-gray-600">العميل: </span>{selectedEvent.lead?.name}</p>
              <p><span className="font-semibold text-gray-600">الحالة: </span>{selectedEvent.status}</p>
              {selectedEvent.location && <p><span className="font-semibold text-gray-600">الموقع: </span>{selectedEvent.location}</p>}
            </div>
            <button onClick={() => setSelectedEvent(null)} className="btn-primary mt-4 w-full justify-center">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

