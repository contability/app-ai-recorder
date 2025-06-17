import messaging from '@react-native-firebase/messaging';
import {useEffect, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

// 푸시 알림 토큰 가져오기 커스텀 훅

const requestIosPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
};

const requestAndroidPermission = async () => {
  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  const enabled = status === 'granted';
  return enabled;
};

const registerForPushNotificationsAsync = async () => {
  // request*Permission이 실행되면 각 OS에 맞게 모달창으로 알림 권한 허용할지 말지 띄워주고 사용자가 허용하면 enabled가 true가 됨.
  const enabled =
    Platform.OS === 'ios'
      ? await requestIosPermission()
      : await requestAndroidPermission();

  if (enabled) {
    const token = await messaging().getToken();
    return token;
  }

  return null;
};

const usePushNotification = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setFcmToken(token));
  }, []);
  console.log('🚀 ~ usePushNotification ~ fcmToken:', fcmToken);
  console.log('🚀 ~ usePushNotification ~ Platform:', Platform.OS);

  return {
    fcmToken,
  };
};

export default usePushNotification;
