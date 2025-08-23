import { API_URL } from './config';
import { getTokensInfo } from './storage';

// Cache for vendors data to reduce API calls
interface VendorCache {
  data: Vendor[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

let vendorCache: VendorCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Distance calculation cache to avoid repeated calculations
const distanceCache = new Map<string, number>();
const DISTANCE_CACHE_SIZE = 1000;

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

export interface Vendor {
  _id: string;
  businessName: string;
  description: string;
  vendorTypes: ('tours' | 'lessons' | 'rentals' | 'tickets')[];
  website?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  // Backend returns location as GeoJSON with coordinates [longitude, latitude]
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Computed fields for easier access
  longitude: number;
  latitude: number;
  logoUrl?: string;
  vendorStatus: 'SUBMITTED' | 'PENDING_APPROVAL' | 'ACTION_NEEDED' | 'APPROVED' | 'REJECTED';
  actionNeeded?: string;
  adminNotes?: string;
  ownerIds: string[];
  stripeConnectId?: string;
  stripeAccountStatus?: string;
  accountBalance: number;
  pendingBalance: number;
  internalAccountBalance?: number;
  isStripeSetupComplete?: boolean;
  vendorApplicationFee?: number;
  vendorPayments?: any[];
  vendorPayouts?: any[];
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backwards compatibility
  id?: string;
  name?: string;
}

export interface VendorsResponse {
  data: Vendor[];
  total?: number;
  page?: number;
  limit?: number;
}

// Transform vendor data from backend format to mobile format
const transformVendor = (vendor: any): Vendor => {
  // Extract coordinates from GeoJSON location
  const longitude = vendor.location?.coordinates?.[0] || 0;
  const latitude = vendor.location?.coordinates?.[1] || 0;

  return {
    ...vendor,
    longitude,
    latitude,
  };
};

export const vendorsApi = {
  async getVendors(): Promise<VendorsResponse> {
    // Check cache first
    if (vendorCache && (Date.now() - vendorCache.timestamp) < vendorCache.ttl) {
      console.log('VendorsAPI - Returning cached vendors data');
      return {
        data: vendorCache.data,
        total: vendorCache.data.length,
      };
    }
    
    console.log('VendorsAPI - Fetching all approved vendors from API');
    const response = await fetch(`${API_URL}/vendors`, {
      method: 'GET',
      headers: await createHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('VendorsAPI - Failed to get vendors:', error);
      throw new Error(error.message || 'Failed to get vendors');
    }

    const result = await response.json();

    // Transform vendor data to include computed lat/lng fields
    const transformedVendors = result.data?.map(transformVendor) || [];
    
    // Update cache
    vendorCache = {
      data: transformedVendors,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };

    console.log('VendorsAPI - Vendors fetched, transformed, and cached:', {
      count: transformedVendors.length,
      sample: transformedVendors.slice(0, 3).map((v: Vendor) => ({
        id: v._id?.substring(0, 8),
        name: v.businessName,
        types: v.vendorTypes,
        status: v.vendorStatus,
        coordinates: [v.longitude, v.latitude],
      })),
    });

    return {
      ...result,
      data: transformedVendors,
    };
  },

  async getVendor(vendorId: string): Promise<{ data: Vendor }> {
    console.log('VendorsAPI - Fetching vendor:', vendorId);
    const response = await fetch(`${API_URL}/vendors/${vendorId}`, {
      method: 'GET',
      headers: await createHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('VendorsAPI - Failed to get vendor:', error);
      throw new Error(error.message || 'Failed to get vendor');
    }

    const result = await response.json();

    // Transform single vendor data
    const transformedVendor = transformVendor(result.data);

    console.log('VendorsAPI - Vendor fetched and transformed:', {
      id: transformedVendor._id?.substring(0, 8),
      name: transformedVendor.businessName,
      status: transformedVendor.vendorStatus,
      coordinates: [transformedVendor.longitude, transformedVendor.latitude],
    });

    return {
      ...result,
      data: transformedVendor,
    };
  },

  async getNearbyVendors(
    lat: number,
    lng: number,
    radius: number = 10000
  ): Promise<VendorsResponse> {
    console.log('VendorsAPI - Fetching nearby vendors (client-side filtering):', {
      lat,
      lng,
      radius,
    });

    // Get all vendors first (same as frontend approach)
    const allVendors = await this.getVendors();

    console.log('VendorsAPI - All vendors fetched, filtering by distance:', {
      totalVendors: allVendors.data?.length || 0,
    });

    // Convert radius from meters to miles for consistency with frontend
    const radiusInMiles = radius / 1609.34;

    // Filter vendors by distance (same logic as frontend)
    const nearbyVendors =
      allVendors.data?.filter((vendor) => {
        if (vendor.vendorStatus !== 'APPROVED') return false;

        const distance = this.calculateDistance(lat, lng, vendor.latitude, vendor.longitude);
        return distance <= radiusInMiles;
      }) || [];

    // Sort by distance (closest first)
    const sortedVendors = nearbyVendors
      .map((vendor) => ({
        ...vendor,
        distance: this.calculateDistance(lat, lng, vendor.latitude, vendor.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(({ distance, ...vendor }) => vendor); // Remove distance property

    console.log('VendorsAPI - Nearby vendors filtered and sorted:', {
      location: `${lat},${lng}`,
      radiusInMiles: radiusInMiles.toFixed(1),
      nearbyCount: sortedVendors.length,
      totalFiltered: allVendors.data?.length || 0,
      closest3: sortedVendors.slice(0, 3).map((v) => ({
        id: v._id?.substring(0, 8),
        name: v.businessName,
        distance: this.calculateDistance(lat, lng, v.latitude, v.longitude).toFixed(1) + ' miles',
      })),
    });

    return {
      data: sortedVendors,
      total: sortedVendors.length,
    };
  },

  // Optimized distance calculation with caching
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Create cache key
    const cacheKey = `${lat1.toFixed(4)},${lon1.toFixed(4)},${lat2.toFixed(4)},${lon2.toFixed(4)}`;
    
    // Check cache first
    if (distanceCache.has(cacheKey)) {
      return distanceCache.get(cacheKey)!;
    }
    
    // Calculate distance using Haversine formula
    const R = 3963; // Radius of Earth in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    
    // Cache the result (with size limit)
    if (distanceCache.size >= DISTANCE_CACHE_SIZE) {
      // Remove oldest entries (first in Map)
      const firstKey = distanceCache.keys().next().value;
      distanceCache.delete(firstKey);
    }
    distanceCache.set(cacheKey, distance);
    
    return distance;
  },
  
  // Clear caches (useful for testing or memory management)
  clearCaches(): void {
    vendorCache = null;
    distanceCache.clear();
  },

  async getVendorsByType(
    type: 'tours' | 'lessons' | 'rentals' | 'tickets'
  ): Promise<VendorsResponse> {
    console.log('VendorsAPI - Fetching vendors by type:', type);
    const response = await fetch(`${API_URL}/vendors/by-type?type=${type}`, {
      method: 'GET',
      headers: await createHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('VendorsAPI - Failed to get vendors by type:', error);
      throw new Error(error.message || 'Failed to get vendors by type');
    }

    const result = await response.json();
    console.log('VendorsAPI - Vendors by type fetched:', {
      type,
      count: result.data?.length || 0,
    });

    return result;
  },
};

// Utility functions for vendor data
export const getVendorDisplayName = (vendor: Vendor): string => {
  return vendor.businessName || vendor.name || 'Unknown Vendor';
};

export const getVendorLocation = (vendor: Vendor) => {
  return {
    lat: vendor.latitude,
    lng: vendor.longitude,
    address: `${vendor.address}, ${vendor.city}, ${vendor.state} ${vendor.postalCode}`,
  };
};

export const isVendorApproved = (vendor: Vendor): boolean => {
  return vendor.vendorStatus === 'APPROVED';
};
