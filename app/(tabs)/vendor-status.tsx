import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '~/src/components/Header';
import { FontFamilies } from '~/src/styles/fonts';
import { useAuth } from '~/lib/auth/context';
import { VendorTemplate } from '~/lib/api/vendors-crud';
import { StripeConnectModal } from '~/src/components/vendor/StripeConnectModal';

interface StatusStepProps {
  status: 'complete' | 'in-progress' | 'pending';
  title: string;
  description: string;
  children?: React.ReactNode;
}

const StatusStep: React.FC<StatusStepProps> = ({ status, title, description, children }) => {
  const getIcon = () => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'in-progress':
        return '●';
      default:
        return '○';
    }
  };

  const getIconColor = () => {
    switch (status) {
      case 'complete':
        return '#10B981';
      case 'in-progress':
        return '#60a5fa';
      default:
        return '#64748B';
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconContainer, { backgroundColor: getIconColor() }]}>
          <Text style={styles.stepIcon}>{getIcon()}</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepDescription}>{description}</Text>
          {children && <View style={styles.stepActions}>{children}</View>}
        </View>
      </View>
    </View>
  );
};

export default function VendorStatusScreen() {
  const { vendorStatus, checkVendorStatus } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);

  const isStripeComplete = vendorStatus?.isStripeSetupComplete === true;
  const hasTemplates = vendorStatus?.hasTemplates === true;
  const hasProducts = vendorStatus?.hasProducts === true;

  const loadVendorData = useCallback(async () => {
    if (!vendorStatus?._id) return;

    try {
      // In the future, we would load templates and products here
      // For now, we're using the flags from vendorStatus
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  }, [vendorStatus?._id]);

  useEffect(() => {
    loadVendorData();
  }, [loadVendorData]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await checkVendorStatus();
      await loadVendorData();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStripeConnect = () => {
    setShowStripeModal(true);
  };

  if (!vendorStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showCart={false} />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No vendor profile found</Text>
          <Text style={styles.errorSubtext}>Please create a vendor profile from the dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showCart={false} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#60a5fa" />
        }>
        <LinearGradient colors={['#1C283A', '#151D2B']} style={styles.headerCard}>
          <Text style={styles.headerTitle}>Vendor Onboarding</Text>
          <Text style={styles.headerSubtitle}>Complete these steps to start selling on ixplor</Text>
        </LinearGradient>

        <View style={styles.stepsContainer}>
          {/* Step 1: Profile Created - Always Complete */}
          <StatusStep
            status="complete"
            title="1. Vendor Profile Created"
            description="Your vendor profile has been successfully created"
          />

          {/* Step 2: Connect Payment Processing - Now the second step */}
          <StatusStep
            status={isStripeComplete ? 'complete' : 'in-progress'}
            title="2. Connect Payment Processing"
            description="Set up Stripe Connect to receive payments">
            {!isStripeComplete && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleStripeConnect}>
                <Text style={styles.primaryButtonText}>Connect Stripe</Text>
              </TouchableOpacity>
            )}
          </StatusStep>

          {/* Step 3: Create Product Templates - Placeholder */}
          <StatusStep
            status={isStripeComplete ? (hasTemplates ? 'complete' : 'pending') : 'pending'}
            title="3. Create Product Templates"
            description="Define reusable templates for your products and services">
            {isStripeComplete && !hasTemplates && (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Product template creation coming soon</Text>
              </View>
            )}
          </StatusStep>

          {/* Step 4: Generate Product Items - Placeholder */}
          <StatusStep
            status={hasProducts ? 'complete' : 'pending'}
            title="4. Generate Product Items"
            description="Create bookable items from your templates">
            {hasTemplates && !hasProducts && (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>
                  Product generation will be available soon
                </Text>
              </View>
            )}
          </StatusStep>

          {/* Step 5: Final Approval */}
          <StatusStep
            status={isStripeComplete ? 'in-progress' : 'pending'}
            title="5. Final Approval"
            description="Your vendor account is being reviewed">
            {isStripeComplete && (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  {"Your application is under review. You'll be notified once approved."}
                </Text>
              </View>
            )}
          </StatusStep>
        </View>

        {/* Vendor Status Badge */}
        {vendorStatus.vendorStatus === 'ACTION_NEEDED' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Action Needed</Text>
            <Text style={styles.warningText}>
              {vendorStatus.actionNeeded || 'Please complete the required steps'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Stripe Connect Modal */}
      <StripeConnectModal
        visible={showStripeModal}
        vendorId={vendorStatus._id}
        onClose={() => setShowStripeModal(false)}
        onSuccess={() => {
          setShowStripeModal(false);
          handleRefresh();
          Alert.alert('Success', 'Payment setup completed successfully!');
        }}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
  },
  stepsContainer: {
    padding: 16,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    lineHeight: 20,
  },
  stepActions: {
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#60a5fa',
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#60a5fa',
    fontFamily: FontFamilies.primaryMedium,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#60a5fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    color: '#0F172A',
    fontFamily: FontFamilies.primarySemiBold,
    fontSize: 14,
  },
  placeholderContainer: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  placeholderText: {
    color: '#64748B',
    fontFamily: FontFamilies.primary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#60a5fa',
  },
  infoText: {
    color: '#60a5fa',
    fontFamily: FontFamilies.primary,
    fontSize: 14,
  },
  warningCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FACC15',
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#FACC15',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#FDE047',
  },
});
