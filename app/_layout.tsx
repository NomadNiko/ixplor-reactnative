import '../global.css';
import 'expo-dev-client';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AuthProvider } from '~/lib/auth/context';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeToggle } from '~/components/ThemeToggle';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { useAppFonts } from '~/src/hooks/useFonts';
import { ActivityIndicator, View, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0F172A',
        }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      {/* WRAP YOUR APP WITH ANY ADDITIONAL PROVIDERS HERE */}
      {/* <ExampleProvider> */}

      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <ActionSheetProvider>
              <NavThemeProvider value={NAV_THEME[colorScheme]}>
                <AuthProvider>
                  <Stack screenOptions={SCREEN_OPTIONS}>
                    <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
                    <Stack.Screen name="modal" options={MODAL_OPTIONS} />
                  </Stack>
                </AuthProvider>
              </NavThemeProvider>
            </ActionSheetProvider>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>

      {/* </ExampleProvider> */}
      
      <Toast 
        config={{
          success: (props) => (
            <View style={{
              height: 60,
              width: '90%',
              backgroundColor: '#065F46',
              borderRadius: 8,
              borderLeftWidth: 5,
              borderLeftColor: '#10B981',
              paddingHorizontal: 15,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                flex: 1,
              }}>
                {props.text1}
              </Text>
            </View>
          ),
          error: (props) => (
            <View style={{
              height: 60,
              width: '90%',
              backgroundColor: '#7F1D1D',
              borderRadius: 8,
              borderLeftWidth: 5,
              borderLeftColor: '#EF4444',
              paddingHorizontal: 15,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                flex: 1,
              }}>
                {props.text1}
              </Text>
              {props.text2 && (
                <Text style={{
                  color: '#FCA5A5',
                  fontSize: 14,
                  marginTop: 2,
                }}>
                  {props.text2}
                </Text>
              )}
            </View>
          ),
        }}
      />
    </>
  );
}

const SCREEN_OPTIONS = {
  animation: 'ios_from_right', // for android
} as const;

const TABS_OPTIONS = {
  headerShown: false,
} as const;

const MODAL_OPTIONS = {
  presentation: 'modal',
  animation: 'fade_from_bottom', // for android
  title: 'Settings',
  headerRight: () => <ThemeToggle />,
} as const;
