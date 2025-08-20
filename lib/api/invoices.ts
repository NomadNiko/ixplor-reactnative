import { API_URL } from './config';
import { getTokensInfo } from './storage';

const createHeaders = async (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const tokens = await getTokensInfo();
    if (tokens?.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }
  }

  return headers;
};

export interface InvoiceItem {
  productItemId: string;
  productName: string;
  price: number;
  quantity: number;
  productDate: string;
  productStartTime: string;
  productDuration: number;
}

export interface VendorGroup {
  vendorId: string;
  vendorName: string;
  subtotal: number;
  items: InvoiceItem[];
}

export interface Invoice {
  _id: string;
  stripeCheckoutSessionId: string;
  amount: number;
  currency: string;
  customerId: string;
  customerName: string;
  productItemIds: string[];
  vendorGroups: VendorGroup[];
  status: string;
  type: string;
  invoiceDate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  total?: number;
  page?: number;
  limit?: number;
}

export const invoicesApi = {
  async getUserInvoices(userId: string): Promise<InvoicesResponse> {
    console.log('InvoicesAPI - Fetching invoices for user:', userId);
    
    const response = await fetch(`${API_URL}/invoices/user/${userId}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('InvoicesAPI - Failed to get user invoices:', error);
      throw new Error(error.message || 'Failed to get user invoices');
    }

    const result = await response.json();
    
    // Backend returns array directly, wrap in data field for consistency
    const invoices = Array.isArray(result) ? result : result.data || [];
    
    console.log('InvoicesAPI - User invoices fetched:', {
      userId: userId.substring(0, 8),
      invoiceCount: invoices.length,
      totalAmount: invoices.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0) || 0,
      sample: invoices.slice(0, 3).map((inv: Invoice) => ({
        id: inv._id?.substring(0, 8),
        amount: inv.amount,
        vendorCount: inv.vendorGroups?.length || 0,
        date: inv.invoiceDate,
        status: inv.status
      }))
    });

    return {
      data: invoices,
      total: invoices.length
    };
  },

  async getVendorInvoices(vendorId: string): Promise<InvoicesResponse> {
    console.log('InvoicesAPI - Fetching invoices for vendor:', vendorId);
    
    const response = await fetch(`${API_URL}/invoices/vendor/${vendorId}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('InvoicesAPI - Failed to get vendor invoices:', error);
      throw new Error(error.message || 'Failed to get vendor invoices');
    }

    const result = await response.json();
    
    // Backend returns array directly, wrap in data field for consistency
    const invoices = Array.isArray(result) ? result : result.data || [];
    
    console.log('InvoicesAPI - Vendor invoices fetched:', {
      vendorId: vendorId.substring(0, 8),
      invoiceCount: invoices.length
    });

    return {
      data: invoices,
      total: invoices.length
    };
  },

  async getInvoice(invoiceId: string): Promise<{ data: Invoice }> {
    console.log('InvoicesAPI - Fetching invoice:', invoiceId);
    
    const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('InvoicesAPI - Failed to get invoice:', error);
      throw new Error(error.message || 'Failed to get invoice');
    }

    const result = await response.json();
    console.log('InvoicesAPI - Invoice fetched:', {
      id: result.data._id.substring(0, 8),
      amount: result.data.amount,
      vendorGroups: result.data.vendorGroups?.length || 0
    });

    return result;
  },
};

export const formatInvoiceAmount = (amount: number, currency: string = 'USD'): string => {
  return `$${(amount / 100).toFixed(2)}`; // Convert cents to dollars
};

export const getInvoiceTotalItems = (invoice: Invoice): number => {
  return invoice.vendorGroups?.reduce((total, group) => {
    return total + group.items.reduce((groupTotal, item) => groupTotal + item.quantity, 0);
  }, 0) || 0;
};

export const formatInvoiceDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};