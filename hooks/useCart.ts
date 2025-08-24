import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { cartService, CartItem, CartResponse, AddToCartData, UpdateCartItemData } from '~/lib/api/cart';
import { useAuth } from '~/lib/auth/context';
import { API_URL } from '~/lib/api/config';
import { getTokensInfo } from '~/lib/api/storage';
import Toast from 'react-native-toast-message';

interface ValidationError {
  type: 'INSUFFICIENT_QUANTITY' | 'ITEM_UNAVAILABLE' | 'TIME_CONFLICT' | 'VALIDATION_ERROR';
  message: string;
}

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: cartService.getCart,
    enabled: !!user,
  });

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

  const validateInventory = async (productItemId: string, quantity: number): Promise<ValidationError | null> => {
    try {
      console.log('🔍 Validating inventory for item:', productItemId);
      const response = await fetch(`${API_URL}/product-items/${productItemId}`, {
        headers: await createHeaders(true)
      });

      console.log('📡 Inventory validation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Inventory validation request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // For now, let's skip inventory validation if the endpoint fails
        // This allows the cart to work even if the product-items endpoint has issues
        console.log('⚠️ Skipping inventory validation due to API error');
        return null;
      }

      const item = await response.json();
      console.log('📦 Full item response for debugging:', item);
      console.log('📦 Item details for validation:', {
        id: item._id || item.id,
        status: item.itemStatus,
        quantityAvailable: item.quantityAvailable,
        requestedQuantity: quantity,
        // Let's also check if it's nested in a data property
        dataProperty: item.data ? {
          status: item.data.itemStatus,
          quantity: item.data.quantityAvailable
        } : 'No data property'
      });

      // Handle both direct response and nested data response
      const actualItem = item.data || item;
      
      if (actualItem.itemStatus !== 'PUBLISHED') {
        console.log('❌ Item is not published:', actualItem.itemStatus);
        return { type: 'ITEM_UNAVAILABLE', message: 'Item is not available' };
      }

      if (actualItem.quantityAvailable < quantity) {
        console.log('❌ Insufficient quantity:', { available: actualItem.quantityAvailable, requested: quantity });
        return {
          type: 'INSUFFICIENT_QUANTITY',
          message: `Only ${actualItem.quantityAvailable} available`
        };
      }

      console.log('✅ Inventory validation passed');
      return null;
    } catch (error) {
      console.error('💥 Inventory validation error:', error);
      // Skip validation on error to allow cart to work
      console.log('⚠️ Skipping inventory validation due to error');
      return null;
    }
  };

  const checkTimeConflicts = (
    newItem: { productDate: string; productStartTime: string; productDuration: number },
    existingItems: CartItem[]
  ): ValidationError | null => {
    const newStart = new Date(`${newItem.productDate}T${newItem.productStartTime}`);
    const newEnd = new Date(newStart.getTime() + (newItem.productDuration * 60 * 1000));

    const hasConflict = existingItems.some(item => {
      if (!item.productDate || !item.productStartTime || !item.productDuration) return false;
      const itemStart = new Date(`${item.productDate}T${item.productStartTime}`);
      const itemEnd = new Date(itemStart.getTime() + (item.productDuration * 60 * 1000));
      return (newStart < itemEnd && newEnd > itemStart);
    });

    if (hasConflict) {
      return { type: 'TIME_CONFLICT', message: 'Time conflict with existing cart item' };
    }

    return null;
  };

  const addItemMutation = useMutation({
    mutationFn: async (data: AddToCartData) => {
      console.log('🛒 AddItem mutation started with data:', data);
      
      console.log('🔍 Validating inventory...');
      const inventoryError = await validateInventory(data.productItemId, data.quantity);
      if (inventoryError) {
        console.error('❌ Inventory validation failed:', inventoryError);
        throw new Error(inventoryError.message);
      }
      console.log('✅ Inventory validation passed');

      console.log('📦 Fetching item details for time conflict check...');
      const itemResponse = await fetch(`${API_URL}/product-items/${data.productItemId}`, {
        headers: await createHeaders(true)
      });
      
      if (!itemResponse.ok) {
        console.log('⚠️ Failed to fetch item details for time conflict check, skipping...');
        console.log('🚀 Proceeding directly to cart service...');
      } else {
        const itemDetails = await itemResponse.json();
        const actualItemDetails = itemDetails.data || itemDetails;
        console.log('✅ Item details fetched for time conflict check:', {
          id: actualItemDetails._id,
          name: actualItemDetails.templateName,
          date: actualItemDetails.productDate,
          startTime: actualItemDetails.startTime,
        });

        if (cartQuery.data?.items && cartQuery.data.items.length > 0) {
          console.log('⏰ Checking time conflicts with existing cart items...');
          const timeConflict = checkTimeConflicts(actualItemDetails, cartQuery.data.items);
          if (timeConflict) {
            console.error('❌ Time conflict detected:', timeConflict);
            throw new Error(timeConflict.message);
          }
          console.log('✅ No time conflicts detected');
        } else {
          console.log('ℹ️ No existing cart items, skipping time conflict check');
        }
      }

      console.log('🚀 Adding to cart via service...');
      const result = await cartService.addToCart(data);
      console.log('✅ Cart service returned:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 AddItem mutation succeeded, invalidating cart queries...');
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      
      const itemCount = data?.items?.length || 1;
      Toast.show({
        type: 'success',
        text1: '✅ Added to cart!',
        text2: `Cart now has ${itemCount} item${itemCount !== 1 ? 's' : ''}`,
        visibilityTime: 3000,
        position: 'top',
        topOffset: 100,
      });
      console.log('✅ Cart queries invalidated and success toast shown');
    },
    onError: (error: Error) => {
      console.error('💥 AddItem mutation failed:', error);
      Toast.show({
        type: 'error',
        text1: '❌ Failed to add to cart',
        text2: error.message,
        visibilityTime: 4000,
        position: 'top',
        topOffset: 100,
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: UpdateCartItemData) => {
      if (data.quantity > 0) {
        const inventoryError = await validateInventory(data.productItemId, data.quantity);
        if (inventoryError) {
          throw new Error(inventoryError.message);
        }
      }
      return cartService.updateCartItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to update quantity',
        text2: error.message,
        visibilityTime: 3000,
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: cartService.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      Toast.show({
        type: 'success',
        text1: '🗑️ Removed from cart',
        visibilityTime: 2500,
        position: 'top',
        topOffset: 100,
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to remove item',
        text2: error.message,
        visibilityTime: 3000,
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
      Toast.show({
        type: 'success',
        text1: '🧹 Cart cleared',
        visibilityTime: 2500,
        position: 'top',
        topOffset: 100,
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Failed to clear cart',
        text2: error.message,
        visibilityTime: 3000,
      });
    },
  });

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingItem: addItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    refreshCart: () => queryClient.invalidateQueries({ queryKey: ['cart', user?.id] }),
    itemCount: cartQuery.data?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    cartTotal: cartQuery.data?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
  };
}