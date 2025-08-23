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
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '~/lib/auth/context';
import { useGoogleAuth } from '~/lib/auth/google';
import { FontFamilies } from '~/src/styles/fonts';

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, login, googleSignIn } = useAuth();
  const { signInWithGoogle, isReady } = useGoogleAuth();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!acceptPolicy) {
      Alert.alert('Error', 'You must accept the Privacy Policy to continue');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register({ firstName, lastName, email, password });

      // Auto-login after successful registration (like the webapp)
      try {
        await login({ email, password });
        router.replace('/(tabs)/dashboard');
      } catch {
        Alert.alert(
          'Success',
          'Account created! Please check your email to confirm your account.',
          [{ text: 'OK', onPress: () => router.push('/auth/login') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Google sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center px-6 py-8">
            <View className="mb-8">
              <Text className="mb-2 text-4xl text-foreground" style={{ fontFamily: FontFamilies.primaryBold }}>Sign Up</Text>
              <Text className="text-lg text-muted-foreground" style={{ fontFamily: FontFamilies.primary }}>
                Create your account to get started
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-foreground" style={{ fontFamily: FontFamilies.primaryMedium }}>First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#9CA3AF"
                  className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
                  style={{ fontFamily: FontFamilies.primary }}
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </View>

              <View>
                <Text className="mb-2 text-foreground" style={{ fontFamily: FontFamilies.primaryMedium }}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#9CA3AF"
                  className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
                  style={{ fontFamily: FontFamilies.primary }}
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              </View>

              <View>
                <Text className="mb-2 text-foreground" style={{ fontFamily: FontFamilies.primaryMedium }}>Email</Text>
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
                <Text className="mb-2 text-foreground" style={{ fontFamily: FontFamilies.primaryMedium }}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password (min 6 characters)"
                  placeholderTextColor="#9CA3AF"
                  className="rounded-lg border border-border bg-card px-4 py-3 text-foreground"
                  style={{ fontFamily: FontFamilies.primary }}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <View className="mt-4 flex-row items-start">
                <TouchableOpacity
                  onPress={() => setAcceptPolicy(!acceptPolicy)}
                  className="mr-3 mt-1">
                  <View
                    className={`h-5 w-5 rounded border-2 ${
                      acceptPolicy ? 'border-primary bg-primary' : 'border-border bg-card'
                    } items-center justify-center`}>
                    {acceptPolicy && <Text className="text-xs text-primary-foreground" style={{ fontFamily: FontFamilies.primary }}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-sm leading-5 text-muted-foreground" style={{ fontFamily: FontFamilies.primary }}>
                    {'I have read and accept the '}
                    <Text className="text-primary underline" style={{ fontFamily: FontFamilies.primary }}>Privacy Policy</Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                className="mt-6 rounded-lg bg-primary py-4">
                <Text className="text-center text-lg text-primary-foreground" style={{ fontFamily: FontFamilies.primarySemiBold }}>
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <View className="my-6 flex-row items-center">
                <View className="h-px flex-1 bg-border" />
                <Text className="mx-4 text-muted-foreground" style={{ fontFamily: FontFamilies.primary }}>OR</Text>
                <View className="h-px flex-1 bg-border" />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignUp}
                className="flex-row items-center justify-center rounded-lg border border-border bg-card py-4">
                <Text className="ml-2 text-lg text-foreground" style={{ fontFamily: FontFamilies.primarySemiBold }}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-muted-foreground" style={{ fontFamily: FontFamilies.primary }}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary" style={{ fontFamily: FontFamilies.primarySemiBold }}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
