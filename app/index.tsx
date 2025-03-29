import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const FAQs = [
  {
    question: 'What is AliComms?',
    answer: 'Is a modern interactive e-commerce platform.',
  },
  {
    question: 'Are your products genuine?',
    answer: 'Yes, we only sell genuine products from verified suppliers.',
  },
  {
    question: 'Which payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards, as well as bank transfers, USSD, and mobile money.',
  },
];

const WebViewComponent = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoadError = (syntheticEvent: { nativeEvent: any }) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error:', nativeEvent);
    setErrorMessage(`Load Error: ${nativeEvent.description}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webviewContainer}>
        <WebView
          source={{
            uri: 'https://alicomms.com/',
          }}
          style={styles.webview}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          renderError={(errorName) => (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {`WebView Error: ${errorName}`}
              </Text>
            </View>
          )}
          onError={handleLoadError}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('HTTP error:', nativeEvent.statusCode);
            setErrorMessage(`HTTP Error: ${nativeEvent.statusCode}`);
          }}
          renderLoading={() => (
            <View style={styles.loading}>
              <Text>Loading...</Text>
            </View>
          )}
        />
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [currentFAQ, setCurrentFAQ] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(width);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const hasVisited = await AsyncStorage.getItem('hasVisited');
        if (hasVisited) {
          const timer = setTimeout(onDone, 3000);
          return () => clearTimeout(timer);
        } else {
          await AsyncStorage.setItem('hasVisited', 'true');
          setIsFirstTime(true);
        }
      } catch (error) {
        console.error('Error checking first-time visit:', error);
        onDone();
      }
    };

    checkFirstTime();
  }, [onDone]);

  useEffect(() => {
    if (isFirstTime) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentFAQ, isFirstTime]);

  const handleNextFAQ = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const nextFAQ = (currentFAQ + 1) % FAQs.length;
      setCurrentFAQ(nextFAQ);
    });
  }, [currentFAQ]);

  if (isFirstTime === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!isFirstTime) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.gradientContainer}
        >
          <View style={styles.welcomeContent}>
            {/* Animated GIF */}
            <Image
              source={require('../assets/images/loader.gif')} // Adjust the path to your GIF
              style={styles.gif}
              resizeMode="contain"
            />
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Redirecting to AliComms...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#dc3545', '#dc3545', '#dc3545']}
        style={styles.gradientContainer}
      >
        <Animated.View
          style={[
            styles.splashContent,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>AliComms</Text>
          </View>

          <View style={styles.faqContainer}>
            <Text style={styles.faqQuestion}>{FAQs[currentFAQ].question}</Text>
            <Text style={styles.faqAnswer}>{FAQs[currentFAQ].answer}</Text>
          </View>

          <View style={styles.progressContainer}>
            {FAQs.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  currentFAQ === index && styles.activeDot,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={currentFAQ < FAQs.length - 1 ? handleNextFAQ : onDone}
          >
            <Text style={styles.buttonText}>
              {currentFAQ < FAQs.length - 1 ? 'Next' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return showSplash ? (
    <SplashScreen onDone={() => setShowSplash(false)} />
  ) : (
    <WebViewComponent />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 0,
    padding: 30,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 10,
        },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 5,
      },
    }),
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#192f6a',
  },
  welcomeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    opacity: 0.9,
  },
  faqContainer: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 25,
    width: '100%',
    marginBottom: 25,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  faqQuestion: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#192f6a',
    marginBottom: 12,
  },
  faqAnswer: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#192f6a',
    width: 24,
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 0,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        ':hover': {
          transform: 'scale(1.05)',
        },
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
    padding: 20,
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  errorBannerText: {
    color: '#721c24',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
});
