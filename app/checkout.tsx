import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '~/hooks/useCart';
import { useCheckout } from '~/hooks/useCheckout';
import { FontFamilies } from '~/src/styles/fonts';

export default function Checkout() {
  const router = useRouter();
  const { cart } = useCart();
  const { initializeCheckout, presentPayment, isLoading, error, clientSecret, paymentIntentId } =
    useCheckout();

  useEffect(() => {
    // Redirect to cart if no items
    if (!cart?.items || cart.items.length === 0) {
      router.replace('/(tabs)/cart');
      return;
    }

    // Initialize checkout automatically when component mounts
    initializeCheckout();
  }, [cart, router, initializeCheckout]);

  const handleBack = () => {
    router.back();
  };

  const handlePayNow = async () => {
    console.log('🚀 Checkout: User tapped Pay Now');
    await presentPayment();
  };

  if (isLoading && !clientSecret) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#E0FCFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Preparing secure checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#E0FCFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Checkout Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeCheckout}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#E0FCFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Initializing secure checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#E0FCFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Checkout Content */}
      <View style={styles.contentContainer}>
        <View style={styles.paymentReadyContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#10B981" />
          <Text style={styles.paymentReadyTitle}>Payment Ready</Text>
          <Text style={styles.paymentReadyText}>
            Your order is ready for secure payment processing with Stripe.
          </Text>

          <TouchableOpacity style={styles.payNowButton} onPress={handlePayNow}>
            <Ionicons name="card" size={20} color="#ADF7FF" style={styles.payNowIcon} />
            <Text style={styles.payNowButtonText}>Pay Securely with Stripe</Text>
          </TouchableOpacity>

          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={16} color="#10B981" />
            <Text style={styles.securityText}>Secured by Stripe • SSL Encrypted</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
  },
  headerSpacer: {
    width: 40,
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
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#60A5FA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  paymentReadyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  paymentReadyTitle: {
    fontSize: 28,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  paymentReadyText: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  payNowButton: {
    backgroundColor: '#60A5FA',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  payNowIcon: {
    marginRight: 8,
  },
  payNowButtonText: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  securityText: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#10B981',
    marginLeft: 6,
  },
});
