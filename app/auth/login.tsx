import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '~/lib/auth/context';
import { useGoogleAuth } from '~/lib/auth/google';
import { useAppleAuth } from '~/lib/auth/apple';
import * as AppleAuthentication from 'expo-apple-authentication';
import { FontFamilies } from '~/src/styles/fonts';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleSignIn, appleSignIn } = useAuth();
  const { signInWithGoogle, isReady } = useGoogleAuth();
  const { signInWithApple, isReady: isAppleReady } = useAppleAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isReady) {
      Alert.alert('Error', 'Google Sign In is not ready yet. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await signInWithGoogle();
      await googleSignIn(idToken);
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!isAppleReady) {
      Alert.alert('Error', 'Apple Sign In is not available on this device.');
      return;
    }

    setIsLoading(true);
    try {
      const credential = await signInWithApple();
      await appleSignIn(credential);
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Apple sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <View className="flex-1 justify-center px-6">
          <View className="mb-2">
            <View className=" items-center">
              <Image
                source={require('~/assets/ios-dark-fullv2.png')}
                className="h-36 w-36"
                resizeMode="contain"
              />
            </View>
            <Text
              className="m-2 mb-1 text-3xl text-foreground"
              style={{ fontFamily: FontFamilies.primaryBold }}>
              Welcome Back
            </Text>
            <Text
              className="m-2 text-xl text-muted-foreground"
              style={{ fontFamily: FontFamilies.primary }}>
              Sign in to continue exploring
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text
                className="m-2 text-foreground"
                style={{ fontFamily: FontFamilies.primaryMedium }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
                style={{ fontFamily: FontFamilies.primary }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View>
              <Text
                className="m-2 text-foreground"
                style={{ fontFamily: FontFamilies.primaryMedium }}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
                style={{ fontFamily: FontFamilies.primary }}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="mt-6 rounded-lg bg-primary py-4">
              <Text
                className="text-center text-lg text-primary-foreground"
                style={{ fontFamily: FontFamilies.primarySemiBold }}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View className="my-6 flex-row items-center">
              <View className="h-px flex-1 bg-border" />
              <Text
                className="mx-4 text-muted-foreground"
                style={{ fontFamily: FontFamilies.primary }}>
                or
              </Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              className="flex-row items-center justify-center rounded-lg border border-border bg-card py-4">
              <Text
                className="ml-2 text-lg text-foreground"
                style={{ fontFamily: FontFamilies.primarySemiBold }}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {isAppleReady && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={{ width: '100%', height: 56 }}
                onPress={handleAppleLogin}
              />
            )}
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-muted-foreground" style={{ fontFamily: FontFamilies.primary }}>
              {"Don't have an account? "}
            </Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity>
                <Text className="text-primary" style={{ fontFamily: FontFamilies.primarySemiBold }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
