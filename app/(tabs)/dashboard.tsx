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
  Modal,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '~/src/components/Header';
import { useAuth } from '~/lib/auth/context';
import { ticketsApi, Ticket } from '~/lib/api/tickets';
import { invoicesApi, Invoice, formatInvoiceAmount, getInvoiceTotalItems, formatInvoiceDate } from '~/lib/api/invoices';
import { supportTicketsApi } from '~/lib/api/support-tickets';
import { SupportTicket, SUPPORT_TICKET_STATUS_LABELS, SUPPORT_TICKET_STATUS_COLORS } from '~/lib/types/support-ticket';
import { profileApi, UpdateProfileDto } from '~/lib/api/profile';
import { getRecentActiveTickets } from '~/lib/utils/ticketUtils';
import { router } from 'expo-router';

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

type ReceiptCardProps = {
  invoice: Invoice;
  onPress: () => void;
};

const ReceiptCard = ({ invoice, onPress }: ReceiptCardProps) => {
  const totalItems = getInvoiceTotalItems(invoice);
  const vendorCount = invoice.vendorGroups?.length || 0;
  
  return (
    <TouchableOpacity style={styles.receiptCard} onPress={onPress}>
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptAmount}>
          {formatInvoiceAmount(invoice.amount, invoice.currency)}
        </Text>
        <Text style={styles.receiptDate}>
          {formatInvoiceDate(invoice.invoiceDate)}
        </Text>
      </View>
      
      <Text style={styles.receiptDetails}>
        {vendorCount} vendor{vendorCount !== 1 ? 's' : ''} • {totalItems} item{totalItems !== 1 ? 's' : ''}
      </Text>
      
      <View style={styles.receiptVendors}>
        {invoice.vendorGroups?.slice(0, 2).map((group, index) => (
          <Text key={group.vendorId} style={styles.receiptVendorName}>
            {group.vendorName}
            {index < Math.min(invoice.vendorGroups.length - 1, 1) && ', '}
          </Text>
        ))}
        {vendorCount > 2 && (
          <Text style={styles.receiptVendorName}>
            +{vendorCount - 2} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

type SupportTicketCardProps = {
  ticket: SupportTicket;
  onPress: () => void;
};

const SupportTicketCard = ({ ticket, onPress }: SupportTicketCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.supportTicketCard} onPress={onPress}>
      <View style={styles.supportTicketHeader}>
        <Text style={styles.supportTicketId}>{ticket.ticketId}</Text>
        <View style={[styles.supportStatusBadge, { backgroundColor: SUPPORT_TICKET_STATUS_COLORS[ticket.status] }]}>
          <Text style={styles.supportStatusText}>
            {SUPPORT_TICKET_STATUS_LABELS[ticket.status]}
          </Text>
        </View>
      </View>
      
      <Text style={styles.supportTicketTitle} numberOfLines={2}>
        {ticket.ticketTitle}
      </Text>
      
      <Text style={styles.supportTicketDate}>
        {formatDate(ticket.createDate)}
      </Text>
    </TouchableOpacity>
  );
};

const EditProfileModal = ({ 
  visible, 
  onClose, 
  user,
  onSave,
  isLoading 
}: {
  visible: boolean;
  onClose: () => void;
  user: any;
  onSave: (data: UpdateProfileDto) => Promise<void>;
  isLoading: boolean;
}) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleChangePhoto = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to change your profile picture.');
        return;
      }

      // Show options for camera or gallery
      Alert.alert(
        'Select Photo',
        'Choose from where you want to select a photo',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Camera',
            onPress: openCamera,
          },
          {
            text: 'Photo Library',
            onPress: openImageLibrary,
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to access photos');
    }
  };

  const openCamera = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission required', 'Please allow access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const updateData: UpdateProfileDto = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    // If user selected a new image, upload it first
    if (selectedImage) {
      try {
        setIsUploadingImage(true);
        console.log('Uploading selected image:', selectedImage);
        
        const uploadedFile = await profileApi.uploadProfileImage(selectedImage);
        updateData.photo = uploadedFile;
        
        console.log('Image uploaded successfully:', uploadedFile);
      } catch (error) {
        console.error('Failed to upload image:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    await onSave(updateData);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} disabled={isLoading || isUploadingImage}>
            <Text style={[styles.modalCancelText, (isLoading || isUploadingImage) && styles.modalButtonDisabled]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading || isUploadingImage}>
            <Text style={[styles.modalSaveText, (isLoading || isUploadingImage) && styles.modalButtonDisabled]}>
              {isLoading || isUploadingImage ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Profile Picture</Text>
            <View style={styles.profileImageSection}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.modalProfileImage}
                />
              ) : user?.photo?.path ? (
                <Image
                  source={{ 
                    uri: user.photo.path,
                    headers: { 'User-Agent': 'ixplor-mobile' }
                  }}
                  style={styles.modalProfileImage}
                />
              ) : (
                <View style={[styles.modalProfileImage, styles.profilePlaceholder]}>
                  <Text style={styles.profileInitials}>
                    {`${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.changePhotoButton} 
                disabled={isLoading || isUploadingImage}
                onPress={handleChangePhoto}
              >
                <Text style={styles.changePhotoText}>
                  {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="#64748B"
              editable={!isLoading && !isUploadingImage}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor="#64748B"
              editable={!isLoading && !isUploadingImage}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function Dashboard() {
  const { user, logout, updateUser } = useAuth();
  const [recentActiveTickets, setRecentActiveTickets] = useState<Ticket[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentSupportTickets, setRecentSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingSupportTickets, setIsLoadingSupportTickets] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const loadRecentActiveTickets = async () => {
      if (!user?.id) {
        console.log('Dashboard - No user ID found for loading tickets');
        setIsLoading(false);
        return;
      }

      console.log('Dashboard - Loading recent active tickets for user:', user.id);

      try {
        setIsLoading(true);
        const response = await ticketsApi.getUserTickets(user.id);
        console.log('Dashboard - All tickets loaded:', {
          totalTickets: response.data?.length || 0
        });
        
        // Get only the 4 most recent ACTIVE tickets
        const recentActive = getRecentActiveTickets(response.data || [], 4);
        setRecentActiveTickets(recentActive);
        
        console.log('Dashboard - Recent active tickets set:', {
          activeCount: recentActive.length,
          tickets: recentActive.map(t => ({
            id: t._id?.substring(0, 8),
            product: t.productName,
            status: t.status,
            date: t.productDate || t.createdAt
          }))
        });
        
      } catch (error) {
        Alert.alert('Error', 'Failed to load recent tickets');
        console.error('Dashboard - Failed to load recent tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadRecentInvoices = async () => {
      if (!user?.id) {
        console.log('Dashboard - No user ID found for loading invoices');
        setIsLoadingInvoices(false);
        return;
      }

      console.log('Dashboard - Loading recent invoices for user:', user.id);

      try {
        setIsLoadingInvoices(true);
        const response = await invoicesApi.getUserInvoices(user.id);
        console.log('Dashboard - All invoices loaded:', {
          totalInvoices: response.data?.length || 0,
          totalAmount: response.data?.reduce((sum, inv) => sum + inv.amount, 0) || 0
        });
        
        // Get only the 4 most recent invoices
        const recent = response.data?.slice(0, 4) || [];
        setRecentInvoices(recent);
        
        console.log('Dashboard - Recent invoices set:', {
          count: recent.length,
          invoices: recent.map(inv => ({
            id: inv._id?.substring(0, 8),
            amount: formatInvoiceAmount(inv.amount),
            vendors: inv.vendorGroups?.length || 0,
            date: inv.invoiceDate
          }))
        });
        
      } catch (error) {
        console.warn('Dashboard - Failed to load recent invoices (non-critical):', error);
        // Don't show error alert for invoices since it's not critical
        setRecentInvoices([]);
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    const loadRecentSupportTickets = async () => {
      if (!user?.id) {
        console.log('Dashboard - No user ID found for loading support tickets');
        setIsLoadingSupportTickets(false);
        return;
      }

      console.log('Dashboard - Loading recent support tickets for user:', user.id);

      try {
        setIsLoadingSupportTickets(true);
        const response = await supportTicketsApi.getUserSupportTickets(1, 10);
        console.log('Dashboard - All support tickets loaded:', {
          totalTickets: response.data?.length || 0
        });
        
        // Get only the 4 most recent support tickets
        const recent = response.data?.slice(0, 4) || [];
        setRecentSupportTickets(recent);
        
        console.log('Dashboard - Recent support tickets set:', {
          count: recent.length,
          tickets: recent.map(t => ({
            id: t._id?.substring(0, 8),
            ticketId: t.ticketId,
            status: t.status,
            title: t.ticketTitle?.substring(0, 30)
          }))
        });
        
      } catch (error) {
        console.warn('Dashboard - Failed to load recent support tickets (non-critical):', error);
        // Don't show error alert for support tickets since it's not critical
        setRecentSupportTickets([]);
      } finally {
        setIsLoadingSupportTickets(false);
      }
    };

    loadRecentActiveTickets();
    loadRecentInvoices();
    loadRecentSupportTickets();
  }, [user?.id]);

  const handleUpdateProfile = async (updateData: UpdateProfileDto) => {
    try {
      setIsUpdatingProfile(true);
      
      const response = await profileApi.updateProfile(updateData);
      
      // Update the user context with new data
      if (updateUser) {
        updateUser(response.data);
      }
      
      Alert.alert(
        'Success', 
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => setShowEditProfile(false) }]
      );
      
    } catch (error) {
      console.error('Dashboard - Failed to update profile:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const formatTicketForDisplay = (ticket: Ticket) => ({
    title: ticket.productName || ticket.product?.name || 'Unknown Product',
    subtitle: ticket.vendor?.name || 'Unknown Vendor',
    date: new Date(ticket.productDate || ticket.purchaseDate || ticket.createdAt).toLocaleDateString(),
    time: ticket.expiryDate ? new Date(ticket.expiryDate).toLocaleTimeString() : 'No expiry',
    ticketId: (ticket.id || ticket._id)?.substring(0, 8) || 'N/A',
    quantity: ticket.quantity,
    price: `$${(ticket.totalPrice || ticket.productPrice || 0).toFixed(2)}`,
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
          {user.photo?.path ? (
            <Image
              source={{ 
                uri: user.photo.path,
                headers: {
                  'User-Agent': 'ixplor-mobile'
                }
              }}
              style={styles.profileImage}
              onLoad={() => console.log('Profile image loaded successfully')}
              onError={(error) => {
                console.warn('Profile image failed to load, using placeholder:', error);
              }}
            />
          ) : (
            <View style={[styles.profileImage, styles.profilePlaceholder]}>
              <Text style={styles.profileInitials}>
                {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowEditProfile(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tickets</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tickets')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading recent tickets...</Text>
            </View>
          ) : recentActiveTickets.length > 0 ? (
            recentActiveTickets.map((ticket) => (
              <TicketCard key={ticket._id || ticket.id} {...formatTicketForDisplay(ticket)} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active tickets</Text>
              <Text style={styles.emptySubtext}>
                {"You don't have any upcoming tickets"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Receipts</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/receipts')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {isLoadingInvoices ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading receipts...</Text>
            </View>
          ) : recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => (
              <ReceiptCard
                key={invoice._id}
                invoice={invoice}
                onPress={() => {
                  Alert.alert('Receipt Details', `Invoice: ${invoice._id}\nAmount: ${formatInvoiceAmount(invoice.amount)}\nDate: ${formatInvoiceDate(invoice.invoiceDate)}`);
                }}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No receipts found</Text>
              <Text style={styles.emptySubtext}>
                Your purchase receipts will appear here
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/support')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {isLoadingSupportTickets ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading support tickets...</Text>
            </View>
          ) : recentSupportTickets.length > 0 ? (
            recentSupportTickets.map((ticket) => (
              <SupportTicketCard
                key={ticket._id}
                ticket={ticket}
                onPress={() => {
                  Alert.alert(
                    `Ticket ${ticket.ticketId}`,
                    `Status: ${SUPPORT_TICKET_STATUS_LABELS[ticket.status]}\nTitle: ${ticket.ticketTitle}\n\nTap "View All" to manage your tickets.`
                  );
                }}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No support tickets</Text>
              <Text style={styles.emptySubtext}>
                Create a ticket if you need help
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        onSave={handleUpdateProfile}
        isLoading={isUpdatingProfile}
      />
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 20,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  supportText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  receiptDate: {
    fontSize: 14,
    color: '#94A3B8',
  },
  receiptDetails: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  receiptVendors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  receiptVendorName: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '500',
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
    color: '#F8FAFC',
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
    color: '#F8FAFC',
  },
  // Support Ticket Card Styles
  supportTicketCard: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  supportTicketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportTicketId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  supportStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  supportStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  supportTicketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    lineHeight: 20,
  },
  supportTicketDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  // Profile placeholder styles
  profilePlaceholder: {
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
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
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  profileImageSection: {
    alignItems: 'center',
    gap: 12,
  },
  modalProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  changePhotoButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 8,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
