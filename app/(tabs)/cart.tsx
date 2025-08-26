import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Header from '~/src/components/Header';
import { useCart } from '~/hooks/useCart';
import CartItem from '~/src/components/cart/CartItem';
import { FontFamilies } from '~/src/styles/fonts';

export default function Cart() {
  const router = useRouter();
  const { cart, itemCount } = useCart();

  const handleCheckout = () => {
    if (cart?.items && cart.items.length > 0) {
      router.push('/checkout');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />

      <View style={styles.content}>
        {/* Shopping Cart Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cart</Text>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
          </Text>
          <Text style={styles.cartTotal}>
            $
            {(cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0).toFixed(
              2
            )}
          </Text>
        </View>

        {/* Products List */}
        <FlatList
          data={[...(cart?.items || []).map((item) => ({ ...item, isCartItem: true }))]}
          renderItem={({ item }) => {
            return <CartItem key={item.productItemId} item={item} />;
          }}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Gradient Fade Behind Checkout Button */}
      <LinearGradient
        colors={['transparent', 'rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, .8)']}
        style={styles.fadeGradient}
        pointerEvents="none"
      />

      {/* Checkout Button */}
      {cart?.items && cart.items.length > 0 && (
        <View style={styles.checkoutContainer}>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>
              Checkout - $
              {(
                cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0
              ).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#E0FCFF',
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#60a5fa',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#E0FCFF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  confirmButtonText: {
    color: '#ADF7FF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    color: '#E0FCFF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  cartTotal: {
    color: '#60a5fa',
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
    fontFamily: FontFamilies.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#E0FCFF',
    fontSize: 20,
    fontFamily: FontFamilies.primarySemiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  checkoutButton: {
    backgroundColor: '#60a5fa',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
    textAlign: 'center',
  },
});
