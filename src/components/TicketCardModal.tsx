import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Ticket } from '~/lib/api/tickets';
import { getTicketStatusColor, formatTicketPrice } from '~/lib/utils/ticketUtils';
import { FontFamilies } from '~/src/styles/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.8;

interface TicketCardModalProps {
  visible: boolean;
  ticket: Ticket | null;
  onClose: () => void;
}

export const TicketCardModal: React.FC<TicketCardModalProps> = ({ visible, ticket, onClose }) => {
  if (!ticket) return null;

  const statusColor = getTicketStatusColor(ticket.status);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Create redemption URL for QR code
  const redemptionUrl = `https://ixplor.app/ticket-validation?ticketId=${ticket._id}`;
  const qrValue = ticket.qrCode || redemptionUrl;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.blurContainer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['rgba(28, 40, 58, 0.98)', 'rgba(21, 29, 43, 0.98)']}
              style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.productName}>{ticket.productName}</Text>
                  {ticket.vendorName && (
                    <Text style={styles.vendorName}>by {ticket.vendorName}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* QR Code Section */}
              <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                  <QRCode value={qrValue} size={200} color="#1F2937" backgroundColor="#E0FCFF" />
                  {/* Status Badge - Overlapping QR code */}
                  <View style={[styles.statusBadgeOverlay, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketId}>Ticket #{ticket._id?.slice(-8).toUpperCase()}</Text>
              </View>

              {/* Details Section */}
              <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>{formatDateTime(ticket.productDate)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{ticket.productDuration} minutes</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>{ticket.quantity}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValuePrice}>{formatTicketPrice(ticket)}</Text>
                </View>

                {ticket.productLocation?.address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{ticket.productLocation.address}</Text>
                  </View>
                )}

                {ticket.expiryDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expires</Text>
                    <Text style={[styles.detailValue, styles.expiryText]}>
                      {new Date(ticket.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {ticket.productDescription && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.descriptionText}>{ticket.productDescription}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Present this QR code at the venue</Text>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 16,
    color: '#64748B',
    fontStyle: 'italic',
    fontFamily: FontFamilies.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#E0FCFF',
    fontSize: 20,
    fontFamily: FontFamilies.primarySemiBold,
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: -12,
    right: -8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusText: {
    color: '#ADF7FF',
    fontSize: 14,
    fontFamily: FontFamilies.primarySemiBold,
    textTransform: 'uppercase',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  qrWrapper: {
    backgroundColor: '#E0FCFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
  },
  ticketId: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: FontFamilies.primaryMedium,
  },
  detailsContainer: {
    flex: 1,
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
    fontFamily: FontFamilies.primary,
  },
  detailValue: {
    fontSize: 14,
    color: '#E0FCFF',
    flex: 2,
    textAlign: 'right',
    fontFamily: FontFamilies.primaryMedium,
  },
  detailValuePrice: {
    fontSize: 16,
    color: '#60A5FA',
    fontFamily: FontFamilies.primarySemiBold,
    flex: 2,
    textAlign: 'right',
  },
  expiryText: {
    color: '#EF4444',
    fontFamily: FontFamilies.primaryMedium,
  },
  descriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginTop: 8,
    fontFamily: FontFamilies.primary,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: FontFamilies.primary,
  },
});

export default TicketCardModal;
