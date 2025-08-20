import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

type TabProps = {
  name: string;
  icon: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
  iconLibrary?: 'ionicons' | 'material-community';
};

const Tab = ({ name, icon, label, isActive, onPress, iconLibrary = 'ionicons' }: TabProps) => {
  const IconComponent = iconLibrary === 'material-community' ? MaterialCommunityIcons : Ionicons;

  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <IconComponent name={icon as any} size={24} color={isActive ? '#3B82F6' : '#6B7280'} />
      <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
};

type BottomTabsProps = {
  navigation: any;
};

export default function BottomTabs({ navigation }: BottomTabsProps) {
  const route = useRoute();
  const currentRoute = route.name;

  const tabs = [
    {
      name: 'index',
      route: '/(tabs)',
      icon: 'home-outline',
      label: 'Home',
      iconLibrary: 'ionicons' as const,
    },
    {
      name: 'dashboard',
      route: '/(tabs)/dashboard',
      icon: 'person-outline',
      label: 'Dashboard',
      iconLibrary: 'ionicons' as const,
    },
    {
      name: 'two',
      route: '/(tabs)/two',
      icon: 'search-outline',
      label: 'Discover',
      iconLibrary: 'ionicons' as const,
    },
    {
      name: 'tickets',
      route: '/tickets',
      icon: 'ticket-outline',
      label: 'Tickets',
      iconLibrary: 'ionicons' as const,
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Tab
          key={tab.name}
          name={tab.name}
          icon={tab.icon}
          label={tab.label}
          isActive={currentRoute === tab.name || (tab.name === 'index' && currentRoute === 'Home')}
          iconLibrary={tab.iconLibrary}
          onPress={() => {
            if (tab.route.startsWith('/(tabs)')) {
              navigation.navigate(tab.name);
            } else {
              navigation.navigate(tab.route);
            }
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#1C283A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#6B7280',
  },
  activeTabLabel: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});
