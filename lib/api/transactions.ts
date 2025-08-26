import { API_URL } from './config';
import { getTokensInfo } from './storage';

export interface Transaction {
  _id: string;
  stripeCheckoutSessionId?: string;
  paymentIntentId?: string;
  amount: number;
  currency: string;
  customerId?: string;
  productItemIds?: string[];
  status: TransactionStatus;
  type: TransactionType;
  description?: string;
  receiptEmail?: string;
  metadata?: Record<string, any>;
  transactionDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
}

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  status?: TransactionStatus[];
  type?: TransactionType[];
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const transactionService = {
  async getTransactionBySessionId(sessionId: string): Promise<Transaction> {
    console.log('📄 TransactionService: Getting transaction by session ID:', sessionId);

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${API_URL}/transactions/checkout/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${tokensInfo.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ TransactionService: Failed to get transaction:', errorData);
      throw new Error(errorData.message || 'Failed to get transaction');
    }

    const result = await response.json();
    console.log('✅ TransactionService: Transaction retrieved successfully');

    return result;
  },

  async getCustomerTransactions(customerId: string): Promise<Transaction[]> {
    console.log('📄 TransactionService: Getting transactions for customer:', customerId);

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${API_URL}/transactions/customer/${customerId}`, {
      headers: {
        Authorization: `Bearer ${tokensInfo.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ TransactionService: Failed to get customer transactions:', errorData);
      throw new Error(errorData.message || 'Failed to get customer transactions');
    }

    const result = await response.json();
    console.log('✅ TransactionService: Customer transactions retrieved:', result.length);

    return result;
  },

  async getTransactions(
    filters?: TransactionFilters,
    pagination?: PaginationOptions
  ): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    console.log('📄 TransactionService: Getting transactions with filters');

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    // Build query string
    const params = new URLSearchParams();

    if (filters?.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters?.status?.length) {
      filters.status.forEach((s) => params.append('status', s));
    }
    if (filters?.type?.length) {
      filters.type.forEach((t) => params.append('type', t));
    }
    if (filters?.minAmount !== undefined) {
      params.append('minAmount', filters.minAmount.toString());
    }
    if (filters?.maxAmount !== undefined) {
      params.append('maxAmount', filters.maxAmount.toString());
    }

    if (pagination?.page) {
      params.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      params.append('limit', pagination.limit.toString());
    }
    if (pagination?.sortBy) {
      params.append('sortBy', pagination.sortBy);
    }
    if (pagination?.sortOrder) {
      params.append('sortOrder', pagination.sortOrder);
    }

    const queryString = params.toString();
    const url = `${API_URL}/transactions${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokensInfo.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ TransactionService: Failed to get transactions:', errorData);
      throw new Error(errorData.message || 'Failed to get transactions');
    }

    const result = await response.json();
    console.log('✅ TransactionService: Transactions retrieved:', result.data?.length || 0);

    return result;
  },

  async refundTicket(ticketId: string): Promise<{
    success: boolean;
    message: string;
    refundId?: string;
  }> {
    console.log('💸 TransactionService: Requesting refund for ticket:', ticketId);

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${API_URL}/stripe/refund/ticket/${ticketId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokensInfo.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ TransactionService: Failed to refund ticket:', errorData);
      throw new Error(errorData.message || 'Failed to refund ticket');
    }

    const result = await response.json();
    console.log('✅ TransactionService: Ticket refunded successfully');

    return result;
  },

  async refundTransaction(transactionId: string): Promise<{
    success: boolean;
    message: string;
    refundId?: string;
  }> {
    console.log('💸 TransactionService: Requesting full refund for transaction:', transactionId);

    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token available');
    }

    const response = await fetch(`${API_URL}/stripe/refund/transaction/${transactionId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokensInfo.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ TransactionService: Failed to refund transaction:', errorData);
      throw new Error(errorData.message || 'Failed to refund transaction');
    }

    const result = await response.json();
    console.log('✅ TransactionService: Transaction refunded successfully');

    return result;
  },
};
