import React, { useEffect } from 'react';
import { View, SafeAreaView, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAuth } from '~/lib/auth/context';
import { useColorScheme } from '~/lib/useColorScheme';
import { HamburgerMenuButton, MenuSheet } from '~/components/HamburgerMenu';
import { useSheetRef } from '~/components/nativewindui/Sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const menuSheetRef = useSheetRef();

  const openMenu = () => {
    menuSheetRef.current?.present();
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

  return (
    <>
      <View className="flex-1">
        {/* Custom Header */}
        <View 
          style={{ paddingTop: insets.top }}
          className="bg-background border-b border-border"
        >
          <View className="flex-row items-center justify-between px-4 py-3">
            <HamburgerMenuButton onPress={openMenu} />
            <Text className="text-lg font-semibold text-foreground">
              Explore
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <MapView
          style={{ flex: 1 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          customMapStyle={isDarkColorScheme ? darkMapStyle : []}
          initialRegion={{
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          rotateEnabled={true}
          pitchEnabled={true}
        />
      </View>
      <MenuSheet sheetRef={menuSheetRef} />
    </>
  );
}