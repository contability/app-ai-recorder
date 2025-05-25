import {Platform, SafeAreaView, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
});

const App = () => {
  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        source={{
          uri:
            // ngrok 안썼을 땐 이렇게
            Platform.OS === 'ios'
              ? 'http://localhost:3000'
              : 'http://10.0.2.2:3000',

          //ngrok 썼을 땐 이런식으로
          // 'https://27fa-118-36-232-176.ngrok-free.app',
        }}
      />
    </SafeAreaView>
  );
};

export default App;
