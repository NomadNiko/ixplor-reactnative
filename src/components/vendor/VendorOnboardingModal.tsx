import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { FontFamilies } from '~/src/styles/fonts';
import { vendorCrudApi } from '~/lib/api/vendors-crud';
import { useAuth } from '~/lib/auth/context';

interface VendorOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  businessName: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  logoUrl?: string;
}

export const VendorOnboardingModal: React.FC<VendorOnboardingModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user, checkVendorStatus } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isManualAddress, setIsManualAddress] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    description: '',
    email: user?.email || '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    latitude: 0,
    longitude: 0,
  });

  const sections = [
    { title: 'Basic Information', fields: ['businessName', 'description'] },
    { title: 'Contact Details', fields: ['email', 'phone', 'website'] },
    { title: 'Location', fields: ['address', 'city', 'state', 'postalCode', 'country'] },
  ];

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceSelect = (data: any, details: any) => {
    console.log('Google Places data received:', { data, details });
    
    if (details && details.address_components && details.geometry) {
      const addressComponents = details.address_components || [];
      const geometry = details.geometry;

      // Extract address components with safety checks
      let streetNumber = '';
      let route = '';
      let city = '';
      let state = '';
      let country = '';
      let postalCode = '';

      try {
        addressComponents.forEach((component: any) => {
          const types = component.types || [];
          const longName = component.long_name || '';
          
          if (types.includes('street_number')) {
            streetNumber = longName;
          }
          if (types.includes('route')) {
            route = longName;
          }
          if (types.includes('locality') || types.includes('sublocality')) {
            city = longName;
          }
          if (types.includes('administrative_area_level_1')) {
            state = longName;
          }
          if (types.includes('country')) {
            country = longName;
          }
          if (types.includes('postal_code')) {
            postalCode = longName;
          }
        });

        // Update form data with safety checks
        setFormData((prev) => ({
          ...prev,
          address: `${streetNumber} ${route}`.trim() || data.description || '',
          city: city || '',
          state: state || '',
          postalCode: postalCode || '',
          country: country || '',
          latitude: geometry?.location?.lat || 0,
          longitude: geometry?.location?.lng || 0,
        }));

        console.log('✅ Google Places address parsed successfully:', {
          address: `${streetNumber} ${route}`.trim(),
          city,
          state,
          postalCode,
          country,
          coordinates: {
            lat: geometry?.location?.lat,
            lng: geometry?.location?.lng,
          }
        });
      } catch (error) {
        console.error('❌ Error parsing Google Places result:', error);
        // Fallback to basic data
        setFormData((prev) => ({
          ...prev,
          address: data.description || '',
        }));
      }
    } else {
      console.warn('⚠️ Incomplete Google Places data received');
      // Fallback to using the basic description
      if (data && data.description) {
        setFormData((prev) => ({
          ...prev,
          address: data.description,
        }));
      }
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }

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
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode) {
        setFormData((prev) => ({
          ...prev,
          address: `${reverseGeocode.streetNumber || ''} ${reverseGeocode.street || ''}`.trim(),
          city: reverseGeocode.city || '',
          state: reverseGeocode.region || '',
          postalCode: reverseGeocode.postalCode || '',
          country: reverseGeocode.country || '',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const validateSection = (sectionIndex: number): boolean => {
    const section = sections[sectionIndex];

    for (const field of section.fields) {
      const value = formData[field as keyof FormData];
      if (field !== 'website' && !value) {
        Alert.alert(
          'Required Field',
          `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        );
        return false;
      }
    }

    // Additional validation for specific fields
    if (sectionIndex === 1) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return false;
      }

      // Phone validation
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number');
        return false;
      }

      // Website validation (optional)
      if (
        formData.website &&
        !formData.website.match(/^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/.*)?$/)
      ) {
        Alert.alert('Invalid Website', 'Please enter a valid website URL');
        return false;
      }
    }

    if (sectionIndex === 2 && (!formData.latitude || !formData.longitude)) {
      Alert.alert('Location Required', 'Please use the GPS button to set your location');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        Alert.alert('Error', 'Please log in to create a vendor profile');
        return;
      }

      // Create vendor profile
      const vendorData = {
        ...formData,
        website: formData.website || undefined,
      };

      const response = await vendorCrudApi.createVendor(vendorData);

      // Upload logo if selected
      if (selectedImage && response._id) {
        try {
          await vendorCrudApi.uploadVendorLogo(response._id, selectedImage);
        } catch (error) {
          console.warn('Failed to upload logo:', error);
          // Continue even if logo upload fails
        }
      }

      // Refresh vendor status in auth context
      await checkVendorStatus();

      onSuccess();
    } catch (error) {
      console.error('Error creating vendor:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create vendor profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Basic Information
        return (
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.businessName}
                onChangeText={(text) => handleInputChange('businessName', text)}
                placeholder="Enter your business name"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Describe your business"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        );

      case 1: // Contact Details
        return (
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="your@email.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="+1 234 567 8900"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website (optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.website}
                onChangeText={(text) => handleInputChange('website', text)}
                placeholder="https://www.example.com"
                placeholderTextColor="#64748B"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Logo (optional)</Text>
              <TouchableOpacity style={styles.imageButton} onPress={handleImagePicker}>
                <Text style={styles.imageButtonText}>
                  {selectedImage ? 'Change Logo' : 'Select Logo'}
                </Text>
              </TouchableOpacity>
              {selectedImage && <Text style={styles.selectedImageText}>Logo selected</Text>}
            </View>
          </View>
        );

      case 2: // Location
        const googlePlacesApiKey = 'AIzaSyBKHBoAtN-80GkMC6eRRENyLd2cMK7pVto';
        
        return (
          <View style={styles.sectionContent}>
            {/* GPS Location Button */}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}>
              {isLoadingLocation ? (
                <ActivityIndicator color="#ADF7FF" />
              ) : (
                <>
                  <Text style={styles.gpsIcon}>📍</Text>
                  <Text style={styles.gpsButtonText}>Use Current Location</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Address Input Toggle */}
            <View style={styles.addressToggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isManualAddress && styles.toggleButtonActive]}
                onPress={() => setIsManualAddress(false)}>
                <Text style={[styles.toggleText, !isManualAddress && styles.toggleTextActive]}>
                  Search Address
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isManualAddress && styles.toggleButtonActive]}
                onPress={() => setIsManualAddress(true)}>
                <Text style={[styles.toggleText, isManualAddress && styles.toggleTextActive]}>
                  Manual Entry
                </Text>
              </TouchableOpacity>
            </View>

            {/* Address Search or Manual Entry */}
            {!isManualAddress ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Search Address *</Text>
                <GooglePlacesAutocomplete
                  placeholder="Start typing to search addresses..."
                  onPress={handlePlaceSelect}
                  onFail={(error) => {
                    console.error('Google Places API error:', error);
                    Alert.alert('Error', 'Failed to search addresses. Please try manual entry.');
                  }}
                  query={{
                    key: googlePlacesApiKey,
                    language: 'en',
                    types: 'address',
                    components: 'country:*', // Allow all countries
                  }}
                  styles={{
                    container: styles.autocompleteContainer,
                    textInput: styles.autocompleteInput,
                    listView: styles.autocompleteListView,
                    row: styles.autocompleteRow,
                    description: styles.autocompleteDescription,
                  }}
                  fetchDetails={true}
                  enablePoweredByContainer={false}
                  debounce={300}
                  minLength={3}
                  nearbyPlacesAPI="GooglePlacesSearch"
                  GooglePlacesSearchQuery={{
                    rankby: 'distance',
                  }}
                  filterReverseGeocodingByTypes={[
                    'locality',
                    'administrative_area_level_3'
                  ]}
                  predefinedPlaces={[]}
                  listViewDisplayed="auto"
                  keyboardShouldPersistTaps="handled"
                  keepResultsAfterBlur={true}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => handleInputChange('address', text)}
                  placeholder="Street address"
                  placeholderTextColor="#64748B"
                />
              </View>
            )}

            {/* City and Country */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => handleInputChange('city', text)}
                  placeholder="City"
                  placeholderTextColor="#64748B"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Country *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(text) => handleInputChange('country', text)}
                  placeholder="Country"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* State and Postal Code */}
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>State/Province</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) => handleInputChange('state', text)}
                  placeholder="State/Province"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postalCode}
                  onChangeText={(text) => handleInputChange('postalCode', text)}
                  placeholder="Postal Code"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Coordinates Display */}
            {formData.latitude !== 0 && (
              <Text style={styles.coordinatesText}>
                GPS: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1C283A', '#0F172A']} style={StyleSheet.absoluteFillObject} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Application</Text>
          <View style={{ width: 60 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {sections.map((_, index) => (
                <View
                  key={index}
                  style={[styles.progressDot, index <= currentSection && styles.progressDotActive]}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>{sections[currentSection].title}</Text>

            {renderSection()}
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          {currentSection > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
              disabled={isSubmitting}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.nextButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentSection === sections.length - 1 ? 'Submit' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.primarySemiBold,
    color: '#E0FCFF',
  },
  cancelButton: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: '#60a5fa',
    width: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FontFamilies.primaryBold,
    color: '#E0FCFF',
    marginBottom: 24,
  },
  sectionContent: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamilies.primaryMedium,
    color: '#ADF7FF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 8,
    padding: 16,
    color: '#E0FCFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontFamily: FontFamilies.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  imageButtonText: {
    color: '#60a5fa',
    fontFamily: FontFamilies.primaryMedium,
  },
  selectedImageText: {
    color: '#60a5fa',
    fontSize: 12,
    marginTop: 8,
    fontFamily: FontFamilies.primary,
  },
  gpsButton: {
    backgroundColor: '#60a5fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  gpsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  gpsButtonText: {
    color: '#0F172A',
    fontFamily: FontFamilies.primarySemiBold,
    fontSize: 16,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamilies.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#94A3B8',
    fontFamily: FontFamilies.primaryMedium,
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#60a5fa',
  },
  nextButtonText: {
    color: '#0F172A',
    fontFamily: FontFamilies.primarySemiBold,
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Address Toggle Styles
  addressToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#60a5fa',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: FontFamilies.primaryMedium,
    color: '#94A3B8',
  },
  toggleTextActive: {
    color: '#0F172A',
  },
  // Google Places Autocomplete Styles
  autocompleteContainer: {
    zIndex: 1,
  },
  autocompleteInput: {
    backgroundColor: 'rgba(28, 40, 58, 0.8)',
    borderRadius: 8,
    padding: 16,
    color: '#E0FCFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontFamily: FontFamilies.primary,
  },
  autocompleteListView: {
    backgroundColor: 'rgba(28, 40, 58, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 200,
  },
  autocompleteRow: {
    backgroundColor: 'transparent',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  autocompleteDescription: {
    color: '#E0FCFF',
    fontSize: 14,
    fontFamily: FontFamilies.primary,
  },
  apiKeyWarning: {
    color: '#F59E0B',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: FontFamilies.primary,
  },
});
