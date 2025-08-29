import { API_URL } from './config';
import { getTokensInfo } from './storage';

export interface VendorLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface CreateVendorDto {
  businessName: string;
  description: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  location: VendorLocation;
  vendorStatus: string;
  vendorTypes: string[];
}

export interface VendorTemplate {
  _id: string;
  templateName: string;
  hasItems: boolean;
}

export interface VendorStatus {
  _id: string;
  businessName: string;
  description: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  vendorStatus: 'SUBMITTED' | 'PENDING_APPROVAL' | 'ACTION_NEEDED' | 'APPROVED' | 'REJECTED';
  vendorTypes: string[];
  ownerIds: string[];
  stripeConnectId?: string;
  isStripeSetupComplete?: boolean;
  hasTemplates?: boolean;
  hasProducts?: boolean;
  templates?: VendorTemplate[];
  actionNeeded?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorResponse {
  data: VendorStatus[];
  message?: string;
}

class VendorCrudApi {
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

  async createVendor(data: Omit<CreateVendorDto, 'location' | 'vendorStatus' | 'vendorTypes'>) {
    try {
      const headers = await this.getHeaders();

      const locationData: VendorLocation = {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      };

      const submissionData: CreateVendorDto = {
        ...data,
        vendorStatus: 'SUBMITTED',
        location: locationData,
        vendorTypes: ['tours'],
      };

      const response = await fetch(`${API_URL}/vendors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create vendor profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Create vendor error:', error);
      throw error;
    }
  }

  async getUserVendors(userId: string): Promise<VendorResponse> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/v1/vendors/user/${userId}/owned`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendor status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user vendors error:', error);
      throw error;
    }
  }

  async getVendorById(vendorId: string): Promise<VendorStatus> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/vendors/${vendorId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vendor');
      }

      return await response.json();
    } catch (error) {
      console.error('Get vendor error:', error);
      throw error;
    }
  }

  async updateVendorStripeConnect(vendorId: string, stripeConnectId: string) {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${API_URL}/vendors/${vendorId}/stripe-connect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ stripeConnectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update vendor Stripe Connect ID');
      }

      return await response.json();
    } catch (error) {
      console.error('Update vendor Stripe Connect error:', error);
      throw error;
    }
  }

  async uploadVendorLogo(vendorId: string, imageUri: string) {
    try {
      const tokensInfo = await getTokensInfo();
      if (!tokensInfo?.token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'vendor-logo.jpg',
      } as any;

      formData.append('file', imageFile);

      const response = await fetch(`${API_URL}/vendors/${vendorId}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokensInfo.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload vendor logo');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload vendor logo error:', error);
      throw error;
    }
  }
}

export const vendorCrudApi = new VendorCrudApi();
