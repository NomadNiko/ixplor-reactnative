import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, Text, Platform, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import { useAuth } from '~/lib/auth/context';
import { useColorScheme } from '~/lib/useColorScheme';
import { MenuSheet } from '~/components/HamburgerMenu';
import { useSheetRef } from '~/components/nativewindui/Sheet';
import * as Location from 'expo-location';
import { vendorsApi, Vendor, getVendorDisplayName, getVendorLocation } from '~/lib/api/vendors';
import Header from '~/src/components/Header';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const menuSheetRef = useSheetRef();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

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

        // Load nearby vendors
        await loadNearbyVendors(location.coords.latitude, location.coords.longitude);
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

  const loadNearbyVendors = async (lat: number, lng: number) => {
    try {
      setIsLoadingVendors(true);
      console.log('Home - Loading nearby vendors for location:', { lat, lng });

      // Use client-side filtering approach (same as frontend)
      const response = await vendorsApi.getNearbyVendors(lat, lng, 10000); // 10km radius

      console.log('Home - Nearby vendors loaded:', {
        nearbyCount: response.data?.length || 0,
        sample: response.data?.slice(0, 3).map((v) => ({
          id: v._id?.substring(0, 8),
          name: getVendorDisplayName(v),
          location: getVendorLocation(v),
        })),
      });

      // Vendors are already filtered and sorted by the API
      setVendors(response.data || []);
    } catch (error) {
      console.error('Home - Failed to load nearby vendors:', error);
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
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
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ color: '#94A3B8', marginTop: 16 }}>Getting your location...</Text>
          </View>
        ) : (
          <MapView
            style={{ flex: 1 }}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            customMapStyle={isDarkColorScheme ? darkMapStyle : []}
            initialRegion={getInitialRegion()}
            showsUserLocation={true}
            showsMyLocationButton={true}
            rotateEnabled={true}
            pitchEnabled={true}>
            {vendors
              .map((vendor) => {
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
                    title={getVendorDisplayName(vendor)}
                    description={vendor.description || 'No description'}
                    pinColor="#3B82F6"
                  />
                );
              })
              .filter(Boolean)}
          </MapView>
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
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={{ color: '#F8FAFC', marginLeft: 8 }}>Loading nearby vendors...</Text>
          </View>
        )}
      </View>

      <MenuSheet sheetRef={menuSheetRef} />
    </SafeAreaView>
  );
}
