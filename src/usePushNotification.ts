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
  // 안드로이드 13 미만에서는 앱을 설치하면 푸시 권한을 바로 획득하게 된다.
  // 그러니까 실질적으로 앱 푸시를 받을 수 있는 상태인데 불구하고 아래 PermissionAndroid.request 함수를 실행시켜 버리면 granted가 아니라 never_ask_agin이라는 값이 status에 주입되므로
  // 이 경우는 그냥 강제 true를 반환하여 진행시킨다.
  if (Number(Platform.Version) < 33) {
    return true;
  }

  // 안드로이드 13 이상에서는 모달창으로 알림 권한 허용할지 말지 띄워주고 사용자가 허용하면 enabled가 true가 됨.
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
