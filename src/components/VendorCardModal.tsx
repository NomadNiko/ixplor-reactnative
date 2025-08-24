import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Vendor, getVendorDisplayName } from '~/lib/api/vendors';
import { API_URL } from '~/lib/api/config';
import { getTokensInfo } from '~/lib/api/storage';
import { ProductItem, PRODUCT_TYPE_LABELS } from '~/lib/types/product';
import ProductDetailModal from './ProductDetailModal';
import { imageCache } from '../lib/services/imageCache';
import { FontFamilies } from '~/src/styles/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.95;
const CARD_MAX_HEIGHT = screenHeight * 0.85;

interface VendorCardModalProps {
  visible: boolean;
  vendor: Vendor | null;
  onClose: () => void;
}

export const VendorCardModal: React.FC<VendorCardModalProps> = ({ visible, vendor, onClose }) => {
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [allProductItems, setAllProductItems] = useState<ProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);

  // Track previous vendor ID to detect changes
  const prevVendorIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (vendor && visible) {
      // ALWAYS clear data first when opening modal for ANY vendor
      setProductItems([]);
      setAllProductItems([]);
      setIsLoadingProducts(true);
      setSelectedDate(new Date());
      setSelectedProduct(null);
      setShowProductDetail(false);
      setCurrentVendorId(vendor._id); // Set current vendor ID for image rendering
      
      // Update previous vendor ID
      prevVendorIdRef.current = vendor._id;
      
      // Load new vendor's products
      loadVendorProducts();
    } else {
      // Clear all data when modal closes to prevent stale data flash
      setProductItems([]);
      setAllProductItems([]);
      setIsLoadingProducts(false);
      setSelectedProduct(null);
      setShowProductDetail(false);
      setSelectedDate(new Date());
      setCurrentVendorId(null); // Clear current vendor ID
      prevVendorIdRef.current = null; // Reset vendor tracking
    }
  }, [vendor?._id, visible]); // Use vendor._id to detect vendor changes

  useEffect(() => {
    // Only filter if we have products to filter
    if (allProductItems.length > 0) {
      filterProductsByDate();
    }
  }, [selectedDate, allProductItems]);

  const loadVendorProducts = async () => {
    if (!vendor?._id) return;

    try {
      // Prevent multiple simultaneous loads
      if (isLoadingProducts) {
        return;
      }
      
      setIsLoadingProducts(true);
      console.log('Loading product items for vendor:', vendor._id);
      
      // Fetch product items (inventory) instead of templates
      // This matches the frontend implementation  
      const tokens = await getTokensInfo();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (tokens?.token) {
        headers.Authorization = `Bearer ${tokens.token}`;
      }
      
      const response = await fetch(`${API_URL}/product-items/by-vendor/${vendor._id}/public`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendor products');
      }
      
      const data = await response.json();
      
      console.log('Vendor products loaded:', data.data?.length || 0);
      
      // Store all available products (regardless of date) for date filtering
      const availableProductsOnly = (data.data || []).filter((item: ProductItem) => {
        const sold = item.quantitySold || 0;
        return item.quantityAvailable > sold;
      });
      
      // Only update state if products actually changed
      if (JSON.stringify(availableProductsOnly.map(p => p._id)) !== JSON.stringify(allProductItems.map(p => p._id))) {
        setAllProductItems(availableProductsOnly);
        
        // Preload product images for better UX (throttled)
        if (availableProductsOnly.length > 0) {
          const imagesToPreload = availableProductsOnly.slice(0, 5); // Limit to first 5
          imageCache.preloadProductImages(imagesToPreload);
        }
      }
    } catch (error) {
      console.error('Failed to load vendor products:', error);
      setProductItems([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const filterProductsByDate = () => {
    // Only filter if we have products to avoid unnecessary state updates
    if (allProductItems.length === 0) {
      if (productItems.length > 0) {
        setProductItems([]);
      }
      return;
    }
    
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    
    const filteredProducts = allProductItems.filter((item) => {
      const itemDateString = item.productDate.split('T')[0];
      return itemDateString === selectedDateString;
    });
    
    // Only update state if the filtered results are different
    if (JSON.stringify(filteredProducts.map(p => p._id)) !== JSON.stringify(productItems.map(p => p._id))) {
      setProductItems(filteredProducts);
    }
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const openDatePicker = () => {
    setTempDate(selectedDate);
    setShowDatePicker(true);
  };

  const confirmDateSelection = () => {
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const getMinDate = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Ensure we're getting today's date in local timezone
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const getMaxDate = (): Date => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // If current month is December (11), allow next year
    if (currentMonth === 11) {
      return new Date(currentYear + 1, 11, 31); // December 31 of next year
    } else {
      return new Date(currentYear, 11, 31); // December 31 of current year
    }
  };

  // Don't render anything if modal is not visible or vendor is null
  // This prevents any flash of old vendor data
  if (!vendor || !visible) return null;

  const handleProductPress = (item: ProductItem) => {
    // Prevent modal state race conditions
    if (!isModalTransitioning && !showProductDetail) {
      setIsModalTransitioning(true);
      setSelectedProduct(item);
      setShowProductDetail(true);
      // Reset transitioning state after animation completes
      setTimeout(() => setIsModalTransitioning(false), 300);
    }
  };

  const handleCloseProductDetail = () => {
    if (!isModalTransitioning) {
      setShowProductDetail(false);
      setSelectedProduct(null);
    }
  };

  const handleAddToCart = (product: ProductItem) => {
    // TODO: Implement add to cart functionality
    Alert.alert('Added to Cart', `${product.templateName} has been added to your cart!`);
  };

  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      tours: '#60A5FA',
      lessons: '#10B981',
      rentals: '#F59E0B',
      tickets: '#EF4444',
    };
    return colors[type] || '#6B7280';
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.blurContainer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.cardContainer}>
              <LinearGradient
                colors={['rgba(28, 40, 58, 0.98)', 'rgba(21, 29, 43, 0.98)']}
                style={styles.card}>
                
                {/* Header with Close Button */}
                <View style={styles.header}>
                  <View style={styles.headerContent}>
                    <View style={[styles.vendorLogo, styles.logoPlaceholder]}>
                      {visible && vendor && vendor.logoUrl ? (
                        <Image
                          source={{ uri: vendor.logoUrl }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                          key={vendor._id}
                        />
                      ) : (
                        <Ionicons name="storefront" size={32} color="#94A3B8" />
                      )}
                    </View>
                    <View style={styles.headerText}>
                      <Text style={styles.vendorName}>{currentVendorId === vendor._id ? getVendorDisplayName(vendor) : 'Loading...'}</Text>
                      <Text style={styles.vendorType}>{currentVendorId === vendor._id ? (vendor.vendorType || 'Vendor') : ''}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close-circle" size={32} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Business Description and Address */}
                <View style={styles.infoSection}>
                  {vendor.description && currentVendorId === vendor._id && (
                    <Text style={styles.description}>{vendor.description}</Text>
                  )}
                  {vendor.address && currentVendorId === vendor._id && (
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={16} color="#94A3B8" />
                      <Text style={styles.addressText}>
                        {vendor.address}
                        {vendor.city && `, ${vendor.city}`}
                        {vendor.state && `, ${vendor.state}`}
                        {vendor.postalCode && ` ${vendor.postalCode}`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Active Products Section */}
                <View style={styles.productsSection}>
                  <Text style={styles.sectionTitle}>Available Products</Text>
                  
                  {/* Date Picker */}
                  {!isLoadingProducts && allProductItems.length > 0 && (
                    <View style={styles.datePicker}>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={openDatePicker}>
                        <Ionicons name="calendar-outline" size={20} color="#60A5FA" />
                        <Text style={styles.datePickerText}>
                          {formatDateForDisplay(selectedDate)}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Date Picker Modal */}
                  {showDatePicker && (
                    <Modal visible={true} transparent={true} animationType="fade">
                      <View style={styles.datePickerOverlay}>
                        <View style={styles.datePickerModalContent}>
                          <DateTimePicker
                            value={tempDate}
                            mode="date"
                            display="spinner"
                            onChange={onDateChange}
                            minimumDate={getMinDate()}
                            maximumDate={getMaxDate()}
                          />
                          <View style={styles.datePickerButtons}>
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={cancelDateSelection}>
                              <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.confirmButton}
                              onPress={confirmDateSelection}>
                              <Text style={styles.confirmButtonText}>Select</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>
                  )}
                  
                  {isLoadingProducts ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#60A5FA" />
                      <Text style={styles.loadingText}>Loading products...</Text>
                    </View>
                  ) : allProductItems.length === 0 && !isLoadingProducts ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No products available</Text>
                    </View>
                  ) : productItems.length > 0 ? (
                    <ScrollView
                      style={styles.productsList}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.productsContent}>
                      {productItems.map((item) => {
                        const sold = item.quantitySold || 0;
                        const availableQty = item.quantityAvailable - sold;
                        return (
                          <TouchableOpacity
                            key={item._id}
                            style={styles.productCard}
                            onPress={() => handleProductPress(item)}>
                            <View style={styles.productHeader}>
                              <Text style={styles.productName} numberOfLines={1}>
                                {item.templateName}
                              </Text>
                              <View
                                style={[
                                  styles.typeBadge,
                                  { backgroundColor: getTypeColor(item.productType) },
                                ]}>
                                <Text style={styles.typeText}>
                                  {PRODUCT_TYPE_LABELS[item.productType]}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.productDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                            <View style={styles.productDetails}>
                              <Text style={styles.productDate}>
                                {new Date(item.productDate).toLocaleDateString()} at {item.startTime}
                              </Text>
                              <Text style={styles.productAvailability}>
                                {availableQty} spots left
                              </Text>
                            </View>
                            <View style={styles.productFooter}>
                              <Text style={styles.productPrice}>${item.price}</Text>
                              {item.duration && (
                                <Text style={styles.productDuration}>
                                  {item.duration} min
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No products available for selected date</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Product Detail Modal */}
      <ProductDetailModal
        visible={showProductDetail}
        product={selectedProduct}
        onClose={handleCloseProductDetail}
        onAddToCart={handleAddToCart}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_MAX_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  card: {
    width: '100%',
    padding: 20,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorLogo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  logoPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 2,
  },
  vendorType: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
    fontFamily: FontFamilies.primary,
  },
  closeButton: {
    padding: 4,
  },
  infoSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  description: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: FontFamilies.primary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 13,
    color: '#94A3B8',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
    fontFamily: FontFamilies.primary,
  },
  productsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    marginBottom: 16,
  },
  datePicker: {
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#E0FCFF',
    marginLeft: 8,
    fontFamily: FontFamilies.primary,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModalContent: {
    backgroundColor: 'rgba(28, 40, 58, 0.98)',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '80%',
    maxWidth: 350,
    alignItems: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#60A5FA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#E0FCFF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  confirmButtonText: {
    color: '#ADF7FF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  productsList: {
    flex: 1,
  },
  productsContent: {
    paddingBottom: 10,
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
    textTransform: 'uppercase',
  },
  productDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: FontFamilies.primary,
  },
  productDetails: {
    marginBottom: 12,
  },
  productDate: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 4,
    fontFamily: FontFamilies.primary,
  },
  productAvailability: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: FontFamilies.primarySemiBold,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontFamily: FontFamilies.primaryBold,
    color: '#60A5FA',
  },
  productDuration: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
    fontFamily: FontFamilies.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: FontFamilies.primary,
  },
});

export default VendorCardModal;