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

export interface Ticket {
  _id: string;
  id?: string;
  userId: string;
  vendorId: string;
  productItemId?: string;
  transactionId: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
  qrCode?: string;
  purchaseDate?: string;
  productDate: string;
  expiryDate?: string;
  quantity: number;
  productPrice: number;
  totalPrice?: number;
  vendorOwed: number;
  vendorPaid: boolean;
  used: boolean;
  createdAt: string;
  updatedAt: string;
  // Product details embedded in ticket
  productName: string;
  productDescription: string;
  productImageURL?: string;
  productStartTime: string;
  productDuration: number;
  productType: string;
  productWaiver?: string;
  productRequirements?: string[];
  productAdditionalInfo?: string;
  productLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  statusUpdateReason?: string;
  // Relations
  vendor?: {
    id: string;
    name: string;
    description?: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
  };
  product?: {
    id: string;
    name: string;
    description?: string;
    price: number;
  };
}

export const ticketsApi = {
  async getUserTickets(userId: string): Promise<{ data: Ticket[] }> {
    const response = await fetch(`${API_URL}/tickets/user/${userId}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user tickets');
    }

    return response.json();
  },

  async getTicket(ticketId: string): Promise<{ data: Ticket }> {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get ticket');
    }

    return response.json();
  },

  async redeemTicket(ticketId: string): Promise<{ data: Ticket }> {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/redeem`, {
      method: 'POST',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to redeem ticket');
    }

    return response.json();
  },
};
