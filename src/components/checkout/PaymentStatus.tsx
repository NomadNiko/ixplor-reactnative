import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontFamilies } from '~/src/styles/fonts';

interface PaymentStatusProps {
  status: 'success' | 'error' | 'loading';
  title?: string;
  message?: string;
  onContinue?: () => void;
  onRetry?: () => void;
}

export default function PaymentStatus({
  status,
  title,
  message,
  onContinue,
  onRetry,
}: PaymentStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#10B981',
          bgColors: ['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.1)'],
          borderColor: 'rgba(16, 185, 129, 0.2)',
          title: title || 'Payment Successful!',
          message:
            message || 'Your order has been confirmed and you will receive a receipt shortly.',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          iconColor: '#EF4444',
          bgColors: ['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.1)'],
          borderColor: 'rgba(239, 68, 68, 0.2)',
          title: title || 'Payment Failed',
          message: message || 'Something went wrong with your payment. Please try again.',
        };
      case 'loading':
      default:
        return {
          icon: 'hourglass' as const,
          iconColor: '#60A5FA',
          bgColors: ['rgba(96, 165, 250, 0.1)', 'rgba(59, 130, 246, 0.1)'],
          borderColor: 'rgba(96, 165, 250, 0.2)',
          title: title || 'Processing Payment...',
          message: message || 'Please wait while we process your payment.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      <LinearGradient colors={config.bgColors} style={styles.statusCard}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={64} color={config.iconColor} />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>

          <View style={styles.buttonContainer}>
            {status === 'success' && onContinue && (
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onContinue}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            )}

            {status === 'error' && onRetry && (
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onRetry}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}

            {status === 'loading' && (
              <View style={styles.loadingIndicator}>
                <Text style={styles.loadingText}>Please do not close this screen</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#60A5FA',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#64748B',
    textAlign: 'center',
  },
});
