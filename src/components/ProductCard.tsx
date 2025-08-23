import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductItem } from '~/lib/types/product';
import { FontFamilies } from '~/src/styles/fonts';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32; // Account for padding

interface ProductCardProps {
  product: ProductItem;
  distance: number;
  onPress: () => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({ product, distance, onPress }) => {
  const formatDateTime = (dateStr: string, timeStr: string): string => {
    try {
      const date = new Date(dateStr);
      const [hours, minutes] = timeStr.split(':').map(Number);

      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      const datetime = new Date(date.setHours(hours, minutes));
      return datetime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return 'Invalid date';
    }
  };

  const getProductTypeColor = (type: string): string => {
    switch (type) {
      case 'tours':
        return '#10B981';
      case 'lessons':
        return '#3B82F6';
      case 'rentals':
        return '#F59E0B';
      case 'tickets':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getProductTypeLabel = (type: string): string => {
    switch (type) {
      case 'tours':
        return 'Tour';
      case 'lessons':
        return 'Lesson';
      case 'rentals':
        return 'Rental';
      case 'tickets':
        return 'Ticket';
      default:
        return 'Activity';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={['rgba(28, 40, 58, 0.95)', 'rgba(21, 29, 43, 0.95)']}
        style={styles.card}>
        {/* Image */}
        {product.imageURL && (
          <Image 
            source={product.imageURL} 
            style={styles.image}
            cachePolicy="memory-disk"
            transition={200}
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {product.templateName}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getProductTypeColor(product.productType) },
              ]}>
              <Text style={styles.typeText}>{getProductTypeLabel(product.productType)}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText} numberOfLines={1}>
                {formatDateTime(product.productDate, product.startTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{distance.toFixed(1)} mi away</Text>
            </View>

            {product.duration && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>⏱️</Text>
                <Text style={styles.detailText}>{product.duration} min</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.footer}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.quantityAvailable > 0 && (
              <Text style={styles.availability}>
                {product.quantityAvailable - (product.quantitySold || 0)} spots left
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Memoized component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.product._id === nextProps.product._id &&
    Math.abs(prevProps.distance - nextProps.distance) < 0.1 && // Only re-render if distance changes significantly
    prevProps.product.quantityAvailable === nextProps.product.quantityAvailable &&
    prevProps.product.quantitySold === nextProps.product.quantitySold
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#F8FAFC',
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
    fontFamily: FontFamilies.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontFamily: FontFamilies.primaryBold,
    color: '#3B82F6',
  },
  availability: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: FontFamilies.primaryMedium,
  },
});

export default ProductCard;
