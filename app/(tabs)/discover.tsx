import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Header from '~/src/components/Header';
import { useAuth } from '~/lib/auth/context';
import { productsApi } from '~/lib/api/products';
import { ProductItem } from '~/lib/types/product';
import ProductCard from '~/src/components/ProductCard';
import { ProductDetailModal } from '~/src/components/ProductDetailModal';
import { imageCache } from '~/src/lib/services/imageCache';
import { FontFamilies } from '~/src/styles/fonts';

interface City {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const CITIES: City[] = [
  {
    name: 'Honolulu',
    coordinates: {
      latitude: 21.3099,
      longitude: -157.8581,
    },
  },
  {
    name: 'Providence',
    coordinates: {
      latitude: 41.824,
      longitude: -71.4128,
    },
  },
  {
    name: 'Prague',
    coordinates: {
      latitude: 50.0755,
      longitude: 14.4378,
    },
  },
];

export default function Discover() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [allProductItems, setAllProductItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);

  useEffect(() => {
    loadCityProducts();
  }, [selectedCity]);

  useEffect(() => {
    filterProductsByDate();
  }, [selectedDate, allProductItems]);

  const loadCityProducts = async () => {
    try {
      setIsLoading(true);
      console.log('Discover - Loading products for city:', selectedCity.name);

      // Use the nearby products API with ~100 mile radius (160km)
      const response = await productsApi.getNearbyActivitiesForToday(
        selectedCity.coordinates.latitude,
        selectedCity.coordinates.longitude,
        160 // ~100 miles in km
      );

      console.log('Discover - City products loaded:', {
        city: selectedCity.name,
        total: response.data?.length || 0,
      });

      // Store all available products (regardless of date) for date filtering
      const availableProductsOnly = (response.data || []).filter((item: ProductItem) => {
        const sold = item.quantitySold || 0;
        return item.quantityAvailable > sold;
      });

      setAllProductItems(availableProductsOnly);

      // Preload product images for better UX
      if (availableProductsOnly.length > 0) {
        imageCache.preloadProductImages(availableProductsOnly);
      }
    } catch (error) {
      console.error('Discover - Failed to load city products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
      setAllProductItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProductsByDate = () => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];

    const filteredProducts = allProductItems.filter((item) => {
      const itemDateString = item.productDate.split('T')[0];
      return itemDateString === selectedDateString;
    });

    setProductItems(filteredProducts);
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
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const getMaxDate = (): Date => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    if (currentMonth === 11) {
      return new Date(currentYear + 1, 11, 31);
    } else {
      return new Date(currentYear, 11, 31);
    }
  };

  const handleProductPress = (item: ProductItem) => {
    setSelectedProduct(item);
    setShowProductDetail(true);
  };

  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: ProductItem) => {
    Alert.alert('Added to Cart', `${product.templateName} has been added to your cart!`);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
    return R * c;
  };

  const renderCitySelector = () => (
    <View style={styles.cityContainer}>
      {CITIES.map((city) => {
        const isActive = selectedCity.name === city.name;
        return (
          <TouchableOpacity
            key={city.name}
            style={[styles.cityChip, isActive ? styles.cityChipActive : styles.cityChipInactive]}
            onPress={() => setSelectedCity(city)}>
            <Text
              style={[styles.cityText, isActive ? styles.cityTextActive : styles.cityTextInactive]}>
              {city.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />

      <View style={styles.content}>
        {/* City Selector */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Xplor</Text>
        </View>
        {renderCitySelector()}

        {/* Date Picker */}
        <TouchableOpacity style={styles.datePickerButton} onPress={openDatePicker}>
          <Ionicons name="calendar-outline" size={20} color="#60A5FA" />
          <Text style={styles.datePickerText}>{formatDateForDisplay(selectedDate)}</Text>
          <Ionicons name="chevron-down" size={16} color="#94A3B8" />
        </TouchableOpacity>

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
                  <TouchableOpacity style={styles.cancelButton} onPress={cancelDateSelection}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmButton} onPress={confirmDateSelection}>
                    <Text style={styles.confirmButtonText}>Select</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {productItems.length} {productItems.length === 1 ? 'activity' : 'activities'} in{' '}
            {selectedCity.name}
          </Text>
        </View>

        {/* Products List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : productItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities found</Text>
            <Text style={styles.emptySubtext}>Try selecting a different date or city</Text>
          </View>
        ) : (
          <FlatList
            data={productItems}
            renderItem={({ item }) => {
              const distance = calculateDistance(
                selectedCity.coordinates.latitude,
                selectedCity.coordinates.longitude,
                item.latitude,
                item.longitude
              );

              return (
                <ProductCard
                  product={item}
                  distance={distance}
                  onPress={() => handleProductPress(item)}
                />
              );
            }}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Product Detail Modal */}
      <ProductDetailModal
        visible={showProductDetail}
        product={selectedProduct}
        onClose={handleCloseProductDetail}
        onAddToCart={handleAddToCart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#E0FCFF',
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
  },
  cityContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  cityChip: {
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cityChipActive: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  cityChipInactive: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cityText: {
    fontSize: 14,
    fontFamily: FontFamilies.primaryMedium,
    textAlign: 'center',
  },
  cityTextActive: {
    color: '#ADF7FF',
    fontFamily: FontFamilies.primarySemiBold,
  },
  cityTextInactive: {
    color: '#E2E8F0',
    fontFamily: FontFamilies.primaryMedium,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#E0FCFF',
    marginLeft: 12,
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
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    color: '#E0FCFF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
    fontFamily: FontFamilies.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#E0FCFF',
    fontSize: 20,
    fontFamily: FontFamilies.primarySemiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FontFamilies.primary,
  },
  listContainer: {
    paddingBottom: 20,
  },
});
