import React, { useEffect, useState, useRef, memo, useCallback, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import { useAuth } from '~/lib/auth/context';
import { useColorScheme } from '~/lib/useColorScheme';
import { MenuSheet } from '~/components/HamburgerMenu';
import { useSheetRef } from '~/components/nativewindui/Sheet';
import * as Location from 'expo-location';
import { vendorsApi, Vendor, getVendorDisplayName, getVendorLocation } from '~/lib/api/vendors';
import { productsApi } from '~/lib/api/products';
import { ProductItem } from '~/lib/types/product';
import Header from '~/src/components/Header';
import NearbyActivitiesSheet from '~/src/components/NearbyActivitiesSheet';
import VendorCardModal from '~/src/components/VendorCardModal';
import { Ionicons } from '@expo/vector-icons';
import { imageCache } from '~/src/lib/services/imageCache';
import { FontFamilies } from '~/src/styles/fonts';

// Memoized Vendor Marker Component
interface VendorMarkerProps {
  vendor: Vendor;
  onPress: (vendor: Vendor) => void;
}

const VendorMarker = memo<VendorMarkerProps>(
  ({ vendor, onPress }) => {
    const location = getVendorLocation(vendor);

    // Skip vendor if coordinates are invalid
    if (
      !location.lat ||
      !location.lng ||
      isNaN(location.lat) ||
      isNaN(location.lng) ||
      Math.abs(location.lat) > 90 ||
      Math.abs(location.lng) > 180
    ) {
      console.warn('Skipping vendor with invalid coordinates:', {
        id: vendor._id?.substring(0, 8),
        name: getVendorDisplayName(vendor),
        coordinates: [location.lng, location.lat],
      });
      return null;
    }

    return (
      <Marker
        key={vendor._id}
        coordinate={{
          latitude: location.lat,
          longitude: location.lng,
        }}
        onPress={() => onPress(vendor)}
        zIndex={1000}>
        <View
          style={{
            backgroundColor: '#374151',
            padding: 4,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
          <Ionicons name="storefront-outline" size={25} color="#ADF7FF" />
        </View>
      </Marker>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if vendor ID or coordinates changed
    const prevLocation = getVendorLocation(prevProps.vendor);
    const nextLocation = getVendorLocation(nextProps.vendor);

    return (
      prevProps.vendor._id === nextProps.vendor._id &&
      prevLocation.lat === nextLocation.lat &&
      prevLocation.lng === nextLocation.lng
    );
  }
);

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const menuSheetRef = useSheetRef();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activities, setActivities] = useState<ProductItem[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorCard, setShowVendorCard] = useState(false);
  const mapRef = useRef<MapView>(null);
  const regionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vendorAbortControllerRef = useRef<AbortController | null>(null);
  const activitiesAbortControllerRef = useRef<AbortController | null>(null);
  const lastRegionRef = useRef<Region | null>(null);

  useEffect(() => {
    const getLocationPermission = async () => {
      try {
        console.log('Checking location permissions...');

        // First check if we already have permission
        let { status } = await Location.getForegroundPermissionsAsync();
        console.log('Current permission status:', status);

        if (status !== 'granted') {
          console.log('Requesting location permission...');
          // Request permission if we don't have it
          const permissionResponse = await Location.requestForegroundPermissionsAsync();
          status = permissionResponse.status;
          console.log('Permission request result:', status);
        }

        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Location access is needed to show nearby vendors. Please enable location permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => console.log('Open settings') },
            ]
          );
          setIsLoadingLocation(false);
          return;
        }

        console.log('Getting current location...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log('Location obtained:', location.coords);
        setUserLocation(location);

        // Load nearby vendors and activities with shared controller
        const initialController = new AbortController();
        await Promise.all([
          loadNearbyVendors(
            location.coords.latitude,
            location.coords.longitude,
            initialController.signal
          ),
          loadNearbyActivities(
            location.coords.latitude,
            location.coords.longitude,
            10,
            initialController.signal
          ),
        ]);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Location Error', 'Failed to get your location: ' + (error as Error).message);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      getLocationPermission();
    }
  }, [isAuthenticated, isLoading]);

  const loadNearbyVendors = async (lat: number, lng: number, abortSignal?: AbortSignal) => {
    try {
      // Cancel any existing vendor request
      if (vendorAbortControllerRef.current) {
        vendorAbortControllerRef.current.abort();
      }

      // Create new abort controller if not provided
      const controller = abortSignal ? null : new AbortController();
      if (controller) {
        vendorAbortControllerRef.current = controller;
      }

      setIsLoadingVendors(true);
      console.log('Home - Loading nearby vendors for location:', { lat, lng });

      // Check if request was aborted before making API call
      const signal = abortSignal || controller?.signal;
      if (signal?.aborted) {
        return;
      }

      // Use client-side filtering approach (same as frontend)
      const response = await vendorsApi.getNearbyVendors(lat, lng, 10000); // 10km radius

      // Check if request was aborted after API call
      if (signal?.aborted) {
        return;
      }

      console.log('Home - Nearby vendors loaded:', {
        nearbyCount: response.data?.length || 0,
        sample: response.data?.slice(0, 3).map((v) => ({
          id: v._id?.substring(0, 8),
          name: getVendorDisplayName(v),
          location: getVendorLocation(v),
        })),
      });

      // Vendors are already filtered and sorted by the API
      // Only update state if request wasn't aborted
      if (!signal?.aborted) {
        setVendors(response.data || []);
      }
    } catch (error) {
      // Only log error and update state if not aborted
      if (!abortSignal?.aborted && error.name !== 'AbortError') {
        console.error('Home - Failed to load nearby vendors:', error);
        setVendors([]);
      }
    } finally {
      // Only update loading state if not aborted
      if (!abortSignal?.aborted) {
        setIsLoadingVendors(false);
      }
    }
  };

  // Calculate search radius based on map zoom level (using latitudeDelta)
  const calculateSearchRadius = (region: Region): number => {
    // Convert latitude delta to approximate miles
    // 1 degree latitude ≈ 69 miles
    const latDeltaInMiles = region.latitudeDelta * 69;

    // Use a radius that's proportional to the visible area
    // Minimum 5 miles, maximum 50 miles
    const radius = Math.min(50, Math.max(5, latDeltaInMiles * 0.5));

    return Math.round(radius);
  };

  const loadNearbyActivities = async (
    lat: number,
    lng: number,
    radius?: number,
    abortSignal?: AbortSignal
  ) => {
    try {
      // Cancel any existing activities request
      if (activitiesAbortControllerRef.current) {
        activitiesAbortControllerRef.current.abort();
      }

      // Create new abort controller if not provided
      const controller = abortSignal ? null : new AbortController();
      if (controller) {
        activitiesAbortControllerRef.current = controller;
      }

      setIsLoadingActivities(true);

      // Check if request was aborted before making API call
      const signal = abortSignal || controller?.signal;
      if (signal?.aborted) {
        return;
      }

      // Use provided radius or default to 10 miles
      const searchRadius = radius || 10;

      console.log('Home - Loading nearby activities:', {
        lat,
        lng,
        radius: searchRadius,
      });

      const response = await productsApi.getNearbyActivitiesForToday(lat, lng, searchRadius);

      // Check if request was aborted after API call
      if (signal?.aborted) {
        return;
      }

      console.log('Home - Nearby activities loaded:', {
        nearbyCount: response.data?.length || 0,
        radius: searchRadius,
        sample: response.data?.slice(0, 3).map((item) => ({
          id: item._id?.substring(0, 8),
          name: item.templateName,
          date: item.productDate,
          startTime: item.startTime,
          location: [item.longitude, item.latitude],
        })),
      });

      const activities = response.data || [];

      // Only update state and preload images if request wasn't aborted
      if (!signal?.aborted) {
        setActivities(activities);

        // Preload activity images for better UX (with throttling)
        if (activities.length > 0) {
          // Throttle image preloading to prevent memory pressure
          const throttledActivities = activities.slice(0, 10); // Only preload first 10
          imageCache.preloadProductImages(throttledActivities);
        }
      }
    } catch (error) {
      // Only log error and update state if not aborted
      if (!abortSignal?.aborted && error.name !== 'AbortError') {
        console.error('Home - Failed to load nearby activities:', error);
        setActivities([]);
      }
    } finally {
      // Only update loading state if not aborted
      if (!abortSignal?.aborted) {
        setIsLoadingActivities(false);
      }
    }
  };

  const handleActivityPress = (activity: ProductItem) => {
    console.log('Activity pressed:', activity.templateName);
    // TODO: Navigate to activity detail or open modal
    Alert.alert(
      activity.templateName,
      `${activity.description}\n\nDate: ${activity.productDate}\nTime: ${activity.startTime}\nPrice: $${activity.price}`
    );
  };

  const handleVendorPress = useCallback(
    (vendor: Vendor) => {
      console.log('Vendor pressed:', getVendorDisplayName(vendor));
      // Clear previous vendor first if switching between vendors
      if (selectedVendor && selectedVendor._id !== vendor._id) {
        setShowVendorCard(false);
        setSelectedVendor(null);
        // Small delay to allow modal to close and clear state
        setTimeout(() => {
          setSelectedVendor(vendor);
          setShowVendorCard(true);
        }, 100);
      } else {
        setSelectedVendor(vendor);
        setShowVendorCard(true);
      }
    },
    [selectedVendor]
  );

  const handleCloseVendorCard = useCallback(() => {
    setShowVendorCard(false);
    setSelectedVendor(null); // Clear vendor IMMEDIATELY - no delay
  }, []);

  const recenterOnCurrentLocation = useCallback(async () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  }, [userLocation]);

  // Memoize user location object for activities sheet to prevent unnecessary re-renders
  const memoizedUserLocation = useMemo(() => {
    return userLocation
      ? {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        }
      : null;
  }, [userLocation?.coords.latitude, userLocation?.coords.longitude]);

  // Check if region change is significant enough to warrant new API calls
  const isSignificantRegionChange = (newRegion: Region, lastRegion: Region | null): boolean => {
    if (!lastRegion) return true;

    // Calculate distance moved (in degrees)
    const latDiff = Math.abs(newRegion.latitude - lastRegion.latitude);
    const lngDiff = Math.abs(newRegion.longitude - lastRegion.longitude);
    const deltaDiff = Math.abs(newRegion.latitudeDelta - lastRegion.latitudeDelta);

    // Only trigger API calls if moved significantly or zoom changed significantly
    const MOVEMENT_THRESHOLD = 0.01; // ~1km
    const ZOOM_THRESHOLD = 0.005;

    return (
      latDiff > MOVEMENT_THRESHOLD || lngDiff > MOVEMENT_THRESHOLD || deltaDiff > ZOOM_THRESHOLD
    );
  };

  // Handle map region changes with debouncing and request deduplication
  const handleRegionChangeComplete = (region: Region) => {
    console.log('Map region changed:', {
      lat: region.latitude.toFixed(4),
      lng: region.longitude.toFixed(4),
      latDelta: region.latitudeDelta.toFixed(4),
      lngDelta: region.longitudeDelta.toFixed(4),
    });

    setCurrentRegion(region);

    // Clear existing timeout
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
      regionChangeTimeoutRef.current = null;
    }

    // Cancel any pending API requests
    if (vendorAbortControllerRef.current) {
      vendorAbortControllerRef.current.abort();
      vendorAbortControllerRef.current = null;
    }
    if (activitiesAbortControllerRef.current) {
      activitiesAbortControllerRef.current.abort();
      activitiesAbortControllerRef.current = null;
    }

    // Only make API calls if the region change is significant
    if (!isSignificantRegionChange(region, lastRegionRef.current)) {
      console.log('Region change not significant, skipping API calls');
      return;
    }

    lastRegionRef.current = region;

    // Set new timeout with increased delay to prevent excessive API calls
    regionChangeTimeoutRef.current = setTimeout(() => {
      const radius = calculateSearchRadius(region);
      console.log('Reloading data with new region, radius:', radius);

      // Create shared abort controller for both API calls
      const sharedController = new AbortController();

      // Load both vendors and activities with shared abort signal
      Promise.all([
        loadNearbyVendors(region.latitude, region.longitude, sharedController.signal),
        loadNearbyActivities(region.latitude, region.longitude, radius, sharedController.signal),
      ]).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Home - Failed to reload region data:', error);
        }
      });
    }, 2000); // Increased to 2 second delay for better debouncing
  };

  // Dark style for the map
  const darkMapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ color: '#1d2951' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8ec3b9' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1a3646' }],
    },
    {
      featureType: 'administrative.country',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#4b6878' }],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#64779e' }],
    },
    {
      featureType: 'administrative.province',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#4b6878' }],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#334e87' }],
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry',
      stylers: [{ color: '#023e58' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#283d6a' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6f9ba5' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1d2951' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ color: '#023e58' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#3C7680' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#304a7d' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#98a5be' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1d2951' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#2c6675' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#255763' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#b0d5ce' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#023e58' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#98a5be' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1d2951' }],
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry.fill',
      stylers: [{ color: '#283d6a' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [{ color: '#3a4762' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0e1626' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#4e6d70' }],
    },
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      // Clear timeout
      if (regionChangeTimeoutRef.current) {
        clearTimeout(regionChangeTimeoutRef.current);
        regionChangeTimeoutRef.current = null;
      }

      // Cancel any pending requests
      if (vendorAbortControllerRef.current) {
        vendorAbortControllerRef.current.abort();
        vendorAbortControllerRef.current = null;
      }
      if (activitiesAbortControllerRef.current) {
        activitiesAbortControllerRef.current.abort();
        activitiesAbortControllerRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          {/* You can add a loading spinner here */}
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getInitialRegion = (): Region => {
    if (userLocation) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    // Default to San Francisco
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Header showCart={true} onMenuPress={() => menuSheetRef.current?.present()} />

      <View style={{ flex: 1, position: 'relative' }}>
        {isLoadingLocation ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#0F172A',
            }}>
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text style={{ color: '#94A3B8', marginTop: 16, fontFamily: FontFamilies.primary }}>
              Getting your location...
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
              customMapStyle={isDarkColorScheme ? darkMapStyle : []}
              initialRegion={getInitialRegion()}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation={true}
              showsMyLocationButton={true}
              rotateEnabled={true}
              pitchEnabled={true}>
              {vendors.map((vendor) => (
                <VendorMarker key={vendor._id} vendor={vendor} onPress={handleVendorPress} />
              ))}
            </MapView>

            {/* Recenter Button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                backgroundColor: '#374151',
                padding: 12,
                borderRadius: 50,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              onPress={recenterOnCurrentLocation}>
              <Ionicons name="locate" size={24} color="#ADF7FF" />
            </TouchableOpacity>
          </View>
        )}

        {isLoadingVendors && (
          <View
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              backgroundColor: 'rgba(28, 40, 58, 0.9)',
              padding: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <ActivityIndicator size="small" color="#60A5FA" />
            <Text style={{ color: '#E0FCFF', marginLeft: 8, fontFamily: FontFamilies.primary }}>
              Loading nearby vendors...
            </Text>
          </View>
        )}

        {/* Nearby Activities Sheet */}
        <NearbyActivitiesSheet
          activities={activities}
          isLoading={isLoadingActivities}
          userLocation={memoizedUserLocation}
          onActivityPress={handleActivityPress}
        />
      </View>

      <MenuSheet sheetRef={menuSheetRef} />

      {/* Vendor Card Modal */}
      <VendorCardModal
        visible={showVendorCard && selectedVendor !== null}
        vendor={selectedVendor}
        onClose={handleCloseVendorCard}
      />
    </SafeAreaView>
  );
}
