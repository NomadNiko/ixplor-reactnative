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
        router.replace('/(tabs)');
      } catch (loginError) {
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
      router.replace('/(tabs)');
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
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center px-6 py-8">
            <View className="mb-8">
              <Text className="text-4xl font-bold text-foreground mb-2">
                Sign Up
              </Text>
              <Text className="text-lg text-muted-foreground">
                Create your account to get started
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-foreground mb-2 font-medium">First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </View>

              <View>
                <Text className="text-foreground mb-2 font-medium">Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              </View>

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
                  placeholder="Enter your password (min 6 characters)"
                  placeholderTextColor="#9CA3AF"
                  className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <View className="flex-row items-start mt-4">
                <TouchableOpacity
                  onPress={() => setAcceptPolicy(!acceptPolicy)}
                  className="mr-3 mt-1"
                >
                  <View className={`w-5 h-5 border-2 rounded ${
                    acceptPolicy 
                      ? 'bg-primary border-primary' 
                      : 'border-border bg-card'
                  } items-center justify-center`}>
                    {acceptPolicy && (
                      <Text className="text-primary-foreground text-xs">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-muted-foreground text-sm leading-5">
                    {"I have read and accept the "}
                    <Text className="text-primary underline">Privacy Policy</Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                className="bg-primary rounded-lg py-4 mt-6"
              >
                <Text className="text-primary-foreground text-center font-semibold text-lg">
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-border" />
                <Text className="mx-4 text-muted-foreground">OR</Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignUp}
                className="bg-card border border-border rounded-lg py-4 flex-row items-center justify-center"
              >
                <Text className="text-foreground font-semibold text-lg ml-2">
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-muted-foreground">Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}