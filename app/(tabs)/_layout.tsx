import React from 'react';
import { Tabs } from 'expo-router';
import { TabBarIcon } from '../../components/TabBarIcon';
import { HamburgerMenuButton, MenuSheet } from '../../components/HamburgerMenu';
import { useSheetRef } from '../../components/nativewindui/Sheet';

export default function TabLayout() {
  const menuSheetRef = useSheetRef();

  const openMenu = () => {
    menuSheetRef.current?.present();
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          headerStyle: {
            backgroundColor: '#F2F2F7',
          },
          headerTintColor: '#000',
          tabBarStyle: {
            backgroundColor: '#F2F2F7',
            borderTopColor: '#C6C6C8',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
            headerLeft: () => <HamburgerMenuButton onPress={openMenu} />,
            headerShown: false, // We'll handle the header in the screen itself
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
            headerLeft: () => <HamburgerMenuButton onPress={openMenu} />,
          }}
        />
      </Tabs>
      <MenuSheet sheetRef={menuSheetRef} />
    </>
  );
}
