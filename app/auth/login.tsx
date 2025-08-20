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
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '~/lib/auth/context';
import { useGoogleAuth } from '~/lib/auth/google';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleSignIn } = useAuth();
  const { signInWithGoogle, isReady } = useGoogleAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)');
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
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-8">
            <Text className="text-4xl font-bold text-foreground mb-2">
              Welcome Back
            </Text>
            <Text className="text-lg text-muted-foreground">
              Sign in to continue exploring
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-foreground mb-2 font-medium">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View>
              <Text className="text-foreground mb-2 font-medium">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                secureTextEntry
                autoComplete="current-password"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="bg-primary rounded-lg py-4 mt-6"
            >
              <Text className="text-primary-foreground text-center font-semibold text-lg">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-border" />
              <Text className="mx-4 text-muted-foreground">or</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              className="bg-card border border-border rounded-lg py-4 flex-row items-center justify-center"
            >
              <Text className="text-foreground font-semibold text-lg ml-2">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-muted-foreground">{"Don't have an account? "}</Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}