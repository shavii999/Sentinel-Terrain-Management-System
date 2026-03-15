import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../theme/colors';
import { analyzeImage } from '../services/GeminiService';

const INCIDENT_CATEGORIES = [
  { id: 'pothole', label: 'Pothole', icon: 'alert-circle' },
  { id: 'flooding', label: 'Flooding', icon: 'water' },
  { id: 'signage', label: 'Damaged Sign', icon: 'warning' },
  { id: 'debris', label: 'Road Debris', icon: 'trash' },
  { id: 'crack', label: 'Road Crack', icon: 'git-commit' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const ReportIssueModal = ({ visible, onClose, onSubmit }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const resetForm = () => {
    setSelectedImage(null);
    setCategory(null);
    setDescription('');
    setLocation('');
    setIsSubmitting(false);
    setImageAnalysis(null);
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fileInputRef = useRef(null);

  const handleImageSelected = async (imageUri) => {
    setSelectedImage(imageUri);
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeImage(imageUri, category);
      setImageAnalysis(analysis.analysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pickImage = async (useCamera) => {
    if (Platform.OS === 'web') {
      // On web, trigger native file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }
    try {
      let result;
      
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Media library permission is needed to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        await handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleWebFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      const uri = URL.createObjectURL(file);
      handleImageSelected(uri);
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      pickImage(false);
      return;
    }
    Alert.alert(
      'Add Photo',
      'How would you like to add a photo?',
      [
        { text: 'Take Photo', onPress: () => pickImage(true) },
        { text: 'Choose from Library', onPress: () => pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedImage) {
      Alert.alert('Required', 'Please add a photo of the issue.');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please provide a description.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create incident report object with AI analysis
      const incidentReport = {
        id: Date.now(),
        image: selectedImage,
        category: category,
        description: description.trim(),
        location: location.trim() || 'Location not specified',
        status: 'new',
        timestamp: new Date().toISOString(),
        aiAnalysis: imageAnalysis, // Include AI analysis results
      };

      // Submit the report
      if (onSubmit) {
        await onSubmit(incidentReport);
      }

      Alert.alert('Success', 'Your report has been submitted successfully.', [
        { text: 'OK', onPress: handleClose },
      ]);
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Hidden file input for web */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleWebFileChange}
          />
        )}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Issue</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo *</Text>
            <TouchableOpacity style={styles.imageContainer} onPress={showImageOptions}>
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={showImageOptions}
                  >
                    <Ionicons name="camera" size={20} color={colors.primary} />
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={48} color={colors.textSecondary} />
                  <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                  <Text style={styles.imageSubtext}>
                    {Platform.OS === 'web'
                      ? 'Select a file from your device'
                      : 'Take a photo or choose from library'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* AI Analysis Section */}
          {(isAnalyzing || imageAnalysis) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>AI Analysis</Text>
              {isAnalyzing ? (
                <View style={styles.analysisLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.analysisLoadingText}>Analyzing image...</Text>
                </View>
              ) : imageAnalysis ? (
                <View style={styles.analysisContainer}>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>Severity:</Text>
                    <Text style={[
                      styles.analysisValue,
                      { color: imageAnalysis.severity === 'High' ? colors.danger : 
                              imageAnalysis.severity === 'Moderate' ? colors.warning : colors.success }
                    ]}>
                      {imageAnalysis.severity}
                    </Text>
                  </View>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>Type Detected:</Text>
                    <Text style={styles.analysisValue}>{imageAnalysis.type || category}</Text>
                  </View>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>Recommendation:</Text>
                    <Text style={styles.analysisValue}>{imageAnalysis.recommendation}</Text>
                  </View>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>Est. Cost:</Text>
                    <Text style={styles.analysisValue}>{imageAnalysis.estimatedCost}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {/* Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <View style={styles.categoryGrid}>
              {INCIDENT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={24}
                    color={category === cat.id ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.id && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location (Optional)</Text>
            <View style={styles.locationInputContainer}>
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.locationInput}
                placeholder="e.g., Near Moca Square, Main Street"
                placeholderTextColor={colors.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Ionicons name="send" size={20} color={colors.textLight} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textSecondary,
  },
  imageSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  changeImageText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  analysisLoadingText: {
    fontSize: 14,
    color: colors.primary,
  },
  analysisContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  analysisValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    width: '31%',
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});

export default ReportIssueModal;
