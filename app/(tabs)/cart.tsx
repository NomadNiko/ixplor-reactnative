import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '~/src/components/Header';
import { useCart } from '~/hooks/useCart';
import CartItem from '~/src/components/cart/CartItem';
import EmptyCart from '~/src/components/cart/EmptyCart';
import { FontFamilies } from '~/src/styles/fonts';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const router = useRouter();
  const { cart, isLoading, clearCart, cartTotal, itemCount } = useCart();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showCart={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={false} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isEmpty ? (
          <EmptyCart onContinueShopping={() => router.push('/(tabs)/discover')} />
        ) : (
          <>
            <Text style={styles.title}>Shopping Cart</Text>
            <View style={styles.headerRow}>
              <Text style={styles.itemCount}>{itemCount} items</Text>
              <Text style={styles.totalAmount}>${cartTotal.toFixed(2)}</Text>
            </View>
            
            <View style={styles.itemsContainer}>
              {cart.items.map((item, index) => (
                <CartItem key={item.productItemId} item={item} />
              ))}
            </View>

            <TouchableOpacity onPress={() => clearCart()} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamilies.primaryBold,
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemCount: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
  },
  itemsContainer: {
    gap: 12,
  },
  clearButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primaryMedium,
    color: '#EF4444',
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#3B82F6',
    textAlign: 'right',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  checkoutButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});