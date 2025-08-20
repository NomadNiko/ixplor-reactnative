import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import BottomTabs from '../components/BottomTabs';

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

const TicketCard = ({ title, subtitle, date, time, ticketId, quantity, price, status }: TicketCardProps) => {
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
  const user = {
    name: 'Nomad Niko',
    email: 'nomad.niko.inc@gmail.com',
    profileImage: 'https://via.placeholder.com/150',
  };

  const tickets = [
    {
      title: 'Nightly Beach Walk',
      subtitle: 'Thursdays',
      date: '12 Mar \'25',
      time: '16:20 (1h)',
      ticketId: 'cbf83cac',
      quantity: 1,
      price: '$69.00',
      status: 'ACTIVE' as const,
    },
    {
      title: 'Nightly Beach Walk',
      subtitle: 'Thursdays',
      date: '19 Mar \'25',
      time: '16:20 (1h)',
      ticketId: 'df92ab21',
      quantity: 2,
      price: '$138.00',
      status: 'UPCOMING' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1C283A', '#151D2B']}
          style={styles.profileCard}
        >
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Tickets</Text>
          {tickets.map((ticket, index) => (
            <TicketCard key={index} {...ticket} />
          ))}
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
    borderColor: '#3B82F6',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
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
    color: '#F8FAFC',
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  statusBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
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
    color: '#3B82F6',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
});