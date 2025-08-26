import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from './useCart';
import { stripeService } from '~/lib/api/stripe';
import Toast from 'react-native-toast-message';

export interface CheckoutState {
  isLoading: boolean;
  error: string | null;
  clientSecret: string | null;
  paymentIntentId: string | null;
}

export function useCheckout() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [state, setState] = useState<CheckoutState>({
    isLoading: false,
    error: null,
    clientSecret: null,
    paymentIntentId: null,
  });

  const initializeCheckout = useCallback(async () => {
    console.log('🚀 useCheckout: Starting PaymentIntent checkout process...');

    if (!cart?.items || cart.items.length === 0) {
      console.error('❌ useCheckout: No items in cart');
      Toast.show({
        type: 'error',
        text1: 'Cart is empty',
        text2: 'Add items to cart before checkout',
        visibilityTime: 3000,
        position: 'top',
        topOffset: 100,
      });
      return null;
    }

    setState((prev) => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      clientSecret: null, 
      paymentIntentId: null 
    }));

    try {
      console.log('📦 useCheckout: Cart items:', cart.items.length);

      // Transform cart items to PaymentIntent format
      const paymentIntentItems = cart.items.map(item => ({
        productItemId: item.productItemId,
        productName: item.productName,
        price: item.price, // already in dollars
        quantity: item.quantity,
        vendorId: item.vendorId,
        productDate: item.productDate, // ISO date string
        productStartTime: item.productStartTime,
        productDuration: item.productDuration,
      }));

      // Create PaymentIntent with backend
      console.log('🔄 useCheckout: Creating PaymentIntent...');
      const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
        items: paymentIntentItems,
      });

      if (!clientSecret || !paymentIntentId) {
        throw new Error('No client secret or payment intent ID received from server');
      }

      console.log('✅ useCheckout: PaymentIntent created successfully');

      // Initialize Payment Sheet
      console.log('🔄 useCheckout: Initializing Payment Sheet...');
      console.log('🔑 useCheckout: Client secret format check:', clientSecret.substring(0, 10));
      
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'iXplor',
        style: 'alwaysDark', // Match app theme
        returnURL: 'ixplor://checkout/complete',
      });

      if (initError) {
        console.error('❌ useCheckout: Init error details:', {
          code: initError.code,
          message: initError.message,
          type: initError.type,
        });
        throw new Error(`Failed to initialize payment sheet: ${initError.message}`);
      }

      console.log('✅ useCheckout: Payment Sheet initialized successfully');

      setState({
        isLoading: false,
        error: null,
        clientSecret,
        paymentIntentId,
      });

      return { clientSecret, paymentIntentId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize checkout';
      console.error('❌ useCheckout: Error:', errorMessage);

      setState((prev) => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage, 
        clientSecret: null, 
        paymentIntentId: null 
      }));

      Toast.show({
        type: 'error',
        text1: 'Checkout failed',
        text2: errorMessage,
        visibilityTime: 4000,
        position: 'top',
        topOffset: 100,
      });

      return null;
    }
  }, [cart, initPaymentSheet]);

  const presentPayment = useCallback(async () => {
    console.log('🚀 useCheckout: Presenting Payment Sheet...');
    
    if (!state.clientSecret || !state.paymentIntentId) {
      const errorMessage = 'Payment not initialized. Please try again.';
      console.error('❌ useCheckout:', errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: errorMessage,
        visibilityTime: 3000,
        position: 'top',
        topOffset: 100,
      });
      return false;
    }

    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        console.error('❌ useCheckout: Payment failed:', error.message);
        
        if (error.code === 'Canceled') {
          handlePaymentCancel();
        } else {
          handlePaymentError(error.message);
        }
        return false;
      }

      console.log('✅ useCheckout: Payment completed successfully');
      handlePaymentSuccess();
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      console.error('❌ useCheckout: Payment error:', errorMessage);
      handlePaymentError(errorMessage);
      return false;
    }
  }, [state.clientSecret, state.paymentIntentId, presentPaymentSheet, handlePaymentCancel, handlePaymentError, handlePaymentSuccess]);

  const handlePaymentSuccess = useCallback(() => {
    console.log('✅ useCheckout: Payment successful!');

    // Clear the cart after successful payment
    clearCart();

    // Reset state
    setState({ isLoading: false, error: null, clientSecret: null });

    // Show success message
    Toast.show({
      type: 'success',
      text1: '✅ Payment Successful!',
      text2: 'Your order has been confirmed',
      visibilityTime: 4000,
      position: 'top',
      topOffset: 100,
    });

    // Navigate to receipts screen
    router.replace('/(tabs)/receipts');
  }, [clearCart, router]);

  const handlePaymentCancel = useCallback(() => {
    console.log('ℹ️ useCheckout: Payment cancelled');

    setState((prev) => ({ ...prev, isLoading: false, error: null }));

    Toast.show({
      type: 'error',
      text1: 'Payment cancelled',
      text2: 'You can try again when ready',
      visibilityTime: 3000,
      position: 'top',
      topOffset: 100,
    });
  }, []);

  const handlePaymentError = useCallback((errorMessage: string) => {
    console.error('❌ useCheckout: Payment error:', errorMessage);

    setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));

    Toast.show({
      type: 'error',
      text1: 'Payment failed',
      text2: errorMessage,
      visibilityTime: 4000,
      position: 'top',
      topOffset: 100,
    });
  }, []);

  return {
    initializeCheckout,
    presentPayment,
    handlePaymentSuccess,
    handlePaymentCancel,
    handlePaymentError,
    isLoading: state.isLoading,
    error: state.error,
    clientSecret: state.clientSecret,
    paymentIntentId: state.paymentIntentId,
  };
}
