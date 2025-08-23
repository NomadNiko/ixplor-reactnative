import { API_URL } from './config';
import { getTokensInfo } from './storage';
import {
  Product,
  ProductTemplate,
  ProductItem,
  ProductResponse,
  ProductItemResponse,
  ProductType,
} from '~/lib/types/product';

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

// Transform product template data from backend format to mobile format
const transformProductTemplate = (template: any): ProductTemplate => {
  // Extract coordinates from GeoJSON location
  const longitude = template.location?.coordinates?.[0] || 0;
  const latitude = template.location?.coordinates?.[1] || 0;

  return {
    ...template,
    longitude,
    latitude,
  };
};

// Transform product data from backend format to mobile format (for backward compatibility)
const transformProduct = (product: any): Product => {
  // Extract coordinates from GeoJSON location
  const longitude = product.location?.coordinates?.[0] || 0;
  const latitude = product.location?.coordinates?.[1] || 0;

  // Map template fields to product fields for backward compatibility
  return {
    ...product,
    longitude,
    latitude,
    productName: product.templateName || product.productName,
    productDescription: product.description || product.productDescription,
    productPrice: product.price || product.productPrice,
    productImageURL: product.imageURL || product.productImageURL,
    productDuration: product.duration || product.productDuration,
    productAdditionalInfo: product.additionalInfo || product.productAdditionalInfo,
    productRequirements: product.requirements || product.productRequirements,
    productWaiver: product.waiver || product.productWaiver,
    productStatus: product.templateStatus || product.productStatus,
  };
};

// Transform product item data from backend format to mobile format
const transformProductItem = (item: any): ProductItem => {
  // Extract coordinates from GeoJSON location
  const longitude = item.location?.coordinates?.[0] || 0;
  const latitude = item.location?.coordinates?.[1] || 0;

  return {
    ...item,
    longitude,
    latitude,
  };
};

export const productsApi = {
  async getAllProducts(): Promise<ProductResponse> {
    console.log('ProductsAPI - Fetching all published product templates');
    const response = await fetch(`${API_URL}/product-templates`, {
      method: 'GET',
      headers: await createHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ProductsAPI - Failed to get products:', error);
      throw new Error(error.message || 'Failed to get products');
    }

    const result = await response.json();

    // Transform product data to include computed lat/lng fields
    const products = result.data ? result.data.map(transformProduct) : [];

    console.log('ProductsAPI - Products fetched and transformed:', {
      count: products.length,
      sample: products.slice(0, 3).map((p: Product) => ({
        id: p._id?.substring(0, 8),
        name: p.productName,
        type: p.productType,
        vendor: p.vendorId?.substring(0, 8),
        coordinates: [p.longitude, p.latitude],
      })),
    });

    return {
      ...result,
      data: products,
    };
  },

  async getProductsByVendor(vendorId: string): Promise<ProductResponse> {
    console.log('ProductsAPI - Fetching product templates for vendor:', vendorId);
    const response = await fetch(`${API_URL}/product-templates/by-vendor/${vendorId}`, {
      method: 'GET',
      headers: await createHeaders(true), // Changed to true to include auth token
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ProductsAPI - Failed to get vendor products:', error);
      throw new Error(error.message || 'Failed to get vendor products');
    }

    const result = await response.json();

    // Transform product data to include computed lat/lng fields
    const products = result.data ? result.data.map(transformProduct) : [];

    console.log('ProductsAPI - Vendor products fetched and transformed:', {
      vendorId: vendorId.substring(0, 8),
      count: products.length,
    });

    return {
      ...result,
      data: products,
    };
  },

  async getVendorProducts(vendorId: string): Promise<ProductResponse> {
    // Alias for getProductsByVendor for consistency
    return this.getProductsByVendor(vendorId);
  },

  async getNearbyProducts(
    lat: number,
    lng: number,
    radius: number = 10000
  ): Promise<ProductResponse> {
    console.log('ProductsAPI - Fetching nearby product items:', { lat, lng, radius });
    const response = await fetch(
      `${API_URL}/product-items/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
      {
        method: 'GET',
        headers: await createHeaders(false),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('ProductsAPI - Failed to get nearby products:', error);
      throw new Error(error.message || 'Failed to get nearby products');
    }

    const result = await response.json();
    console.log('ProductsAPI - Nearby products fetched:', {
      location: `${lat},${lng}`,
      radius,
      count: result.data?.length || 0,
    });
    return result;
  },

  async getNearbyActivitiesForToday(
    lat: number,
    lng: number,
    radius: number = 10
  ): Promise<ProductItemResponse> {
    const today = new Date();
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    console.log('ProductsAPI - Fetching nearby activities for today:', {
      lat,
      lng,
      radius,
      startDate: today.toISOString(),
      endDate: twoDaysFromNow.toISOString(),
    });

    const response = await fetch(
      `${API_URL}/product-items/nearby-today?` +
        `lat=${lat}&lng=${lng}&radius=${radius}&` +
        `startDate=${today.toISOString()}&endDate=${twoDaysFromNow.toISOString()}`,
      {
        method: 'GET',
        headers: await createHeaders(true),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('ProductsAPI - Failed to get nearby activities:', error);
      throw new Error(error.message || 'Failed to get nearby activities');
    }

    const result = await response.json();

    // Transform product items to include computed lat/lng fields
    const activities = result.data ? result.data.map(transformProductItem) : [];

    console.log('ProductsAPI - Nearby activities fetched:', {
      location: `${lat},${lng}`,
      radius,
      count: activities.length,
      sample: activities.slice(0, 3).map((item: ProductItem) => ({
        id: item._id?.substring(0, 8),
        name: item.templateName,
        date: item.productDate,
        startTime: item.startTime,
        coordinates: [item.longitude, item.latitude],
      })),
    });

    return {
      ...result,
      data: activities,
    };
  },

  async getProductsByType(type: ProductType): Promise<ProductResponse> {
    console.log('ProductsAPI - Fetching products by type:', type);
    const response = await fetch(`${API_URL}/products/by-type?type=${type}`, {
      method: 'GET',
      headers: await createHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ProductsAPI - Failed to get products by type:', error);
      throw new Error(error.message || 'Failed to get products by type');
    }

    const result = await response.json();
    console.log('ProductsAPI - Products by type fetched:', {
      type,
      count: result.data?.length || 0,
    });
    return result;
  },

  async searchProducts(searchTerm: string): Promise<ProductResponse> {
    console.log('ProductsAPI - Searching products:', searchTerm);
    const response = await fetch(
      `${API_URL}/products/search?term=${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET',
        headers: await createHeaders(false),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('ProductsAPI - Failed to search products:', error);
      throw new Error(error.message || 'Failed to search products');
    }

    const result = await response.json();
    console.log('ProductsAPI - Products search results:', {
      searchTerm,
      count: result.data?.length || 0,
    });
    return result;
  },

  async getProduct(productId: string): Promise<{ data: Product }> {
    console.log('ProductsAPI - Fetching product:', productId);
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'GET',
      headers: await createHeaders(false),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ProductsAPI - Failed to get product:', error);
      throw new Error(error.message || 'Failed to get product');
    }

    const result = await response.json();
    console.log('ProductsAPI - Product fetched:', {
      id: result.data._id?.substring(0, 8),
      name: result.data.productName,
      type: result.data.productType,
    });
    return result;
  },
};
