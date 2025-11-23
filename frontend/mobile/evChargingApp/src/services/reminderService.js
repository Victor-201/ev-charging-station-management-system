import { Platform } from 'react-native';
import RNCalendarEvents from 'react-native-calendar-events';

const reminderService = {
  ensurePermission: async () => {
    if (Platform.OS !== 'ios') return { authorized: false, reason: 'Reminders are iOS only' };
    try {
      const requestRemindersPermissions = RNCalendarEvents.requestRemindersPermissions || RNCalendarEvents.requestPermissions;
      const status = await requestRemindersPermissions();
      const authorized = (status === 'authorized') || (status?.reminder === 'authorized') || (status?.status === 'authorized');
      return { authorized, status };
    } catch (e) {
      return { authorized: false, error: e };
    }
  },

  createBookingReminder: async ({ stationName, startTime }) => {
    if (Platform.OS !== 'ios') return { ok: false, error: 'Reminders not supported on Android' };
    const permission = await reminderService.ensurePermission();
    if (!permission.authorized) return { ok: false, error: 'Permission denied' };

    const start = new Date(startTime);
    if (isNaN(start.getTime())) throw new Error('Invalid start time');
    const reminderTime = new Date(start.getTime() - 15 * 60 * 1000);

    try {
      const saveReminder = RNCalendarEvents.saveReminder;
      if (typeof saveReminder === 'function') {
        const id = await saveReminder({
          title: `Sạc xe tại ${stationName}`,
          notes: 'Lời nhắc được tạo tự động từ EV Charging App',
          dueDate: reminderTime.toISOString(),
          alarms: [{ date: reminderTime.toISOString() }],
        });
        return { ok: true, id, type: 'reminder' };
      }

      // Fallback: create calendar event with alert 15 minutes before
      const id = await RNCalendarEvents.saveEvent(`Sạc xe tại ${stationName}` , {
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        notes: 'Nhắc nhở trước 15 phút',
        alarms: [{ relativeOffset: -15 }],
      });
      return { ok: true, id, type: 'calendar-event' };
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  }
};

export default reminderService;

