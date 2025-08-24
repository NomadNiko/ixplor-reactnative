import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '~/lib/api/cart';
import { useCart } from '~/hooks/useCart';
import { FontFamilies } from '~/src/styles/fonts';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateItem, removeItem, isUpdatingItem, isRemovingItem } = useCart();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleIncrease = () => {
    updateItem({ productItemId: item.productItemId, quantity: item.quantity + 1 });
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateItem({ productItemId: item.productItemId, quantity: item.quantity - 1 });
    } else {
      removeItem(item.productItemId);
    }
  };

  const handleRemove = () => {
    removeItem(item.productItemId);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(28, 40, 58, 0.8)', 'rgba(21, 29, 43, 0.8)']}
        style={styles.cardGradient}>
        {item.productImageURL && (
          <Image
            source={item.productImageURL}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        )}
        
        <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{item.productName}</Text>
          <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>
            {formatDate(item.productDate)} • {formatTime(item.productStartTime)}
          </Text>
          <Text style={styles.detailText}>
            Duration: {item.productDuration} min
          </Text>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              onPress={handleDecrease}
              style={styles.quantityButton}
              disabled={isUpdatingItem || isRemovingItem}>
              <Ionicons name="remove" size={20} color="#E0FCFF" />
            </TouchableOpacity>
            
            <Text style={styles.quantity}>{item.quantity}</Text>
            
            <TouchableOpacity
              onPress={handleIncrease}
              style={styles.quantityButton}
              disabled={isUpdatingItem}>
              <Ionicons name="add" size={20} color="#E0FCFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.price}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  details: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    fontSize: 16,
    fontFamily: FontFamilies.primaryMedium,
    color: '#E0FCFF',
    paddingHorizontal: 16,
  },
  price: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#60A5FA',
  },
});