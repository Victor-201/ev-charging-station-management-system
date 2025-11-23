import { Linking, Platform } from 'react-native';
import RNCalendarEvents from 'react-native-calendar-events';

const reminderService = {
  ensurePermission: async () => {
    if (Platform.OS !== 'ios') return { authorized: false, reason: 'Reminders are iOS only' };
    try {
      const check = RNCalendarEvents.checkRemindersPermissions || RNCalendarEvents.checkPermissions;
      const request = RNCalendarEvents.requestRemindersPermissions || RNCalendarEvents.requestPermissions;
      let status = await (typeof check === 'function' ? check() : request());
      const isAuthorized = (status === 'authorized') || (status?.reminder === 'authorized') || (status?.status === 'authorized');
      if (!isAuthorized) {
        status = await request();
      }
      const authorized = (status === 'authorized') || (status?.reminder === 'authorized') || (status?.status === 'authorized');
      const denied = (status === 'denied') || (status?.reminder === 'denied') || (status?.status === 'denied');
      return { authorized, status, denied };
    } catch (e) {
      return { authorized: false, error: e };
    }
  },

  openSettings: async () => {
    if (Platform.OS !== 'ios') return false;
    try { await Linking.openURL('app-settings:'); return true; } catch { return false; }
  },

  createBookingReminder: async ({ stationName, startTime }) => {
    if (Platform.OS !== 'ios') return { ok: false, error: 'Reminders not supported on Android' };

    const start = new Date(startTime);
    if (isNaN(start.getTime())) throw new Error('Invalid start time');
    const reminderTime = new Date(start.getTime() - 15 * 60 * 1000);

    try {
      // Try Reminders API first (if available and permitted)
      const permission = await reminderService.ensurePermission();
      const saveReminder = RNCalendarEvents.saveReminder;
      if (permission.authorized && typeof saveReminder === 'function') {
        const id = await saveReminder({
          title: `Sạc xe tại ${stationName}`,
          notes: 'Lời nhắc được tạo tự động từ EV Charging App',
          dueDate: reminderTime.toISOString(),
          alarms: [{ date: reminderTime.toISOString() }],
        });
        return { ok: true, id, type: 'reminder' };
      }

      // Fallback to Calendar event with alert 15 minutes before
      // Ensure calendar permission
      let calStatus = await (RNCalendarEvents.checkPermissions?.() || RNCalendarEvents.requestPermissions?.());
      if (!(calStatus === 'authorized' || calStatus?.status === 'authorized')) {
        calStatus = await RNCalendarEvents.requestPermissions();
      }
      const calAuthorized = (calStatus === 'authorized' || calStatus?.status === 'authorized');
      if (!calAuthorized) {
        return { ok: false, error: 'Permission denied', needSettings: true };
      }

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

