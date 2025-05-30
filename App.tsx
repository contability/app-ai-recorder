import {useCallback, useRef, useState} from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioRecorderPlayer, {
  AVEncodingOption,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import WebView from 'react-native-webview';
import Permissions from 'react-native-permissions';
import RNFS from 'react-native-fs';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    paddingTop: 50,
  },
  camera: {
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  cameraCloseText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cameraPhotoButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 80 / 2,
    bottom: 60,
    backgroundColor: 'white',
    alignSelf: 'center',
  },
  versionText: {
    alignSelf: 'flex-end',
    marginRight: 10,
    backgroundColor: 'white',
    color: 'black',
  },
});

const App = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer());
  const cameraRef = useRef<Camera>(null);

  // 후면 카메라를 쓰겠다는 의미
  const device = useCameraDevice('back');

  const sendMessageToWebview = useCallback(
    ({type, data}: {type: string; data?: any}) => {
      const message = JSON.stringify({type, data});
      webViewRef.current?.postMessage(message);
    },
    [],
  );

  // 실제 녹음 함수
  const startRecord = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        // 퍼미션 여러개 요청. 여기선 하나만.
        // 사용자가 수락하게 되면 grants에 퍼미션 결과가 들어옴.
        const grants = await Permissions.requestMultiple([
          Permissions.PERMISSIONS.ANDROID.RECORD_AUDIO,
        ]);

        console.log('write external storage', grants);

        if (
          // 퍼미션이 수락되었는지 확인.
          grants[Permissions.PERMISSIONS.ANDROID.RECORD_AUDIO] ===
          Permissions.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
    /**
     * startRecorder 함수는 녹음을 시작하고 녹음 파일의 경로를 반환합니다.
     * param uri?: 녹음 파일 저장될 경로. undefined는 기본 경로로 저장
     * param audioSets?: 녹음 파일 설정
     * param meteringEnabled?: 미터링 사용 여부
     *
     * iOS에서는 이렇게 실행하고 나면 알아서 퍼미션 요청까지 진행함.
     * 안드로이드에서는 마쉬멜로우 버전 이상부터는 런타임에 사용자에게 명시적으로 퍼미션 요청을 해줘야함.
     */
    await audioRecorderPlayerRef.current.startRecorder(undefined, {
      // whisper는 포맷을 각각 이렇게 해줘야함.
      AVFormatIDKeyIOS: AVEncodingOption.mp4,
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    });

    sendMessageToWebview({type: 'onStartRecord'});
  }, [sendMessageToWebview]);

  const stopRecord = useCallback(async () => {
    // App에서 바이너리 녹음 파일을 Base64 문자열로 변환 -> webView.postMessage로 웹으로 전달. -> 웹에서 window.addEventListener('message', onMessage)로 받아서 처리.
    const filePath = await audioRecorderPlayerRef.current.stopRecorder();
    // 확장자
    const ext = filePath.split('.').pop();
    const base64audio = await RNFS.readFile(filePath, 'base64');
    sendMessageToWebview({
      type: 'onStopRecord',
      data: {
        audio: base64audio,
        mimeType: 'audio/mp4',
        ext,
      },
    });
  }, [sendMessageToWebview]);

  const pauseRecord = useCallback(async () => {
    await audioRecorderPlayerRef.current.pauseRecorder();
    sendMessageToWebview({type: 'onPauseRecord'});
  }, [sendMessageToWebview]);

  const resumeRecord = useCallback(async () => {
    await audioRecorderPlayerRef.current.resumeRecorder();
    sendMessageToWebview({type: 'onResumeRecord'});
  }, [sendMessageToWebview]);

  const openCamera = useCallback(async () => {
    // 권한 요청
    const permission = await Camera.requestCameraPermission();
    if (permission === 'granted') {
      console.log('🚀 ~ openCamera ~ permission:', permission === 'granted');
      setIsCameraOn(true);
    }
  }, []);

  const closeCamera = useCallback(() => {
    setIsCameraOn(false);
  }, []);

  const onPressPhotoButton = useCallback(async () => {
    const file = await cameraRef.current?.takePhoto({
      flash: 'off',
    });

    // base64로 변환 -> webView.postMessage로 웹으로 전달. -> 웹에서 window.addEventListener('message', onMessage)로 받아서 처리.
    if (file) {
      const base64Image = await RNFS.readFile(file.path, 'base64');
      const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
      sendMessageToWebview({
        type: 'onTakePhoto',
        data: imageDataUrl,
      });
    }
  }, [sendMessageToWebview]);

  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        ref={webViewRef}
        source={{
          uri:
            // ngrok 안썼을 땐 이렇게
            Platform.OS === 'ios'
              ? 'http://localhost:3000'
              : 'http://10.0.2.2:3000',

          //ngrok 썼을 땐 이런식으로
          // 'https://27fa-118-36-232-176.ngrok-free.app',
        }}
        onMessage={event => {
          console.log(event.nativeEvent.data);
          const {type} = JSON.parse(event.nativeEvent.data);
          if (type === 'start-record') {
            startRecord();
          } else if (type === 'stop-record') {
            stopRecord();
          } else if (type === 'pause-record') {
            pauseRecord();
          } else if (type === 'resume-record') {
            resumeRecord();
          } else if (type === 'open-camera') {
            openCamera();
          }
        }}
        webviewDebuggingEnabled
      />
      {isCameraOn && !!device && (
        <View style={styles.camera}>
          {/* 디바이스는 후면 카메라 쓸거고, 사진만 찍을거고, 카메라 켜져 있을거고, 사진 퀄리티는 용량이 좀 작게, 스타일은 카메라 컴포넌트 꽉 채워지게 */}
          <Camera
            ref={cameraRef}
            device={device}
            photo={true}
            video={false}
            isActive={true}
            photoQualityBalance="speed"
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={styles.cameraCloseButton}
            onPress={closeCamera}>
            <Text style={styles.cameraCloseText}>CLOSE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cameraPhotoButton}
            onPress={onPressPhotoButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default App;
