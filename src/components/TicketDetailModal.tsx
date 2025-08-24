import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '~/lib/auth/context';
import { supportTicketsApi } from '~/lib/api/support-tickets';
import { FontFamilies } from '~/src/styles/fonts';
import {
  SupportTicket,
  SupportTicketStatus,
  SUPPORT_TICKET_STATUS_LABELS,
  SUPPORT_TICKET_CATEGORY_LABELS,
  SUPPORT_TICKET_STATUS_COLORS,
  AddTicketUpdateDto,
} from '~/lib/types/support-ticket';

interface TicketDetailModalProps {
  visible: boolean;
  ticket: SupportTicket | null;
  onClose: () => void;
  onUpdate: (updatedTicket?: SupportTicket) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  visible,
  ticket,
  onClose,
  onUpdate,
}) => {
  const { user } = useAuth();
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(ticket);

  React.useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket]);

  if (!currentTicket) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddUpdate = async () => {
    if (!updateText.trim()) return;

    try {
      setIsSubmitting(true);

      const updateData: AddTicketUpdateDto = {
        updateText: updateText.trim(),
        userId: user?.id,
      };

      const response = await supportTicketsApi.addTicketUpdate(currentTicket._id, updateData);

      // Update local state with the new ticket data immediately
      setCurrentTicket(response.data);

      // Clear form and hide
      setUpdateText('');
      setShowUpdateForm(false);

      // Notify parent with updated ticket
      onUpdate(response.data);
    } catch (error) {
      console.error('Failed to add update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      setIsResolving(true);
      const response = await supportTicketsApi.updateTicketStatus(
        currentTicket._id,
        SupportTicketStatus.RESOLVED
      );

      // Update local state with the new ticket data immediately
      setCurrentTicket(response.data);

      // Notify parent with updated ticket
      onUpdate(response.data);
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const sortedUpdates = [...(currentTicket.updates || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket Details</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Ticket Info Card */}
            <LinearGradient
              colors={['rgba(28, 40, 58, 0.8)', 'rgba(21, 29, 43, 0.8)']}
              style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View>
                  <Text style={styles.ticketId}>#{currentTicket.ticketId}</Text>
                  <Text style={styles.ticketDate}>{formatDate(currentTicket.createDate)}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[currentTicket.status] },
                  ]}>
                  <Text style={styles.statusText}>
                    {SUPPORT_TICKET_STATUS_LABELS[currentTicket.status]}
                  </Text>
                </View>
              </View>

              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {SUPPORT_TICKET_CATEGORY_LABELS[currentTicket.ticketCategory] ||
                    currentTicket.ticketCategory}
                </Text>
              </View>

              <Text style={styles.ticketTitle}>{currentTicket.ticketTitle}</Text>
              <Text style={styles.ticketDescription}>{currentTicket.ticketDescription}</Text>

              {currentTicket.assignedTo && (
                <View style={styles.assignedInfo}>
                  <Text style={styles.assignedLabel}>Assigned to:</Text>
                  <Text style={styles.assignedValue}>{currentTicket.assignedTo}</Text>
                </View>
              )}
            </LinearGradient>

            {/* Action Buttons */}
            {currentTicket.status !== SupportTicketStatus.CLOSED && (
              <View style={styles.actionButtons}>
                {currentTicket.status !== SupportTicketStatus.RESOLVED && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={handleResolve}
                    disabled={isResolving}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.buttonGradient}>
                      {isResolving ? (
                        <ActivityIndicator color="#ADF7FF" />
                      ) : (
                        <Text style={styles.buttonText}>Mark as Resolved</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {!showUpdateForm && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowUpdateForm(true)}>
                    <LinearGradient colors={['#60A5FA', '#2563EB']} style={styles.buttonGradient}>
                      <Text style={styles.buttonText}>Add Update</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Update Form */}
            {showUpdateForm && (
              <View style={styles.updateForm}>
                <Text style={styles.updateFormTitle}>Add Update</Text>
                <TextInput
                  style={styles.updateInput}
                  value={updateText}
                  onChangeText={setUpdateText}
                  placeholder="Enter your update..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.updateFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowUpdateForm(false);
                      setUpdateText('');
                    }}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddUpdate}
                    disabled={isSubmitting || !updateText.trim()}>
                    <LinearGradient
                      colors={['#60A5FA', '#2563EB']}
                      style={styles.submitButtonGradient}>
                      {isSubmitting ? (
                        <ActivityIndicator color="#ADF7FF" size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>Submit</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Updates Section */}
            <View style={styles.updatesSection}>
              <Text style={styles.sectionTitle}>Updates ({sortedUpdates.length})</Text>

              {sortedUpdates.length === 0 ? (
                <Text style={styles.noUpdates}>No updates yet</Text>
              ) : (
                sortedUpdates.map((update, index) => (
                  <View key={index} style={styles.updateCard}>
                    <Text style={styles.updateText}>{update.updateText}</Text>
                    <View style={styles.updateMeta}>
                      <Text style={styles.updateUser}>User ID: {update.userId}</Text>
                      <Text style={styles.updateDate}>{formatDate(update.timestamp)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
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
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#60A5FA',
    marginBottom: 4,
  },
  ticketDate: {
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
    color: '#E0FCFF',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#60A5FA',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    textTransform: 'uppercase',
  },
  ticketTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 12,
  },
  ticketDescription: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
    fontFamily: FontFamilies.primary,
  },
  assignedInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  assignedLabel: {
    fontSize: 12,
    color: '#E0FCFF',
    marginBottom: 4,
    fontFamily: FontFamilies.primary,
  },
  assignedValue: {
    fontSize: 14,
    color: '#E0FCFF',
    fontFamily: FontFamilies.primaryMedium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  resolveButton: {
    flex: 1,
  },
  buttonGradient: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ADF7FF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  updateForm: {
    backgroundColor: 'rgba(28, 40, 58, 0.4)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  updateFormTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    marginBottom: 12,
  },
  updateInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 8,
    padding: 12,
    color: '#E0FCFF',
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  updateFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: FontFamilies.primaryMedium,
  },
  submitButton: {
    minWidth: 100,
  },
  submitButtonGradient: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ADF7FF',
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
  },
  updatesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 16,
  },
  noUpdates: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    fontFamily: FontFamilies.primary,
  },
  updateCard: {
    backgroundColor: 'rgba(28, 40, 58, 0.4)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  updateText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: FontFamilies.primary,
  },
  updateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateUser: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: FontFamilies.primary,
  },
  updateDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: FontFamilies.primary,
  },
});

export default TicketDetailModal;
