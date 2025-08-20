import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Icon } from '@roninoss/icons';
import { useAuth } from '~/lib/auth/context';
import { router } from 'expo-router';
import { Sheet } from '~/components/nativewindui/Sheet';

interface HamburgerMenuProps {
  onPress: () => void;
}

export const HamburgerMenuButton: React.FC<HamburgerMenuProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mr-4 p-2"
      accessibilityLabel="Menu"
    >
      <Icon name="menu" size={24} className="text-foreground" />
    </TouchableOpacity>
  );
};

interface MenuSheetProps {
  sheetRef: React.RefObject<any>;
}

export const MenuSheet: React.FC<MenuSheetProps> = ({ sheetRef }) => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      sheetRef.current?.dismiss();
      router.replace('/auth/login');
    } catch {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleLogin = () => {
    sheetRef.current?.dismiss();
    router.push('/auth/login');
  };

  const handleSignup = () => {
    sheetRef.current?.dismiss();
    router.push('/auth/signup');
  };

  const handleHome = () => {
    sheetRef.current?.dismiss();
    router.push('/(tabs)');
  };

  const menuItems = isAuthenticated
    ? [
        { title: 'Home', onPress: handleHome, icon: 'home' },
        { title: 'Sign Out', onPress: handleLogout, icon: 'log-out' },
      ]
    : [
        { title: 'Home', onPress: handleHome, icon: 'home' },
        { title: 'Login', onPress: handleLogin, icon: 'log-in' },
        { title: 'Sign Up', onPress: handleSignup, icon: 'user-plus' },
      ];

  return (
    <Sheet ref={sheetRef} snapPoints={[300]}>
      <View className="flex-1 p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Menu
          </Text>
          {isAuthenticated && user && (
            <Text className="text-muted-foreground">
              Welcome, {user.email}
            </Text>
          )}
        </View>

        <View className="space-y-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className="flex-row items-center py-3 px-2 rounded-lg bg-card"
            >
              <Icon name={item.icon} size={20} className="text-foreground mr-3" />
              <Text className="text-foreground text-lg font-medium">
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Sheet>
  );
};