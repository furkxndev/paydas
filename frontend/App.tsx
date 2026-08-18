import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash, ErrorBoundary } from './src/components/ui';
import { AppProviders } from './src/context';
import { RootNavigator } from './src/navigation';

// Yerel açılış ekranı, animasyonlu giriş devralana kadar görünür kalır;
// böylece iki ekran arasında beyaz bir kare oluşmaz.
void SplashScreen.preventAutoHideAsync();

export default function App() {
  const [introDone, setIntroDone] = useState(false);

  const handleLayout = useCallback(() => {
    // Kök görünüm ölçüldükten sonra yerel açılış ekranı gizlenir
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={handleLayout}>
      <SafeAreaProvider>
        {/* Beklenmeyen bir render hatasında beyaz ekran yerine anlaşılır bir ekran gösterir */}
        <ErrorBoundary>
          <AppProviders>
            <StatusBar style="dark" />
            <RootNavigator />
          </AppProviders>
          {!introDone ? <AnimatedSplash onFinish={() => setIntroDone(true)} /> : null}
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
