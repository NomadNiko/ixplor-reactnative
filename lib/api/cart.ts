import { API_URL } from './config';
import { getTokensInfo } from './storage';

export interface CartItem {
  productItemId: string;
  productName: string;
  productDescription?: string;
  price: number;
  quantity: number;
  productImageURL?: string;
  vendorId: string;
  productType: 'tours' | 'lessons' | 'rentals' | 'tickets';
  productDate: string;
  productStartTime: string;
  productDuration: number;
  quantityAvailable?: number;
  templateId: string;
  templateName: string;
}

export interface CartResponse {
  _id?: string;
  userId: string;
  items: CartItem[];
  total?: number;
  createdAt?: string;
  updatedAt?: string;
  isCheckingOut?: boolean;
}

export interface AddToCartData {
  productItemId: string;
  productDate: Date;
  quantity: number;
  vendorId: string;
  templateId: string;
}

export interface UpdateCartItemData {
  productItemId: string;
  quantity: number;
}

const getAuthToken = async () => {
  try {
    const tokensInfo = await getTokensInfo();
    if (!tokensInfo?.token) {
      throw new Error('No auth token');
    }
    return tokensInfo.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('No auth token');
  }
};

export const cartService = {
  async getCart(): Promise<CartResponse> {
    console.log('🛒 CartService: Getting cart...');
    const token = await getAuthToken();
    console.log('🔑 CartService: Token obtained:', token ? 'Present' : 'Missing');
    
    const response = await fetch(`${API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('📡 CartService: GET cart response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ CartService: GET cart failed:', errorData);
      throw new Error(errorData.message || 'Failed to fetch cart');
    }
    
    const result = await response.json();
    console.log('✅ CartService: Cart fetched successfully:', {
      itemCount: result.items?.length || 0,
      userId: result.userId,
    });
    
    return result;
  },

  async addToCart(data: AddToCartData): Promise<CartResponse> {
    console.log('🛒 CartService: Adding to cart...');
    console.log('📦 CartService: Add to cart data:', {
      ...data,
      productDate: data.productDate.toISOString(),
    });
    
    const token = await getAuthToken();
    console.log('🔑 CartService: Token obtained:', token ? 'Present' : 'Missing');
    
    const requestBody = {
      ...data,
      productDate: data.productDate.toISOString(),
    };
    
    console.log('📡 CartService: Making POST request to:', `${API_URL}/cart/add`);
    console.log('📦 CartService: Request body:', requestBody);
    
    const response = await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📡 CartService: POST cart/add response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ CartService: Add to cart failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(errorData.message || 'Failed to add item to cart');
    }
    
    const result = await response.json();
    console.log('✅ CartService: Item added to cart successfully:', {
      itemCount: result.items?.length || 0,
      newItemId: result.items?.[result.items.length - 1]?.productItemId,
    });
    
    return result;
  },

  async updateCartItem(data: UpdateCartItemData): Promise<CartResponse> {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/cart/${data.productItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity: data.quantity }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update cart item');
    }
    return response.json();
  },

  async removeFromCart(productItemId: string): Promise<CartResponse> {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/cart/${productItemId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to remove item from cart');
    }
    return response.json();
  },

  async clearCart(): Promise<CartResponse> {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/cart`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to clear cart');
    }
    return response.json();
  },
};