import React from 'react';
import { Tabs } from 'expo-router';
import { TabBarIcon } from '../../components/TabBarIcon';
import { MenuSheet } from '../../components/HamburgerMenu';
import { useSheetRef } from '../../components/nativewindui/Sheet';
import { useAuth } from '../../lib/auth/context';

export default function TabLayout() {
  const menuSheetRef = useSheetRef();
  const { isVendor } = useAuth();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#60A5FA',
          tabBarInactiveTintColor: '#64748B',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1C283A',
            borderTopColor: '#334155',
            borderTopWidth: 1,
            height: 90,
            paddingBottom: 25,
            paddingTop: 12,
          },
          tabBarIconStyle: {
            overflow: 'visible',
            width: 50,
            height: 50,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarShowLabel: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="home" color={color} family="FontAwesome5" />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="passport" color={color} family="FontAwesome5" />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="shopping-cart" color={color} family="FontAwesome5" />
            ),
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: 'Tickets',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="tag" color={color} family="FontAwesome5" />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="user-secret" color={color} family="FontAwesome" />
            ),
          }}
        />
        <Tabs.Screen
          name="receipts"
          options={{
            title: 'Receipts',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="receipt" color={color} family="FontAwesome5" />
            ),
            href: null,
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: 'Support',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="headset" color={color} family="FontAwesome5" />
            ),
            href: null,
          }}
        />
        <Tabs.Screen
          name="vendor-status"
          options={{
            title: 'Vendor',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="store" color={color} family="FontAwesome5" />
            ),
            href: isVendor ? undefined : null,
          }}
        />
      </Tabs>
      <MenuSheet sheetRef={menuSheetRef} />
    </>
  );
}
