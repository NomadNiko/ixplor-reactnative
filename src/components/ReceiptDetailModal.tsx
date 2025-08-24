import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontFamilies } from '~/src/styles/fonts';
import {
  Invoice,
  VendorGroup,
  InvoiceItem,
  formatInvoiceAmount,
  formatInvoiceDate,
  getInvoiceTotalItems,
} from '~/lib/api/invoices';

interface ReceiptDetailModalProps {
  visible: boolean;
  invoice: Invoice | null;
  onClose: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  visible,
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  const formatTime = (time: string): string => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number): string => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatProductDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const totalItems = getInvoiceTotalItems(invoice);
  const vendorCount = invoice.vendorGroups?.length || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Details</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Receipt Info Card */}
          <LinearGradient
            colors={['rgba(28, 40, 58, 0.8)', 'rgba(21, 29, 43, 0.8)']}
            style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View>
                <Text style={styles.receiptId}>#{invoice._id.substring(0, 8).toUpperCase()}</Text>
                <Text style={styles.receiptDate}>{formatInvoiceDate(invoice.invoiceDate)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(invoice.status) },
                ]}>
                <Text style={styles.statusText}>{invoice.status}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Total Amount */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>{formatInvoiceAmount(invoice.amount)}</Text>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="business-outline" size={16} color="#64748B" />
                <Text style={styles.summaryText}>
                  {vendorCount} {vendorCount === 1 ? 'Vendor' : 'Vendors'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="cart-outline" size={16} color="#64748B" />
                <Text style={styles.summaryText}>
                  {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                </Text>
              </View>
            </View>

            {/* Transaction Info */}
            {invoice.stripeCheckoutSessionId && (
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionLabel}>Transaction ID</Text>
                <Text style={styles.transactionId}>
                  {invoice.stripeCheckoutSessionId.substring(0, 20)}...
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Vendor Groups */}
          <View style={styles.vendorSection}>
            <Text style={styles.sectionTitle}>Purchase Details</Text>

            {invoice.vendorGroups?.map((group: VendorGroup, groupIndex: number) => (
              <View key={group.vendorId} style={styles.vendorCard}>
                <View style={styles.vendorHeader}>
                  <Text style={styles.vendorName}>{group.vendorName}</Text>
                  <Text style={styles.vendorSubtotal}>
                    ${(group.subtotal / 100).toFixed(2)}
                  </Text>
                </View>

                {group.items?.map((item: InvoiceItem, itemIndex: number) => (
                  <View
                    key={item.productItemId}
                    style={[
                      styles.itemCard,
                      itemIndex === group.items.length - 1 && styles.lastItem,
                    ]}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemPrice}>
                        ${(item.price / 100).toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.itemDetails}>
                      <View style={styles.itemDetailRow}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text style={styles.itemDetailText}>
                          {formatProductDate(item.productDate)}
                        </Text>
                      </View>

                      {item.productStartTime && (
                        <View style={styles.itemDetailRow}>
                          <Ionicons name="time-outline" size={14} color="#64748B" />
                          <Text style={styles.itemDetailText}>
                            {formatTime(item.productStartTime)}
                          </Text>
                        </View>
                      )}

                      {item.productDuration > 0 && (
                        <View style={styles.itemDetailRow}>
                          <Ionicons name="hourglass-outline" size={14} color="#64748B" />
                          <Text style={styles.itemDetailText}>
                            {formatDuration(item.productDuration)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.itemDetailRow}>
                        <Ionicons name="layers-outline" size={14} color="#64748B" />
                        <Text style={styles.itemDetailText}>
                          Qty: {item.quantity}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Customer Info */}
          {invoice.customerName && (
            <View style={styles.customerSection}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <LinearGradient
                colors={['rgba(28, 40, 58, 0.4)', 'rgba(21, 29, 43, 0.4)']}
                style={styles.customerCard}>
                <View style={styles.customerRow}>
                  <Text style={styles.customerLabel}>Name</Text>
                  <Text style={styles.customerValue}>{invoice.customerName}</Text>
                </View>
                {invoice.customerId && (
                  <View style={styles.customerRow}>
                    <Text style={styles.customerLabel}>Customer ID</Text>
                    <Text style={styles.customerValue}>
                      {invoice.customerId.substring(0, 12)}...
                    </Text>
                  </View>
                )}
                <View style={styles.customerRow}>
                  <Text style={styles.customerLabel}>Type</Text>
                  <Text style={styles.customerValue}>{invoice.type || 'Standard'}</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient colors={['#60A5FA', '#2563EB']} style={styles.buttonGradient}>
                <Ionicons name="download-outline" size={20} color="#ADF7FF" />
                <Text style={styles.buttonText}>Download Receipt</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
                <Ionicons name="share-outline" size={20} color="#ADF7FF" />
                <Text style={styles.buttonText}>Share Receipt</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    fontSize: 16,
    color: '#60A5FA',
    fontFamily: FontFamilies.primarySemiBold,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  receiptId: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#60A5FA',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  totalSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontFamily: FontFamilies.primaryBold,
    color: '#10B981',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontFamily: FontFamilies.primaryMedium,
  },
  transactionInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 13,
    color: '#CBD5E1',
    fontFamily: FontFamilies.primary,
  },
  vendorSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 16,
  },
  vendorCard: {
    backgroundColor: 'rgba(28, 40, 58, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
  },
  vendorSubtotal: {
    fontSize: 16,
    fontFamily: FontFamilies.primaryBold,
    color: '#10B981',
  },
  itemCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  lastItem: {
    marginBottom: 0,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontFamily: FontFamilies.primaryMedium,
    color: '#E2E8F0',
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#60A5FA',
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDetailText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  customerSection: {
    marginBottom: 20,
  },
  customerCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  customerLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  customerValue: {
    fontSize: 13,
    color: '#E2E8F0',
    fontFamily: FontFamilies.primaryMedium,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
  },
  buttonGradient: {
    flexDirection: 'row',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ADF7FF',
    fontSize: 15,
    fontFamily: FontFamilies.primarySemiBold,
  },
});

export default ReceiptDetailModal;