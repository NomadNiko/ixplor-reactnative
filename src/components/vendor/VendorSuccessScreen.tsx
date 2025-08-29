import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamilies } from '~/src/styles/fonts';
import { router } from 'expo-router';

interface VendorSuccessScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const VendorSuccessScreen: React.FC<VendorSuccessScreenProps> = ({ visible, onClose }) => {
  const [progress] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
      ]).start();

      // Auto redirect after 3 seconds
      const timer = setTimeout(() => {
        onClose();
        router.push('/(tabs)/vendor-status');
      }, 3000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#0F172A']}
          style={StyleSheet.absoluteFillObject}
          locations={[0, 0.5, 1]}
        />

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.title}>Congratulations!</Text>
            <Text style={styles.subtitle}>Your vendor journey begins now</Text>

            <Text style={styles.description}>
              {
                "Your vendor profile has been created successfully. You're now ready to start adding products and connecting with customers."
              }
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressText}>Redirecting to your vendor dashboard...</Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  checkmark: {
    fontSize: 60,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 36,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#ADF7FF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    fontFamily: FontFamilies.primary,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: FontFamilies.primary,
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
});
