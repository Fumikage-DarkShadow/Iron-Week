import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Setup notification handler — web-safe (silently no-op on web)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Silent fail
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleWorkoutReminder(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const granted = await requestPermissions();
    if (!granted) return;
    await cancelAllReminders();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Iron Week',
        body: 'Tu as une séance aujourd\'hui !',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Silent fail
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silent fail
  }
}
