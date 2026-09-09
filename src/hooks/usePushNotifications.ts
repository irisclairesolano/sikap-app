// Push notifications stub for Expo Go compatibility
export interface PushNotificationState {
  expoPushToken?: any;
  notification?: any;
}

export const usePushNotifications = (): PushNotificationState => {
  // Push notifications temporarily bypassed so the project runs cleanly in Expo Go
  return { expoPushToken: undefined, notification: undefined };
};
