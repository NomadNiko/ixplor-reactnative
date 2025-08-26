import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '~/lib/api/cart';
import { FontFamilies } from '~/src/styles/fonts';

interface CheckoutSummaryProps {
  items: CartItem[];
  total: number;
}

export default function CheckoutSummary({ items, total }: CheckoutSummaryProps) {
  const subtotal = total;
  const tax = 0; // Could calculate tax if needed
  const fees = 0; // No additional fees
  const finalTotal = subtotal + tax + fees;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>

      {/* Items List */}
      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <LinearGradient
            key={`${item.productItemId}-${index}`}
            colors={['rgba(28, 40, 58, 0.4)', 'rgba(21, 29, 43, 0.4)']}
            style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>

            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                <Text style={styles.detailText}>{formatDate(item.productDate)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={14} color="#94A3B8" />
                <Text style={styles.detailText}>{formatTime(item.productStartTime)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="hourglass-outline" size={14} color="#94A3B8" />
                <Text style={styles.detailText}>{formatDuration(item.productDuration)}</Text>
              </View>
            </View>

            <View style={styles.itemFooter}>
              <Text style={styles.quantityText}>
                Qty: {item.quantity} × ${item.price.toFixed(2)}
              </Text>
            </View>
          </LinearGradient>
        ))}
      </View>

      {/* Summary Totals */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>

        {tax > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>
        )}

        {fees > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fees</Text>
            <Text style={styles.summaryValue}>${fees.toFixed(2)}</Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Items Count */}
      <Text style={styles.itemCount}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    marginBottom: 16,
  },
  itemsList: {
    marginBottom: 16,
  },
  itemCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamilies.primaryMedium,
    color: '#E0FCFF',
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#60A5FA',
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    marginLeft: 4,
  },
  itemFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  quantityText: {
    fontSize: 12,
    fontFamily: FontFamilies.primary,
    color: '#64748B',
  },
  summarySection: {
    backgroundColor: 'rgba(28, 40, 58, 0.3)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: FontFamilies.primaryMedium,
    color: '#E0FCFF',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FontFamilies.primaryBold,
    color: '#60A5FA',
  },
  itemCount: {
    fontSize: 12,
    fontFamily: FontFamilies.primary,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});
