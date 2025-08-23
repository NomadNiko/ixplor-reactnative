import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductItem } from '~/lib/types/product';
import ProductCard from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { FontFamilies } from '~/src/styles/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const DOCKED_HEIGHT = 60; // Just the handle bar visible
const THIRD_HEIGHT = screenHeight * 0.33; // 1/3 of screen
const MID_HEIGHT = screenHeight * 0.5; // Half screen
const FULL_HEIGHT = screenHeight * 0.85; // Nearly full screen (leaving room for header)
const HANDLE_HEIGHT = 30;

// Snap positions enum
enum SnapPosition {
  DOCKED = 'docked',
  THIRD = 'third',
  MID = 'mid',
  FULL = 'full',
}

interface NearbyActivitiesSheetProps {
  activities: ProductItem[];
  isLoading: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  onActivityPress: (activity: ProductItem) => void;
}

export const NearbyActivitiesSheet: React.FC<NearbyActivitiesSheetProps> = ({
  activities,
  isLoading,
  userLocation,
  onActivityPress,
}) => {
  const [currentPosition, setCurrentPosition] = useState<SnapPosition>(SnapPosition.DOCKED);
  const animatedHeight = useRef(new Animated.Value(DOCKED_HEIGHT)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);
  
  // Helper function to get height for position
  const getHeightForPosition = (position: SnapPosition): number => {
    switch (position) {
      case SnapPosition.DOCKED:
        return DOCKED_HEIGHT;
      case SnapPosition.THIRD:
        return THIRD_HEIGHT;
      case SnapPosition.MID:
        return MID_HEIGHT;
      case SnapPosition.FULL:
        return FULL_HEIGHT;
      default:
        return DOCKED_HEIGHT;
    }
  };
  
  // Helper function to get next position when tapping
  const getNextPosition = (current: SnapPosition): SnapPosition => {
    switch (current) {
      case SnapPosition.DOCKED:
        return SnapPosition.THIRD;
      case SnapPosition.THIRD:
        return SnapPosition.MID;
      case SnapPosition.MID:
        return SnapPosition.FULL;
      case SnapPosition.FULL:
        return SnapPosition.DOCKED;
      default:
        return SnapPosition.THIRD;
    }
  };
  
  // Find closest snap point
  const findClosestSnapPoint = (height: number): SnapPosition => {
    const distances = [
      { position: SnapPosition.DOCKED, distance: Math.abs(height - DOCKED_HEIGHT) },
      { position: SnapPosition.THIRD, distance: Math.abs(height - THIRD_HEIGHT) },
      { position: SnapPosition.MID, distance: Math.abs(height - MID_HEIGHT) },
      { position: SnapPosition.FULL, distance: Math.abs(height - FULL_HEIGHT) },
    ];
    
    distances.sort((a, b) => a.distance - b.distance);
    return distances[0].position;
  };

  // Memoized distance calculation with cache
  const distanceCache = useRef(new Map<string, number>());
  
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const cacheKey = `${lat1.toFixed(4)},${lon1.toFixed(4)},${lat2.toFixed(4)},${lon2.toFixed(4)}`;
    
    if (distanceCache.current.has(cacheKey)) {
      return distanceCache.current.get(cacheKey)!;
    }
    
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
    const distance = R * c;
    
    // Cache with size limit
    if (distanceCache.current.size > 200) {
      const firstKey = distanceCache.current.keys().next().value;
      distanceCache.current.delete(firstKey);
    }
    distanceCache.current.set(cacheKey, distance);
    
    return distance;
  }, []);

  // Filter activities based on selected day
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  // Memoize filtered and sorted activities to prevent recalculation on every render
  const sortedActivities = useMemo(() => {
    const filtered = activities.filter(activity => {
      if (!activity.productDate) return false;
      const activityDate = activity.productDate.split('T')[0];
      const targetDate = selectedDay === 'today' ? getTodayString() : getTomorrowString();
      return activityDate === targetDate;
    });

    if (!userLocation) return filtered;

    return filtered.sort((a, b) => {
      const distA = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        a.latitude,
        a.longitude
      );
      const distB = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });
  }, [activities, selectedDay, userLocation, calculateDistance]);

  const snapToPosition = useCallback((position: SnapPosition) => {
    const toValue = getHeightForPosition(position);
    setCurrentPosition(position);

    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    // Reset scroll position when going to docked
    if (position === SnapPosition.DOCKED && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const toggleNext = useCallback(() => {
    const nextPosition = getNextPosition(currentPosition);
    snapToPosition(nextPosition);
  }, [currentPosition, snapToPosition]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      const currentHeight = getHeightForPosition(currentPosition);
      const newHeight = currentHeight - gestureState.dy;

      // Constrain the height between docked and full
      const constrainedHeight = Math.max(DOCKED_HEIGHT, Math.min(FULL_HEIGHT, newHeight));

      animatedHeight.setValue(constrainedHeight);
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentHeight = getHeightForPosition(currentPosition);
      const projectedHeight = currentHeight - gestureState.dy;
      const velocity = gestureState.vy;
      
      // Calculate final height considering velocity
      const finalHeight = projectedHeight - velocity * 100;
      
      // Find closest snap point
      const closestPosition = findClosestSnapPoint(finalHeight);
      
      // Snap to the closest position
      snapToPosition(closestPosition);
    },
  });

  // Always show the sheet, even when empty or loading

  return (
    <Animated.View style={[styles.container, { height: animatedHeight }]}>
      <LinearGradient
        colors={['rgba(28, 40, 58, 1)', 'rgba(21, 29, 43, 1)']}
        style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <TouchableOpacity style={styles.handleButton} onPress={toggleNext}>
            <View style={styles.handle} />
            {currentPosition === SnapPosition.DOCKED ? (
              <Text style={styles.dockedText}>
                {sortedActivities.length > 0 
                  ? `${sortedActivities.length} Nearby Activities` 
                  : 'Nearby Activities'}
              </Text>
            ) : (
              <Text style={styles.handleIcon}>
                {currentPosition === SnapPosition.FULL ? '⌄' : '⌃'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Header - Only show when not docked */}
        {currentPosition !== SnapPosition.DOCKED && (
          <View style={styles.header}>
            <Text style={styles.title}>Nearby Activities</Text>
            <Text style={styles.subtitle}>
              {sortedActivities.length} {sortedActivities.length === 1 ? 'activity' : 'activities'}{' '}
              found
            </Text>
            
            {/* Day Toggle Buttons */}
            <View style={styles.dayToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.dayToggleButton,
                  selectedDay === 'today' && styles.dayToggleButtonActive
                ]}
                onPress={() => {
                  if (selectedDay !== 'today') {
                    setSelectedDay('today');
                  }
                }}>
                <Text style={[
                  styles.dayToggleText,
                  selectedDay === 'today' && styles.dayToggleTextActive
                ]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dayToggleButton,
                  selectedDay === 'tomorrow' && styles.dayToggleButtonActive
                ]}
                onPress={() => {
                  if (selectedDay !== 'tomorrow') {
                    setSelectedDay('tomorrow');
                  }
                }}>
                <Text style={[
                  styles.dayToggleText,
                  selectedDay === 'tomorrow' && styles.dayToggleTextActive
                ]}>
                  Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content - Hide when docked */}
        {currentPosition !== SnapPosition.DOCKED && (
          <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Finding nearby activities...</Text>
            </View>
          ) : sortedActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activities found nearby</Text>
              <Text style={styles.emptySubtext}>Try checking back later</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              scrollEnabled={currentPosition === SnapPosition.MID || currentPosition === SnapPosition.FULL}>
              {sortedActivities.map((activity, index) => {
                const distance = userLocation
                  ? calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      activity.latitude,
                      activity.longitude
                    )
                  : 0;

                // Show different number of items based on position
                if (currentPosition === SnapPosition.DOCKED) return null;
                if (currentPosition === SnapPosition.THIRD && index > 1) return null;

                return (
                  <ProductCard
                    key={activity._id}
                    product={activity}
                    distance={distance}
                    onPress={() => {
                      // Prevent modal state race conditions
                      if (!isModalTransitioning && !showProductDetail) {
                        setIsModalTransitioning(true);
                        setSelectedProduct(activity);
                        setShowProductDetail(true);
                        // Reset transitioning state after a brief delay
                        setTimeout(() => setIsModalTransitioning(false), 300);
                      }
                    }}
                  />
                );
              })}
            </ScrollView>
          )}
          </View>
        )}
      </LinearGradient>
      
      <ProductDetailModal
        visible={showProductDetail}
        product={selectedProduct}
        onClose={() => {
          if (!isModalTransitioning) {
            setShowProductDetail(false);
            setSelectedProduct(null);
          }
        }}
        onAddToCart={(product) => {
          Alert.alert('Added to Cart', `${product.templateName} has been added to your cart.`);
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000, // Higher z-index to ensure it's above the map
    elevation: 10, // For Android shadow
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  handleContainer: {
    height: HANDLE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: 8,
  },
  handleIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: FontFamilies.primarySemiBold,
  },
  dockedText: {
    fontSize: 14,
    color: '#F8FAFC',
    fontFamily: FontFamilies.primarySemiBold,
    marginLeft: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamilies.primaryBold,
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
    fontFamily: FontFamilies.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: FontFamilies.primary,
  },
  dayToggleContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 2,
  },
  dayToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  dayToggleButtonActive: {
    backgroundColor: '#3B82F6',
  },
  dayToggleText: {
    fontSize: 14,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#94A3B8',
  },
  dayToggleTextActive: {
    color: '#FFFFFF',
  },
});

export default NearbyActivitiesSheet;
