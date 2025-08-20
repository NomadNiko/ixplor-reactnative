import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '~/src/components/Header';
import { useAuth } from '~/lib/auth/context';
import { invoicesApi, Invoice, formatInvoiceAmount, getInvoiceTotalItems, formatInvoiceDate } from '~/lib/api/invoices';

type ReceiptCardProps = {
  invoice: Invoice;
  onPress: () => void;
};

const ReceiptCard = ({ invoice, onPress }: ReceiptCardProps) => {
  const totalItems = getInvoiceTotalItems(invoice);
  const vendorCount = invoice.vendorGroups?.length || 0;

  return (
    <TouchableOpacity onPress={onPress} style={styles.receiptCard}>
      <LinearGradient
        colors={['rgba(28, 40, 58, 0.8)', 'rgba(21, 29, 43, 0.8)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptId}>#{invoice._id.substring(0, 8)}</Text>
            <Text style={styles.receiptDate}>
              {formatInvoiceDate(invoice.invoiceDate)}
            </Text>
          </View>
          <Text style={styles.receiptAmount}>
            {formatInvoiceAmount(invoice.amount)}
          </Text>
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.receiptDescription}>
            {vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'} • {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Text>
          
          <View style={styles.vendorsList}>
            {invoice.vendorGroups?.slice(0, 2).map((group, index) => (
              <Text key={group.vendorId} style={styles.vendorName}>
                {group.vendorName}
                {index < Math.min(invoice.vendorGroups.length - 1, 1) && ', '}
              </Text>
            ))}
            {vendorCount > 2 && (
              <Text style={styles.moreVendors}>+{vendorCount - 2} more</Text>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={styles.statusText}>{invoice.status}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
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

export default function Receipts() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAllInvoices();
    }
  }, [user?.id]);

  const loadAllInvoices = async (isRefresh = false) => {
    if (!user?.id) {
      console.log('Receipts - No user ID found for loading invoices');
      setIsLoading(false);
      return;
    }

    try {
      if (!isRefresh) {
        console.log('Receipts - Loading all invoices for user:', user.id);
        setIsLoading(true);
      }

      const response = await invoicesApi.getUserInvoices(user.id);
      
      console.log('Receipts - All invoices loaded:', {
        totalInvoices: response.data?.length || 0,
        totalAmount: response.data?.reduce((sum, inv) => sum + inv.amount, 0) || 0
      });
      
      // Sort by date (most recent first)
      const sortedInvoices = (response.data || []).sort((a, b) => 
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );
      
      setInvoices(sortedInvoices);
      
    } catch (error) {
      console.error('Receipts - Failed to load invoices:', error);
      Alert.alert('Error', 'Failed to load receipts. Please try again.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllInvoices(true);
  };

  const showReceiptDetails = (invoice: Invoice) => {
    const vendorDetails = invoice.vendorGroups
      ?.map(group => `${group.vendorName}: $${group.subtotal.toFixed(2)}`)
      .join('\n') || 'No vendor details';

    Alert.alert(
      `Receipt #${invoice._id.substring(0, 8)}`,
      `Date: ${formatInvoiceDate(invoice.invoiceDate)}\n` +
      `Total: ${formatInvoiceAmount(invoice.amount)}\n` +
      `Status: ${invoice.status}\n` +
      `Type: ${invoice.type}\n\n` +
      `Vendors:\n${vendorDetails}`,
      [
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const getTotalSpent = (): number => {
    return invoices.reduce((sum, inv) => sum + inv.amount, 0);
  };

  const getThisMonthSpent = (): number => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    return invoices
      .filter(inv => new Date(inv.invoiceDate) >= thisMonth)
      .reduce((sum, inv) => sum + inv.amount, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>All Receipts</Text>
          <Text style={styles.subtitle}>Your purchase history</Text>
        </View>

        {/* Summary Stats */}
        {!isLoading && invoices.length > 0 && (
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={['rgba(28, 40, 58, 0.6)', 'rgba(21, 29, 43, 0.6)']}
              style={styles.summaryCard}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Receipts</Text>
                  <Text style={styles.summaryValue}>{invoices.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Spent</Text>
                  <Text style={styles.summaryValue}>
                    ${getTotalSpent().toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>This Month</Text>
                  <Text style={styles.summaryValue}>
                    ${getThisMonthSpent().toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Average Order</Text>
                  <Text style={styles.summaryValue}>
                    ${invoices.length > 0 ? (getTotalSpent() / invoices.length).toFixed(2) : '0.00'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Receipts List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading receipts...</Text>
          </View>
        ) : invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No receipts found</Text>
            <Text style={styles.emptySubtext}>
              Your purchase receipts will appear here after you make purchases
            </Text>
          </View>
        ) : (
          <View style={styles.receiptsList}>
            {invoices.map((invoice) => (
              <ReceiptCard
                key={invoice._id}
                invoice={invoice}
                onPress={() => showReceiptDetails(invoice)}
              />
            ))}
          </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  receiptsList: {
    gap: 12,
  },
  receiptCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  receiptDate: {
    fontSize: 14,
    color: '#94A3B8',
  },
  receiptAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  cardBody: {
    marginBottom: 12,
  },
  receiptDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  vendorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vendorName: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  moreVendors: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});