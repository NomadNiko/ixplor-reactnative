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
import Header from '~/src/components/Header';
import { useAuth } from '~/lib/auth/context';
import { ticketsApi, Ticket } from '~/lib/api/tickets';
import TicketCardModal from '~/src/components/TicketCardModal';
import {
  sortTicketsByStatusAndDate,
  getTicketStatusColor,
  formatTicketDate,
  formatTicketPrice,
  getStatusBreakdown,
} from '~/lib/utils/ticketUtils';

type TicketListItemProps = {
  ticket: Ticket;
  onPress: () => void;
};

const TicketListItem = ({ ticket, onPress }: TicketListItemProps) => {
  const statusColor = getTicketStatusColor(ticket.status);

  return (
    <TouchableOpacity style={styles.ticketItem} onPress={onPress}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle}>
          {ticket.productName || ticket.product?.name || 'Unknown Product'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{ticket.status}</Text>
        </View>
      </View>

      {ticket.vendorName && <Text style={styles.vendorText}>by {ticket.vendorName}</Text>}

      <View style={styles.ticketDetails}>
        <Text style={styles.detailText}>📅 {formatTicketDate(ticket)}</Text>
        <Text style={styles.detailText}>Qty: {ticket.quantity}</Text>
        <Text style={styles.priceText}>{formatTicketPrice(ticket)}</Text>
      </View>

      {ticket.expiryDate && (
        <Text style={styles.expiryText}>
          Expires: {new Date(ticket.expiryDate).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default function Tickets() {
  const { user } = useAuth();
  const [sortedTickets, setSortedTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const loadUserTickets = async (isRefresh = false) => {
    if (!user?.id) {
      console.log('Tickets screen - No user ID found for loading tickets');
      if (!isRefresh) setIsLoading(false);
      return;
    }

    console.log('Tickets screen - Loading ALL tickets for user:', user.id, isRefresh ? '(refreshing)' : '');

    try {
      if (!isRefresh) setIsLoading(true);
      const response = await ticketsApi.getUserTickets(user.id);
      console.log('Tickets screen - API response:', {
        totalTickets: response.data?.length || 0,
        statusBreakdown: getStatusBreakdown(response.data || []),
      });

      const allTickets = response.data || [];

      // Sort tickets by status priority (ACTIVE -> REDEEMED -> CANCELLED/EXPIRED) then by date
      const sorted = sortTicketsByStatusAndDate(allTickets);
      setSortedTickets(sorted);

      console.log('Tickets screen - Sorted and set:', {
        totalSorted: sorted.length,
        first3: sorted.slice(0, 3).map((t) => ({
          id: t._id?.substring(0, 8),
          status: t.status,
          product: t.productName,
          date: t.productDate || t.createdAt,
        })),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load tickets');
      console.error('Tickets screen - Failed to load tickets:', error);
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadUserTickets();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserTickets(true);
  };

  const handleTicketPress = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleCloseModal = () => {
    setShowTicketModal(false);
    setSelectedTicket(null);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showCart={true} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to view your tickets</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />

      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>All Tickets</Text>
        <Text style={styles.pageSubtitle}>
          {sortedTickets.length} ticket{sortedTickets.length !== 1 ? 's' : ''} sorted by status &
          date
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading all your tickets...</Text>
        </View>
      ) : sortedTickets.length > 0 ? (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          {sortedTickets.map((ticket) => (
            <TicketListItem
              key={ticket.id || ticket._id}
              ticket={ticket}
              onPress={() => handleTicketPress(ticket)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No Tickets Yet</Text>
          <Text style={styles.emptySubtitle}>Purchase tickets from vendors to see them here</Text>
        </View>
      )}

      <TicketCardModal
        visible={showTicketModal}
        ticket={selectedTicket}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerSection: {
    padding: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ticketItem: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  vendorText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
    marginTop: -4,
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  expiryText: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#F8FAFC',
    textAlign: 'center',
  },
});
