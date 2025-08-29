import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { useState, useEffect } from 'react';

export const useAppleAuth = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === 'ios') {
        try {
          const isAvailable = await AppleAuthentication.isAvailableAsync();
          setIsReady(isAvailable);
          console.log('🍎 Apple Sign-In availability:', isAvailable);
        } catch (error) {
          console.error('🍎 Error checking Apple Sign-In availability:', error);
          setIsReady(false);
        }
      } else {
        setIsReady(false);
        console.log('🍎 Apple Sign-In not available on this platform');
      }
    };

    checkAvailability();
  }, []);

  const signInWithApple = async () => {
    try {
      if (!isReady) {
        throw new Error('Apple Sign-In is not available');
      }

      console.log('🍎 Starting Apple authentication...');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('🍎 Apple Sign-In successful');
      console.log('🍎 Credential user ID:', credential.user);
      console.log('🍎 Has identity token:', !!credential.identityToken);
      console.log('🍎 Has authorization code:', !!credential.authorizationCode);

      // Return the credential data for the auth context to process
      return {
        user: credential.user,
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        email: credential.email,
        fullName: credential.fullName,
      };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('🍎 Apple Sign-In cancelled by user');
        throw new Error('Apple sign in was cancelled');
      } else {
        console.error('🍎 Apple Sign-In error:', error);
        throw new Error(`Apple sign in failed: ${error.message}`);
      }
    }
  };

  return {
    signInWithApple,
    isReady: isReady && Platform.OS === 'ios',
  };
};