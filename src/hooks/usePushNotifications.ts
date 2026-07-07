import { useState } from 'react';
import * as Notifications from 'expo-notifications';

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
  const [notification] = useState<Notifications.Notification | undefined>();

  // Notifications are temporarily disabled for Expo Go testing.
  // To test push notifications, you will need to build a custom dev client
  // using `eas build --profile development`.

  return {
    expoPushToken,
    notification,
  };
};
