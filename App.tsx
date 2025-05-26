import {useCallback, useRef} from 'react';
import {Platform, SafeAreaView, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
});

const App = () => {
  const webViewRef = useRef<WebView>(null);
  const sendMessageToWebview = useCallback(
    ({type, data}: {type: string; data?: any}) => {
      const message = JSON.stringify({type, data});
      webViewRef.current?.postMessage(message);
    },
    [],
  );

  // 실제 녹음 함수
  const startRecord = useCallback(() => {
    sendMessageToWebview({type: 'onStartRecord'});
  }, [sendMessageToWebview]);

  const stopRecord = useCallback(() => {
    const data = {};
    sendMessageToWebview({type: 'onStopRecord', data});
  }, [sendMessageToWebview]);

  const pauseRecord = useCallback(() => {
    sendMessageToWebview({type: 'onPauseRecord'});
  }, [sendMessageToWebview]);

  const resumeRecord = useCallback(() => {
    sendMessageToWebview({type: 'onResumeRecord'});
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
          }
        }}
        webviewDebuggingEnabled
      />
    </SafeAreaView>
  );
};

export default App;
