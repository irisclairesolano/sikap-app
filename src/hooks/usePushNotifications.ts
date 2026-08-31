import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { navigationRef } from '../../App';
import { User } from '../types';
import * as SecureStore from '../utils/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const queryClient = useQueryClient();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        console.log('Expo Push Token:', token);
      } catch (_) {
        token = await Notifications.getExpoPushTokenAsync({
          projectId: '1b899a77-3e16-41b4-ac5d-007e155bc293', // dummy fallback
        });
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
      // Real-time invalidation to update badges/lists instantly in the foreground
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification Response:', response);
      const data = response.notification.request.content.data;
      const appId = data?.application_id || data?.applicationId;
      const jobId = data?.job_id || data?.jobId;

      let retries = 0;
      const tryNavigate = async () => {
        let role = queryClient.getQueryData<User>(['profile'])?.role;
        if (!role) {
          try {
            const cachedUserStr = await SecureStore.getItemAsync('user_profile');
            if (cachedUserStr) {
              const cachedUser = JSON.parse(cachedUserStr);
              role = cachedUser?.role;
            }
          } catch (_) {}
        }
        const ready = navigationRef.isReady();

        if (ready && role) {
          if (appId) {
            if (role === 'employer') {
              navigationRef.navigate('Employer', {
                screen: 'ApplicantDetail',
                params: { applicantId: appId },
              });
            } else {
              navigationRef.navigate('Worker', {
                screen: 'ApplicationDetail',
                params: { applicationId: appId },
              });
            }
          } else if (jobId) {
            if (role === 'employer') {
              navigationRef.navigate('Employer', {
                screen: 'JobStatusManagement',
                params: { id: jobId },
              });
            } else {
              navigationRef.navigate('Worker', {
                screen: 'JobDetails',
                params: { id: jobId },
              });
            }
          }
        } else if (retries < 25) {
          retries++;
          setTimeout(tryNavigate, 300);
        }
      };
      tryNavigate();
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [queryClient]);

  return { expoPushToken, notification };
};
