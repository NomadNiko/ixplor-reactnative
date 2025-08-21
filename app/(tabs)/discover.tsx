import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '~/src/components/Header';
import { useAuth } from '~/lib/auth/context';
import { productsApi } from '~/lib/api/products';
import { Product, ProductType, PRODUCT_TYPE_LABELS } from '~/lib/types/product';

export default function Discover() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedType]);

  const loadProducts = async () => {
    try {
      console.log('Discover - Loading all products');
      setIsLoading(true);
      const response = await productsApi.getAllProducts();

      console.log('Discover - Products loaded:', {
        total: response.data?.length || 0,
        types: response.data?.reduce((acc: Record<string, number>, p) => {
          acc[p.productType] = (acc[p.productType] || 0) + 1;
          return acc;
        }, {}),
      });

      setProducts(response.data || []);
    } catch (error) {
      console.error('Discover - Failed to load products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((p) => p.productType === selectedType);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName.toLowerCase().includes(search) ||
          p.productDescription.toLowerCase().includes(search)
      );
    }

    setFilteredProducts(filtered);
  };

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        Alert.alert(
          product.productName,
          `${product.productDescription}\n\nPrice: $${product.productPrice}\nType: ${PRODUCT_TYPE_LABELS[product.productType]}`
        );
      }}>
      <LinearGradient
        colors={['rgba(28, 40, 58, 0.8)', 'rgba(21, 29, 43, 0.8)']}
        style={styles.cardGradient}>
        {product.productImageURL && (
          <Image
            source={{ uri: product.productImageURL }}
            style={styles.productImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.productName}
            </Text>
            <View
              style={[styles.typeBadge, { backgroundColor: getTypeColor(product.productType) }]}>
              <Text style={styles.typeText}>{PRODUCT_TYPE_LABELS[product.productType]}</Text>
            </View>
          </View>
          <Text style={styles.productDescription} numberOfLines={3}>
            {product.productDescription}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.productPrice}>${product.productPrice}</Text>
            {product.productDuration && (
              <Text style={styles.duration}>{product.productDuration} min</Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const getTypeColor = (type: ProductType): string => {
    const colors = {
      tours: '#3B82F6',
      lessons: '#10B981',
      rentals: '#F59E0B',
      tickets: '#EF4444',
    };
    return colors[type];
  };

  const renderTypeFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
        onPress={() => setSelectedType('all')}>
        <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      {(['tours', 'lessons', 'rentals', 'tickets'] as ProductType[]).map((type) => (
        <TouchableOpacity
          key={type}
          style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
          onPress={() => setSelectedType(type)}>
          <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>
            {PRODUCT_TYPE_LABELS[type]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#64748B"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Type Filters */}
        {renderTypeFilter()}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </Text>
          {searchTerm && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Text style={styles.clearSearch}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Products List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>
              {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new products'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 12,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: 'rgba(28, 40, 58, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  clearSearch: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productImage: {
    width: '100%',
    height: 120,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    marginBottom: 8,
  },
  productName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productDescription: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
  },
  duration: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
