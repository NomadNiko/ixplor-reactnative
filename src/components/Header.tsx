import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/lib/auth/context';

type HeaderProps = {
  showCart?: boolean;
  onMenuPress?: () => void;
};

export default function Header({ showCart = true, onMenuPress }: HeaderProps) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={28} color="#F8FAFC" />
      </TouchableOpacity>

      <Text style={styles.logo}>iXplor</Text>

      <View style={styles.rightSection}>
        {showCart && (
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart-outline" size={28} color="#F8FAFC" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.profileButton}>
          <Image 
            source={{ uri: user?.photo?.path || 'https://via.placeholder.com/40' }} 
            style={styles.profileImage} 
            onError={() => console.log('Header profile image failed to load')}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#1C283A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  menuButton: {
    padding: 4,
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F8FAFC',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Iceland_400Regular',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartButton: {
    padding: 4,
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
});
