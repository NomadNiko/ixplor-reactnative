import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProductItem, PRODUCT_TYPE_LABELS } from '~/lib/types/product';
import { FontFamilies } from '~/src/styles/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.8;

interface ProductDetailModalProps {
  visible: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart?: (product: ProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  visible,
  product,
  onClose,
  onAddToCart
}) => {
  if (!product) return null;

  const availableQty = product.quantityAvailable - (product.quantitySold || 0);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['rgba(28, 40, 58, 0.98)', 'rgba(21, 29, 43, 0.98)']}
            style={styles.card}>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{product.templateName}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Product Image */}
              {product.imageURL && (
                <View style={styles.imageContainer}>
                  <Image
                    source={product.imageURL}
                    style={styles.productImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={300}
                  />
                </View>
              )}

              {/* Description */}
              <Text style={styles.description}>{product.description}</Text>

              {/* Details */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    {formatDate(product.productDate)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    {formatTime(product.startTime)} ({product.duration} min)
                  </Text>
                </View>

                {product.location && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={20} color="#94A3B8" />
                    <TouchableOpacity>
                      <Text style={styles.locationLink}>View Location</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    ${product.price} • {availableQty} spots available
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="folder-outline" size={20} color="#94A3B8" />
                  <Text style={styles.detailText}>
                    {PRODUCT_TYPE_LABELS[product.productType]}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.closeFooterButton}
                onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamilies.primaryBold,
    color: '#F8FAFC',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  description: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: FontFamilies.primary,
  },
  detailsSection: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#F8FAFC',
    flex: 1,
    fontFamily: FontFamilies.primary,
  },
  locationLink: {
    fontSize: 16,
    color: '#3B82F6',
    textDecorationLine: 'underline',
    fontFamily: FontFamilies.primaryMedium,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  closeFooterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#F8FAFC',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#FFFFFF',
  },
});

export default ProductDetailModal;