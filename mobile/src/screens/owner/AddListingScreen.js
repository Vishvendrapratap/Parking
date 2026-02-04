import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { createParkingSpace } from "../../api/services";
import { useLocation } from "../../hooks/useLocation";
import {
  COLORS,
  PARKING_SIZES,
  AMENITIES,
  DEFAULT_LOCATION,
} from "../../constants/config";

const AddListingScreen = ({ navigation }) => {
  const { location, getCurrentLocation } = useLocation();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePerHour: "",
    parkingSize: "sedan",
    amenities: [],
    accessInstructions: "",
    location: {
      address: "",
      coordinates: DEFAULT_LOCATION,
    },
  });
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_LOCATION);

  // Fetch current location when component mounts
  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      setMarkerPosition(coords);
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: coords,
        },
      }));
      // Animate map to current location
      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  };

  const pickImages = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets].slice(0, 5));
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates: { latitude, longitude },
      },
    });
  };

  const useCurrentLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      setMarkerPosition(coords);
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          coordinates: coords,
        },
      });
      // Animate map to current location
      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    }
  };

  const toggleAmenity = (amenity) => {
    const current = formData.amenities;
    if (current.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: current.filter((a) => a !== amenity),
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...current, amenity],
      });
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          Alert.alert("Error", "Please enter a title");
          return false;
        }
        if (!formData.description.trim()) {
          Alert.alert("Error", "Please enter a description");
          return false;
        }
        return true;
      case 2:
        if (!formData.pricePerHour || parseFloat(formData.pricePerHour) <= 0) {
          Alert.alert("Error", "Please enter a valid price");
          return false;
        }
        return true;
      case 3:
        if (!formData.location.address.trim()) {
          Alert.alert("Error", "Please enter an address");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("pricePerHour", parseFloat(formData.pricePerHour));
      submitData.append("parkingSize", formData.parkingSize);
      submitData.append("amenities", JSON.stringify(formData.amenities));
      submitData.append("accessInstructions", formData.accessInstructions);
      submitData.append("address", formData.location.address);
      submitData.append("latitude", markerPosition.latitude);
      submitData.append("longitude", markerPosition.longitude);

      images.forEach((image, index) => {
        submitData.append("images", {
          uri: image.uri,
          type: "image/jpeg",
          name: `image_${index}.jpg`,
        });
      });

      const result = await createParkingSpace(submitData);

      if (result.success) {
        Alert.alert("Success", "Listing created successfully!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create listing",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="e.g., Spacious Driveway Near Downtown"
          placeholderTextColor={COLORS.gray[400]}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          placeholder="Describe your parking space, surroundings, and any special features..."
          placeholderTextColor={COLORS.gray[400]}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Photos (up to 5)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImages}
              >
                <Text style={styles.addImageIcon}>📷</Text>
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Details & Pricing</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Parking Size *</Text>
        <View style={styles.sizeOptions}>
          {PARKING_SIZES.map((size) => (
            <TouchableOpacity
              key={size.value}
              style={[
                styles.sizeOption,
                formData.parkingSize === size.value && styles.sizeOptionActive,
              ]}
              onPress={() =>
                setFormData({ ...formData, parkingSize: size.value })
              }
            >
              <Text style={styles.sizeIcon}>{size.icon}</Text>
              <Text
                style={[
                  styles.sizeLabel,
                  formData.parkingSize === size.value && styles.sizeLabelActive,
                ]}
              >
                {size.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Price per Hour ($) *</Text>
        <TextInput
          style={styles.input}
          value={formData.pricePerHour}
          onChangeText={(text) =>
            setFormData({ ...formData, pricePerHour: text })
          }
          placeholder="0.00"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {AMENITIES.map((amenity) => (
            <TouchableOpacity
              key={amenity.value}
              style={[
                styles.amenityOption,
                formData.amenities.includes(amenity.value) &&
                  styles.amenityOptionActive,
              ]}
              onPress={() => toggleAmenity(amenity.value)}
            >
              <Text style={styles.amenityIcon}>{amenity.icon}</Text>
              <Text
                style={[
                  styles.amenityLabel,
                  formData.amenities.includes(amenity.value) &&
                    styles.amenityLabelActive,
                ]}
              >
                {amenity.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Access Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.accessInstructions}
          onChangeText={(text) =>
            setFormData({ ...formData, accessInstructions: text })
          }
          placeholder="How should guests access the parking space? Any gate codes, special instructions..."
          placeholderTextColor={COLORS.gray[400]}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={formData.location.address}
          onChangeText={(text) =>
            setFormData({
              ...formData,
              location: { ...formData.location, address: text },
            })
          }
          placeholder="Enter your address"
          placeholderTextColor={COLORS.gray[400]}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pin Location on Map</Text>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              ...markerPosition,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={(e) => handleMapPress(e)}
            />
          </MapView>
        </View>
        <TouchableOpacity
          style={styles.useLocationButton}
          onPress={useCurrentLocation}
        >
          <Text style={styles.useLocationText}>📍 Use Current Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Listing</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive,
              ]}
            >
              <Text style={styles.progressDotText}>{step}</Text>
            </View>
            {step < 3 && (
              <View
                style={[
                  styles.progressLine,
                  currentStep > step && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && { flex: 1 }]}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Create Listing</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  cancelButton: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.gray[200],
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.gray[800],
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.gray[800],
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imagesContainer: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
  },
  imageWrapper: {
    position: "relative",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  sizeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  sizeOption: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  sizeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  sizeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sizeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray[600],
  },
  sizeLabelActive: {
    color: COLORS.primary,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  amenityOptionActive: {
    backgroundColor: COLORS.primary + "20",
    borderColor: COLORS.primary,
  },
  amenityIcon: {
    marginRight: 6,
  },
  amenityLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  amenityLabelActive: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  useLocationButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  useLocationText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  backButton: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  nextButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default AddListingScreen;
