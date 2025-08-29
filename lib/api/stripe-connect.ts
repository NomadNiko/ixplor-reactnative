import { API_URL } from './config';
import { getTokensInfo } from './storage';

export interface StripeAccount {
  id: string;
  object: string;
  business_profile?: {
    mcc?: string;
    name?: string;
    product_description?: string;
    support_address?: any;
    support_email?: string;
    support_phone?: string;
    support_url?: string;
    url?: string;
  };
  capabilities?: {
    card_payments?: string;
    transfers?: string;
  };
  charges_enabled?: boolean;
  controller?: {
    type: string;
    is_controller?: boolean;
  };
  country?: string;
  created?: number;
  default_currency?: string;
  details_submitted?: boolean;
  email?: string;
  external_accounts?: {
    object: string;
    data: any[];
    has_more: boolean;
    total_count: number;
    url: string;
  };
  future_requirements?: {
    alternatives?: any[];
    current_deadline?: number | null;
    currently_due?: string[];
    disabled_reason?: string | null;
    errors?: any[];
    eventually_due?: string[];
    past_due?: string[];
    pending_verification?: string[];
  };
  metadata?: Record<string, any>;
  payouts_enabled?: boolean;
  requirements?: {
    alternatives?: any[];
    current_deadline?: number | null;
    currently_due?: string[];
    disabled_reason?: string | null;
    errors?: any[];
    eventually_due?: string[];
    past_due?: string[];
    pending_verification?: string[];
  };
  settings?: any;
  tos_acceptance?: {
    date?: number | null;
    ip?: string | null;
    user_agent?: string | null;
  };
  type?: string;
}

export interface AccountSessionResponse {
  client_secret: string;
}

class StripeConnectApi {
  private async getHeaders() {
    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No authentication token found');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokensInfo.token}`,
    };
  }

  async createOrGetAccount(vendorId?: string): Promise<{ account: StripeAccount }> {
    try {
      const headers = await this.getHeaders();

      const body = vendorId ? JSON.stringify({ vendorId }) : '{}';

      const response = await fetch(`${API_URL}/stripe-connect/account`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create/retrieve Stripe account');
      }

      return await response.json();
    } catch (error) {
      console.error('Create/get Stripe account error:', error);
      throw error;
    }
  }

  async createAccountSession(accountId: string): Promise<AccountSessionResponse> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/stripe-connect/account-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ account: accountId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account session');
      }

      return await response.json();
    } catch (error) {
      console.error('Create account session error:', error);
      throw error;
    }
  }

  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/stripe-connect/account-link`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          account: accountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: 'account_onboarding',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account link');
      }

      return await response.json();
    } catch (error) {
      console.error('Create account link error:', error);
      throw error;
    }
  }

  async updateVendorStripeAccount(vendorId: string, stripeAccountId: string) {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/stripe-connect/update-vendor/${vendorId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: stripeAccountId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update vendor Stripe account');
      }

      return await response.json();
    } catch (error) {
      console.error('Update vendor Stripe account error:', error);
      throw error;
    }
  }

  async getAccountStatus(accountId: string): Promise<StripeAccount> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/stripe-connect/account/${accountId}`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get account status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get account status error:', error);
      throw error;
    }
  }

  async checkVendorStripeStatus(
    vendorId: string
  ): Promise<{ isComplete: boolean; account?: StripeAccount }> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/stripe-connect/vendor/${vendorId}/status`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check vendor Stripe status');
      }

      return await response.json();
    } catch (error) {
      console.error('Check vendor Stripe status error:', error);
      throw error;
    }
  }
}

export const stripeConnectApi = new StripeConnectApi();
