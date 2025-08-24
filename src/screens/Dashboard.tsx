import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';
import { useAuth } from '~/lib/auth/context';
import { ticketsApi, Ticket } from '~/lib/api/tickets';

type TicketCardProps = {
  title: string;
  subtitle: string;
  date: string;
  time: string;
  ticketId: string;
  quantity: number;
  price: string;
  status: 'ACTIVE' | 'UPCOMING';
};

const TicketCard = ({
  title,
  subtitle,
  date,
  time,
  ticketId,
  quantity,
  price,
  status,
}: TicketCardProps) => {
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketTitle}>{title}</Text>
          <Text style={styles.ticketSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.ticketDetails}>
        <View style={styles.ticketDetailRow}>
          <Text style={styles.ticketIcon}>📅</Text>
          <Text style={styles.ticketDetailText}>{date}</Text>
        </View>
        <View style={styles.ticketDetailRow}>
          <Text style={styles.ticketIcon}>⏰</Text>
          <Text style={styles.ticketDetailText}>{time}</Text>
        </View>
        <View style={styles.ticketDetailRow}>
          <Text style={styles.ticketIcon}>#</Text>
          <Text style={styles.ticketDetailText}>ID: {ticketId}</Text>
        </View>
      </View>

      <View style={styles.ticketFooter}>
        <Text style={styles.quantityText}>Qty: {quantity}</Text>
        <Text style={styles.priceText}>{price}</Text>
      </View>
    </View>
  );
};

export default function Dashboard({ navigation }: any) {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserTickets = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await ticketsApi.getUserTickets(user.id);
        setTickets(response.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load tickets');
        console.error('Failed to load tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserTickets();
  }, [user?.id]);

  const formatTicketForDisplay = (ticket: Ticket) => ({
    title: ticket.product?.name || 'Unknown Product',
    subtitle: ticket.vendor?.name || 'Unknown Vendor',
    date: new Date(ticket.purchaseDate).toLocaleDateString(),
    time: ticket.expiryDate ? new Date(ticket.expiryDate).toLocaleTimeString() : 'No expiry',
    ticketId: ticket.id.substring(0, 8),
    quantity: ticket.quantity,
    price: `$${ticket.totalPrice.toFixed(2)}`,
    status: ticket.status,
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.errorText}>Please log in to view your dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1C283A', '#151D2B']} style={styles.profileCard}>
          <Image
            source={{ uri: user.photo || 'https://via.placeholder.com/150' }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Tickets</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text style={styles.loadingText}>Loading tickets...</Text>
            </View>
          ) : tickets.length > 0 ? (
            tickets.map((ticket, index) => (
              <TicketCard key={ticket.id} {...formatTicketForDisplay(ticket)} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tickets found</Text>
              <Text style={styles.emptySubtext}>
                Purchase tickets from vendors to see them here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTabs navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E0FCFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#60A5FA',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ADF7FF',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E0FCFF',
    marginBottom: 16,
  },
  ticketCard: {
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
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0FCFF',
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  statusBadge: {
    backgroundColor: '#60A5FA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#ADF7FF',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDetails: {
    marginBottom: 12,
  },
  ticketDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketIcon: {
    width: 20,
    marginRight: 8,
    fontSize: 14,
  },
  ticketDetailText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  quantityText: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 18,
    color: '#60A5FA',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#E0FCFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E0FCFF',
  },
});
