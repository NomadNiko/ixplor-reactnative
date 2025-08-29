import { API_URL } from './config';
import { getTokensInfo } from './storage';
import { CartItem } from './cart';

export interface CreateCheckoutSessionRequest {
  items: CartItem[];
  returnUrl: string;
}

export interface CreateCheckoutSessionResponse {
  clientSecret: string;
}

export interface CreatePaymentIntentRequest {
  items: {
    productItemId: string;
    productName: string;
    price: number; // in dollars
    quantity: number;
    vendorId: string;
    productDate: string; // ISO date string
    productStartTime: string;
    productDuration: number;
  }[];
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface ConfirmPaymentIntentResponse {
  id: string;
  status: string;
  client_secret: string;
  amount: number; // in cents
  currency: string;
}

export interface SessionStatusResponse {
  status: string;
  customer_email?: string;
}

export const stripeService = {
  async createCheckoutSession(
    params: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    console.log('💳 StripeService: Creating checkout session...');
    console.log('📦 StripeService: Checkout params:', {
      itemCount: params.items.length,
      returnUrl: params.returnUrl,
    });

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    const requestBody = {
      items: params.items,
      returnUrl: params.returnUrl,
    };

    console.log(
      '📡 StripeService: Making POST request to:',
      `${API_URL}/stripe/create-checkout-session`
    );

    const response = await fetch(`${API_URL}/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokensInfo.token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 StripeService: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ StripeService: Failed to create checkout session:', errorData);
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const result = await response.json();
    console.log('✅ StripeService: Checkout session created successfully');
    console.log(
      '🔑 StripeService: Client secret received:',
      result.clientSecret ? 'Present' : 'Missing'
    );

    return result;
  },

  async getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
    console.log('🔍 StripeService: Getting session status for:', sessionId);

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${API_URL}/stripe/session-status?session_id=${sessionId}`, {
      headers: {
        Authorization: `Bearer ${tokensInfo.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ StripeService: Failed to get session status:', errorData);
      throw new Error(errorData.message || 'Failed to get session status');
    }

    const result = await response.json();
    console.log('✅ StripeService: Session status retrieved:', result.status);

    return result;
  },

  async createPaymentIntent(
    params: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    console.log('💳 StripeService: Creating payment intent...');
    console.log('📦 StripeService: Payment intent params:', {
      itemCount: params.items.length,
    });

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    console.log(
      '📡 StripeService: Making POST request to:',
      `${API_URL}/stripe/create-payment-intent`
    );

    const response = await fetch(`${API_URL}/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokensInfo.token}`,
      },
      body: JSON.stringify(params),
    });

    console.log('📡 StripeService: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ StripeService: Failed to create payment intent:', errorData);
      throw new Error(errorData.message || 'Failed to create payment intent');
    }

    const result = await response.json();
    console.log('✅ StripeService: Payment intent created successfully');
    console.log(
      '🔑 StripeService: Client secret received:',
      result.clientSecret ? 'Present' : 'Missing'
    );
    console.log(
      '🆔 StripeService: Payment intent ID:',
      result.paymentIntentId ? 'Present' : 'Missing'
    );

    return result;
  },

  async confirmPaymentIntent(paymentIntentId: string): Promise<ConfirmPaymentIntentResponse> {
    console.log('🔍 StripeService: Confirming payment intent:', paymentIntentId);

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${API_URL}/stripe/confirm-payment-intent/${paymentIntentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokensInfo.token}`,
      },
    });

    console.log('📡 StripeService: Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ StripeService: Failed to confirm payment intent:', errorData);
      throw new Error(errorData.message || 'Failed to confirm payment intent');
    }

    const result = await response.json();
    console.log('✅ StripeService: Payment intent status:', result.status);

    return result;
  },
};
