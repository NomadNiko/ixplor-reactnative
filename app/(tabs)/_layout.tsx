import React from 'react';
import { Tabs } from 'expo-router';
import { TabBarIcon } from '../../components/TabBarIcon';
import { MenuSheet } from '../../components/HamburgerMenu';
import { useSheetRef } from '../../components/nativewindui/Sheet';

export default function TabLayout() {
  const menuSheetRef = useSheetRef();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#64748B',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1C283A',
            borderTopColor: '#334155',
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
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
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} family="FontAwesome5" />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} family="FontAwesome6" />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} family="FontAwesome5" />,
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: 'Tickets',
            tabBarIcon: ({ color }) => <TabBarIcon name="tag" color={color} family="FontAwesome5" />,
          }}
        />
        <Tabs.Screen
          name="receipts"
          options={{
            title: 'Receipts',
            tabBarIcon: ({ color }) => <TabBarIcon name="receipt" color={color} family="FontAwesome5" />,
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: 'Support',
            tabBarIcon: ({ color }) => <TabBarIcon name="headset" color={color} family="FontAwesome5" />,
          }}
        />
      </Tabs>
      <MenuSheet sheetRef={menuSheetRef} />
    </>
  );
}
