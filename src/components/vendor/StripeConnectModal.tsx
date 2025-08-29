import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamilies } from '~/src/styles/fonts';
import { stripeConnectApi } from '~/lib/api/stripe-connect';
import { vendorCrudApi } from '~/lib/api/vendors-crud';
import { useAuth } from '~/lib/auth/context';
import { API_URL } from '~/lib/api/config';

interface StripeConnectModalProps {
  visible: boolean;
  vendorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const StripeConnectModal: React.FC<StripeConnectModalProps> = ({
  visible,
  vendorId,
  onClose,
  onSuccess,
}) => {
  const { checkVendorStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (visible && vendorId) {
      initializeStripeConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, vendorId]);

  const initializeStripeConnect = async () => {
    try {
      setIsLoading(true);
      setOnboardingExited(false);

      console.log('Initializing Stripe Connect for vendor:', vendorId);

      // Step 1: Create/Get Stripe Account
      const { account } = await stripeConnectApi.createOrGetAccount(vendorId);
      console.log('Stripe account created/retrieved:', account.id);
      setAccountId(account.id);

      // Step 2: Update Vendor with Stripe Connect ID
      await vendorCrudApi.updateVendorStripeConnect(vendorId, account.id);
      console.log('Vendor updated with Stripe Connect ID');

      // Step 3: Create account link for onboarding
      // We'll use custom return and refresh URLs that we can detect in the WebView
      const returnUrl = `${API_URL}/stripe-connect/return?vendor=${vendorId}`;
      const refreshUrl = `${API_URL}/stripe-connect/refresh?vendor=${vendorId}`;

      const { url } = await stripeConnectApi.createAccountLink(account.id, refreshUrl, returnUrl);

      console.log('Account link created, loading URL in WebView');
      setStripeUrl(url);
    } catch (error) {
      console.error('Stripe Connect initialization error:', error);
      Alert.alert('Error', 'Failed to initialize payment setup. Please try again.', [
        { text: 'OK', onPress: onClose },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    console.log('WebView navigation:', url);

    // Check for return URL (successful completion)
    if (url.includes('/stripe-connect/return') || url.includes('return_url')) {
      console.log('Stripe onboarding completed, checking status...');
      await checkOnboardingStatus();
    }
    // Check for refresh URL (user exited)
    else if (url.includes('/stripe-connect/refresh') || url.includes('refresh_url')) {
      console.log('User exited Stripe onboarding');
      setOnboardingExited(true);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      setIsLoading(true);

      if (!accountId) {
        throw new Error('No Stripe account ID found');
      }

      // Get the latest account status from Stripe
      const accountStatus = await stripeConnectApi.getAccountStatus(accountId);
      console.log('Account status:', {
        details_submitted: accountStatus.details_submitted,
        charges_enabled: accountStatus.charges_enabled,
        payouts_enabled: accountStatus.payouts_enabled,
      });

      // Check if all requirements are met
      const isComplete =
        accountStatus.details_submitted &&
        accountStatus.charges_enabled &&
        accountStatus.payouts_enabled;

      if (isComplete) {
        // Update vendor status to reflect Stripe setup is complete
        await checkVendorStatus();
        Alert.alert('Success!', 'Your payment setup is complete. You can now receive payments.', [
          { text: 'OK', onPress: onSuccess },
        ]);
      } else {
        // Check what's missing
        const requirements = accountStatus.requirements || {};
        const hasPendingVerification = requirements.pending_verification?.length > 0;
        const hasCurrentlyDue = requirements.currently_due?.length > 0;

        if (hasPendingVerification && !hasCurrentlyDue) {
          // Verification is pending but user has completed their part
          Alert.alert(
            'Verification Pending',
            'Your information has been submitted and is being verified by Stripe. This usually takes 1-2 business days.',
            [{ text: 'OK', onPress: onSuccess }]
          );
        } else {
          // More information needed
          Alert.alert(
            'Setup Incomplete',
            'Additional information is required to complete your payment setup. Please complete all required fields.',
            [{ text: 'Continue', onPress: () => handleResume() }]
          );
        }
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      Alert.alert('Error', 'Failed to verify payment setup status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setOnboardingExited(false);
    // Recreate the account link with a fresh URL
    await initializeStripeConnect();
  };

  const handleWebViewError = (error: any) => {
    console.error('WebView error:', error);
    Alert.alert(
      'Connection Error',
      'Failed to load Stripe Connect. Please check your internet connection and try again.',
      [
        { text: 'Retry', onPress: initializeStripeConnect },
        { text: 'Cancel', onPress: onClose },
      ]
    );
  };

  const handleWebViewHttpError = (error: any) => {
    console.error('WebView HTTP error:', error);
    // Don't show alert for every HTTP error, just log it
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1C283A', '#0F172A']} style={StyleSheet.absoluteFillObject} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Setup</Text>
          <View style={{ width: 60 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text style={styles.loadingText}>
              {stripeUrl ? 'Checking setup status...' : 'Initializing payment setup...'}
            </Text>
          </View>
        ) : onboardingExited ? (
          <View style={styles.exitedContainer}>
            <Text style={styles.exitedTitle}>Setup Paused</Text>
            <Text style={styles.exitedText}>
              {
                "You've exited the payment setup process. You can resume at any time to complete your setup."
              }
            </Text>
            <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
              <Text style={styles.resumeButtonText}>Resume Setup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterButtonText}>Complete Later</Text>
            </TouchableOpacity>
          </View>
        ) : stripeUrl ? (
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: stripeUrl }}
              style={styles.webView}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              onError={handleWebViewError}
              onHttpError={handleWebViewHttpError}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#60a5fa" />
                  <Text style={styles.webViewLoadingText}>Loading Stripe Connect...</Text>
                </View>
              )}
              // Allow cookies and JavaScript
              javaScriptEnabled={true}
              domStorageEnabled={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              // Handle form data
              mixedContentMode="compatibility"
              // Improve performance
              cacheEnabled={true}
              cacheMode="LOAD_DEFAULT"
            />
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load payment setup</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initializeStripeConnect}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
  },
  cancelButton: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    marginTop: 16,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  webViewLoadingText: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    marginTop: 12,
  },
  exitedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exitedTitle: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 16,
  },
  exitedText: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  resumeButton: {
    backgroundColor: '#60a5fa',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  resumeButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#0F172A',
  },
  laterButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  laterButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primaryMedium,
    color: '#94A3B8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryMedium,
    color: '#EF4444',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#60a5fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#0F172A',
  },
});
