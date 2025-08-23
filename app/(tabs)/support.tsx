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
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '~/src/components/Header';
import { useAuth } from '~/lib/auth/context';
import { supportTicketsApi } from '~/lib/api/support-tickets';
import TicketDetailModal from '~/src/components/TicketDetailModal';
import {
  SupportTicket,
  CreateSupportTicketDto,
  SupportTicketCategory,
  SupportTicketStatus,
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_CATEGORY_LABELS,
  SUPPORT_TICKET_STATUS_COLORS,
  SUPPORT_TICKET_STATUS_PRIORITY,
} from '~/lib/types/support-ticket';
import { Picker } from '@react-native-picker/picker';
import { FontFamilies } from '~/src/styles/fonts';

type SupportTicketCardProps = {
  ticket: SupportTicket;
  onPress: () => void;
};

const SupportTicketCard = ({ ticket, onPress }: SupportTicketCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.ticketCard}>
      <LinearGradient
        colors={['rgba(28, 40, 58, 0.8)', 'rgba(21, 29, 43, 0.8)']}
        style={styles.cardGradient}>
        <View style={styles.cardHeader}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketId}>{ticket.ticketId}</Text>
            <Text style={styles.ticketDate}>{formatDate(ticket.createDate)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[ticket.status] },
            ]}>
            <Text style={styles.statusText}>{SUPPORT_TICKET_STATUS_LABELS[ticket.status]}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.ticketTitle} numberOfLines={2}>
            {ticket.ticketTitle}
          </Text>
          <Text style={styles.ticketDescription} numberOfLines={3}>
            {ticket.ticketDescription}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {SUPPORT_TICKET_CATEGORY_LABELS[ticket.ticketCategory] || ticket.ticketCategory}
            </Text>
          </View>
          {ticket.updates && ticket.updates.length > 0 && (
            <Text style={styles.updatesCount}>
              {ticket.updates.length} {ticket.updates.length === 1 ? 'update' : 'updates'}
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const CreateTicketModal = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupportTicketDto) => Promise<void>;
  isSubmitting: boolean;
}) => {
  const [category, setCategory] = useState<SupportTicketCategory>(SupportTicketCategory.TECHNICAL);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    await onSubmit({
      ticketCategory: category,
      ticketTitle: title.trim(),
      ticketDescription: description.trim(),
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory(SupportTicketCategory.TECHNICAL);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Support Ticket</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={[styles.modalSubmitText, isSubmitting && styles.modalSubmitTextDisabled]}>
              {isSubmitting ? 'Creating...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
                itemStyle={{ color: '#F8FAFC' }}>
                {Object.values(SupportTicketCategory).map((cat) => (
                  <Picker.Item
                    key={cat}
                    label={SUPPORT_TICKET_CATEGORY_LABELS[cat]}
                    value={cat}
                    color="#F8FAFC"
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of your issue"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide detailed information about your issue..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={6}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSupportTickets();
    }
  }, [user?.id]);

  const loadSupportTickets = async (isRefresh = false) => {
    if (!user?.id) {
      console.log('Support - No user ID found for loading tickets');
      setIsLoading(false);
      return;
    }

    try {
      if (!isRefresh) {
        console.log('Support - Loading all support tickets for user:', user.id);
        setIsLoading(true);
      }

      const response = await supportTicketsApi.getUserSupportTickets();

      console.log('Support - All support tickets loaded:', {
        totalTickets: response.data?.length || 0,
        statusBreakdown: response.data?.reduce(
          (acc, ticket) => {
            acc[ticket.status] = (acc[ticket.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      });

      // Sort by status priority then by date (most recent first)
      const sortedTickets = (response.data || []).sort((a, b) => {
        const statusA = SUPPORT_TICKET_STATUS_PRIORITY[a.status] || 999;
        const statusB = SUPPORT_TICKET_STATUS_PRIORITY[b.status] || 999;

        if (statusA !== statusB) {
          return statusA - statusB;
        }

        return new Date(b.createDate).getTime() - new Date(a.createDate).getTime();
      });

      setTickets(sortedTickets);
    } catch (error) {
      console.error('Support - Failed to load support tickets:', error);
      Alert.alert('Error', 'Failed to load support tickets. Please try again.');
      setTickets([]);
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSupportTickets(true);
  };

  const handleCreateTicket = async (ticketData: CreateSupportTicketDto) => {
    try {
      setIsCreatingTicket(true);

      // Add the createdBy field with the user's ID
      const ticketDataWithUser = {
        ...ticketData,
        createdBy: user?.id,
      };

      const response = await supportTicketsApi.createSupportTicket(ticketDataWithUser);

      console.log('Support - Support ticket created:', response.data.ticketId);

      Alert.alert(
        'Ticket Created',
        `Your support ticket ${response.data.ticketId} has been created successfully.`,
        [{ text: 'OK', onPress: () => setShowCreateModal(false) }]
      );

      // Reload tickets to show the new one
      loadSupportTickets();
    } catch (error) {
      console.error('Support - Failed to create support ticket:', error);
      Alert.alert('Error', 'Failed to create support ticket. Please try again.');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const showTicketDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedTicket(null);
  };

  const handleTicketUpdate = (updatedTicket?: SupportTicket) => {
    if (updatedTicket) {
      // Update the ticket in the local state immediately
      setTickets((prevTickets) =>
        prevTickets.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );

      // Also update the selected ticket if it's the same one
      if (selectedTicket?._id === updatedTicket._id) {
        setSelectedTicket(updatedTicket);
      }
    }

    // Also reload tickets from server to ensure consistency
    loadSupportTickets();
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {};
    tickets.forEach((ticket) => {
      counts[ticket.status] = (counts[ticket.status] || 0) + 1;
    });
    return counts;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={true} />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Support Tickets</Text>
          <Text style={styles.subtitle}>Get help with your Ixplor experience</Text>
        </View>

        {/* Create Ticket Button */}
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.createButtonGradient}>
            <Text style={styles.createButtonText}>Create New Ticket</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Status Summary */}
        {!isLoading && tickets.length > 0 && (
          <View style={styles.summaryContainer}>
            <LinearGradient
              colors={['rgba(28, 40, 58, 0.6)', 'rgba(21, 29, 43, 0.6)']}
              style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                {Object.entries(getStatusCounts()).map(([status, count]) => (
                  <View key={status} style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{count}</Text>
                    <Text style={styles.summaryLabel}>
                      {SUPPORT_TICKET_STATUS_LABELS[status as SupportTicketStatus]}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Tickets List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading support tickets...</Text>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No support tickets found</Text>
            <Text style={styles.emptySubtext}>
              {'Create a ticket above if you need help with anything'}
            </Text>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {tickets.map((ticket) => (
              <SupportTicketCard
                key={ticket._id}
                ticket={ticket}
                onPress={() => showTicketDetails(ticket)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateTicketModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTicket}
        isSubmitting={isCreatingTicket}
      />

      <TicketDetailModal
        visible={showDetailModal}
        ticket={selectedTicket}
        onClose={handleDetailModalClose}
        onUpdate={handleTicketUpdate}
      />
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
    fontFamily: FontFamilies.primaryBold,
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  createButton: {
    marginBottom: 24,
  },
  createButtonGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
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
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: FontFamilies.primaryBold,
    color: '#F8FAFC',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: FontFamilies.primary,
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
    fontFamily: FontFamilies.primary,
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
    fontFamily: FontFamilies.primarySemiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FontFamilies.primary,
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
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
  ticketInfo: {
    flex: 1,
  },
  ticketId: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#3B82F6',
    marginBottom: 2,
  },
  ticketDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#F8FAFC',
    marginBottom: 8,
    lineHeight: 20,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 18,
    fontFamily: FontFamilies.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 10,
    fontFamily: FontFamilies.primaryMedium,
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  updatesCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#F8FAFC',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  modalSubmitText: {
    fontSize: 16,
    color: '#3B82F6',
    fontFamily: FontFamilies.primarySemiBold,
  },
  modalSubmitTextDisabled: {
    color: '#64748B',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#F8FAFC',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  picker: {
    color: '#F8FAFC',
    height: 50,
    width: '100%',
  },
  textInput: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 8,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontFamily: FontFamilies.primary,
  },
  textAreaInput: {
    height: 120,
    textAlignVertical: 'top',
  },
});
