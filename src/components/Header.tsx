import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/lib/auth/context';
import { FontFamilies } from '~/src/styles/fonts';
import { useCart } from '~/hooks/useCart';
import { useRouter } from 'expo-router';

type HeaderProps = {
  showCart?: boolean;
  onMenuPress?: () => void;
};

export default function Header({ showCart = true, onMenuPress }: HeaderProps) {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const handleCartPress = () => {
    router.push('/(tabs)/cart');
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.backgroundExtension} />
      <View style={styles.container}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={28} color="#E0FCFF" />
      </TouchableOpacity>

      <Text style={styles.logo}>iXplor</Text>

      <View style={styles.rightSection}>
        {showCart && (
          <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
            <Ionicons name="cart-outline" size={28} color="#E0FCFF" />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount}</Text>
              </View>
            )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginTop: -20,
  },
  backgroundExtension: {
    position: 'absolute',
    top: -150,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: '#1C283A',
  },
  container: {
    height: 60,
    backgroundColor: '#1C283A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 1,
  },
  menuButton: {
    padding: 4,
  },
  logo: {
    fontSize: 24,
    color: '#E0FCFF',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: FontFamilies.logo,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ADF7FF',
    fontSize: 12,
    fontFamily: FontFamilies.primaryBold,
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
});
