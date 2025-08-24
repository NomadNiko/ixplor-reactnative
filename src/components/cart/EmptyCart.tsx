import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontFamilies } from '~/src/styles/fonts';

interface EmptyCartProps {
  onContinueShopping: () => void;
}

export default function EmptyCart({ onContinueShopping }: EmptyCartProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="cart-outline" size={120} color="#475569" />
      <Text style={styles.title}>Your cart is empty</Text>
      <Text style={styles.subtitle}>Add items to get started</Text>

      <TouchableOpacity onPress={onContinueShopping} style={styles.button}>
        <Text style={styles.buttonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#60A5FA',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
  },
});
