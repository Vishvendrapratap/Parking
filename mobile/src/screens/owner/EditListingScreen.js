import React, { useState, useEffect } from "react";
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
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  getParkingSpace,
  updateParkingSpace,
  deleteParkingImage,
  addParkingImages,
  activateListing,
  deactivateListing,
} from "../../api/services";
import { COLORS, PARKING_SIZES, AMENITIES } from "../../constants/config";
import Icon from "../../components/Icon";
import { useNotification } from "../../contexts/NotificationContext";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DEFAULT_AVAILABILITY = {
  monday: { start: "09:00", end: "18:00", isAvailable: true },
  tuesday: { start: "09:00", end: "18:00", isAvailable: true },
  wednesday: { start: "09:00", end: "18:00", isAvailable: true },
  thursday: { start: "09:00", end: "18:00", isAvailable: true },
  friday: { start: "09:00", end: "18:00", isAvailable: true },
  saturday: { start: "09:00", end: "18:00", isAvailable: true },
  sunday: { start: "09:00", end: "18:00", isAvailable: false },
};

const EditListingScreen = ({ route, navigation }) => {
  const { parkingId } = route.params;
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [listingStatus, setListingStatus] = useState("draft");
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [availabilitySchedule, setAvailabilitySchedule] =
    useState(DEFAULT_AVAILABILITY);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePerHour: "",
    parkingSize: "sedan",
    amenities: [],
    accessInstructions: "",
    status: "available",
    location: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      coordinates: { latitude: 0, longitude: 0 },
    },
  });

  useEffect(() => {
    fetchListing();
  }, [parkingId]);

  // Helper function to parse address string into components
  const parseAddress = (addressString) => {
    if (!addressString)
      return { street: "", city: "", state: "", zipCode: "", country: "India" };

    const parts = addressString.split(",").map((part) => part.trim());
    return {
      street: parts[0] || "",
      city: parts[1] || "",
      state: parts[2]?.split(" ")[0] || "",
      zipCode: parts[2]?.split(" ")[1] || "",
      country: parts[3] || "India",
    };
  };

  const fetchListing = async () => {
    try {
      setLoading(true);
      const result = await getParkingSpace(parkingId);
      const parking = result.data;

      // Parse existing address or use separate fields if available
      const addressParts = parseAddress(parking.location?.address);

      setFormData({
        title: parking.title || "",
        description: parking.description || "",
        pricePerHour: parking.pricePerHour?.toString() || "",
        parkingSize: parking.parkingSize || "sedan",
        amenities: parking.amenities || [],
        accessInstructions: parking.accessInstructions || "",
        status: parking.status || "available",
        location: {
          street: parking.street || addressParts.street,
          city: parking.city || addressParts.city,
          state: parking.state || addressParts.state,
          zipCode: parking.zipCode || addressParts.zipCode,
          country: parking.country || addressParts.country || "India",
          coordinates: {
            latitude: parking.location?.coordinates?.[1] || 0,
            longitude: parking.location?.coordinates?.[0] || 0,
          },
        },
      });
      setImages(parking.images || []);
      setListingStatus(parking.listingStatus || "draft");
      if (parking.availabilitySchedule) {
        setAvailabilitySchedule({
          ...DEFAULT_AVAILABILITY,
          ...parking.availabilitySchedule,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load listing");
      navigation.goBack();
    } finally {
      setLoading(false);
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
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImages(
        [...newImages, ...result.assets].slice(0, 5 - images.length),
      );
    }
  };

  const removeExistingImage = async (imageId, index) => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteParkingImage(parkingId, imageId);
            setImages(images.filter((_, i) => i !== index));
          } catch (error) {
            Alert.alert("Error", "Failed to remove image");
          }
        },
      },
    ]);
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!formData.pricePerHour || parseFloat(formData.pricePerHour) <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    try {
      setSaving(true);

      // Combine address fields into full address string
      const fullAddress = `${formData.location.street}, ${formData.location.city}, ${formData.location.state} ${formData.location.zipCode}, ${formData.location.country}`;

      // Update basic info
      await updateParkingSpace(parkingId, {
        title: formData.title,
        description: formData.description,
        pricePerHour: parseFloat(formData.pricePerHour),
        parkingSize: formData.parkingSize,
        amenities: formData.amenities,
        accessInstructions: formData.accessInstructions,
        status: formData.status,
        address: fullAddress,
        street: formData.location.street,
        city: formData.location.city,
        state: formData.location.state,
        zipCode: formData.location.zipCode,
        country: formData.location.country,
      });

      // Upload new images if any
      if (newImages.length > 0) {
        const imageFormData = new FormData();
        newImages.forEach((image, index) => {
          imageFormData.append("images", {
            uri: image.uri,
            type: "image/jpeg",
            name: `image_${index}.jpg`,
          });
        });
        await addParkingImages(parkingId, imageFormData);
      }

      Alert.alert("Success", "Listing updated successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update listing";
      showNotification({
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDayAvailability = (day, field, value) => {
    setAvailabilitySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleActivate = async () => {
    Alert.alert(
      "Activate Listing",
      "Once activated, you won't be able to edit this listing. Are you sure you want to activate it?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: async () => {
            try {
              setActivating(true);
              await activateListing(parkingId);
              setListingStatus("active");
              Alert.alert(
                "Success",
                "Listing is now active and visible to seekers!",
              );
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to activate listing",
              );
            } finally {
              setActivating(false);
            }
          },
        },
      ],
    );
  };

  const handleDeactivate = async () => {
    Alert.alert(
      "Deactivate Listing",
      "This will hide your listing from seekers. You can edit it after deactivation. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              setActivating(true);
              await deactivateListing(parkingId);
              setListingStatus("inactive");
              Alert.alert(
                "Success",
                "Listing has been deactivated. You can now edit it.",
              );
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to deactivate listing",
              );
            } finally {
              setActivating(false);
            }
          },
        },
      ],
    );
  };

  const isEditable = listingStatus !== "active";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Listing</Text>
        {isEditable ? (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            >
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {/* Active Listing Banner */}
      {!isEditable && (
        <View style={styles.activeBanner}>
          <Icon name="lock" size="md" color={COLORS.white} />
          <Text style={styles.activeBannerText}>
            This listing is active and cannot be edited. Deactivate it to make
            changes.
          </Text>
        </View>
      )}

      {/* Listing Status Badge */}
      <View style={styles.listingStatusContainer}>
        <View
          style={[
            styles.listingStatusBadge,
            listingStatus === "active" && styles.listingStatusActive,
            listingStatus === "draft" && styles.listingStatusDraft,
            listingStatus === "inactive" && styles.listingStatusInactive,
          ]}
        >
          <Text style={styles.listingStatusText}>
            {listingStatus.charAt(0).toUpperCase() + listingStatus.slice(1)}
          </Text>
        </View>
        {listingStatus === "draft" && (
          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivate}
            disabled={activating}
          >
            {activating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.activateButtonText}>Activate Listing</Text>
            )}
          </TouchableOpacity>
        )}
        {listingStatus === "active" && (
          <TouchableOpacity
            style={styles.deactivateButton}
            onPress={handleDeactivate}
            disabled={activating}
          >
            {activating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.deactivateButtonText}>Deactivate</Text>
            )}
          </TouchableOpacity>
        )}
        {listingStatus === "inactive" && (
          <TouchableOpacity
            style={styles.activateButton}
            onPress={handleActivate}
            disabled={activating}
          >
            {activating ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.activateButtonText}>Reactivate</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status Toggle */}
          <View
            style={[styles.statusContainer, !isEditable && styles.disabled]}
          >
            <Text style={styles.label}>Availability Status</Text>
            <View style={styles.statusToggle}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  formData.status === "available" && styles.statusOptionActive,
                ]}
                onPress={() =>
                  isEditable &&
                  setFormData({ ...formData, status: "available" })
                }
                disabled={!isEditable}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    formData.status === "available" &&
                      styles.statusOptionTextActive,
                  ]}
                >
                  Available
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  formData.status === "unavailable" &&
                    styles.statusOptionInactive,
                ]}
                onPress={() =>
                  setFormData({ ...formData, status: "unavailable" })
                }
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    formData.status === "unavailable" &&
                      styles.statusOptionTextInactive,
                  ]}
                >
                  Unavailable
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Images */}
          <View style={[styles.inputContainer, !isEditable && styles.disabled]}>
            <Text style={styles.label}>
              Photos ({images.length + newImages.length}/5)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesContainer}>
                {images.map((image, index) => (
                  <View key={image._id || index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: image.url }}
                      style={styles.previewImage}
                    />
                    {isEditable && (
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeExistingImage(image._id, index)}
                      >
                        <Icon name="times" size="sm" color={COLORS.white} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {newImages.map((image, index) => (
                  <View key={`new_${index}`} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.previewImage}
                    />
                    {isEditable && (
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeNewImage(index)}
                      >
                        <Icon name="times" size="sm" color={COLORS.white} />
                      </TouchableOpacity>
                    )}
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>New</Text>
                    </View>
                  </View>
                ))}
                {images.length + newImages.length < 5 && isEditable && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={pickImages}
                  >
                    <Icon name="camera" size="2xl" color={COLORS.gray[400]} />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Basic Info */}
          <View style={[styles.inputContainer, !isEditable && styles.disabled]}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Spacious Driveway Near Downtown"
              placeholderTextColor={COLORS.gray[400]}
              editable={isEditable}
            />
          </View>

          <View style={[styles.inputContainer, !isEditable && styles.disabled]}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Describe your parking space..."
              placeholderTextColor={COLORS.gray[400]}
              multiline
              numberOfLines={4}
              editable={isEditable}
            />
          </View>

          {/* Size */}
          <View style={[styles.inputContainer, !isEditable && styles.disabled]}>
            <Text style={styles.label}>Parking Size</Text>
            <View style={styles.sizeOptions}>
              {PARKING_SIZES.map((size) => (
                <TouchableOpacity
                  key={size.value}
                  style={[
                    styles.sizeOption,
                    formData.parkingSize === size.value &&
                      styles.sizeOptionActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, parkingSize: size.value })
                  }
                >
                  <Text style={styles.sizeIcon}>{size.icon}</Text>
                  <Text
                    style={[
                      styles.sizeLabel,
                      formData.parkingSize === size.value &&
                        styles.sizeLabelActive,
                    ]}
                  >
                    {size.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price per Hour (₹) *</Text>
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

          {/* Amenities */}
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

          {/* Access Instructions */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Access Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.accessInstructions}
              onChangeText={(text) =>
                setFormData({ ...formData, accessInstructions: text })
              }
              placeholder="How should guests access the parking space?"
              placeholderTextColor={COLORS.gray[400]}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Location - Street Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.location.street}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  location: { ...formData.location, street: text },
                })
              }
              placeholder="e.g., 123 Main Street, Apt 4B"
              placeholderTextColor={COLORS.gray[400]}
            />
          </View>

          {/* City and State */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.location.city}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, city: text },
                  })
                }
                placeholder="City"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={formData.location.state}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, state: text },
                  })
                }
                placeholder="State"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>
          </View>

          {/* ZIP Code and Country */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>ZIP Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.location.zipCode}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, zipCode: text },
                  })
                }
                placeholder="ZIP Code"
                placeholderTextColor={COLORS.gray[400]}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={formData.location.country}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, country: text },
                  })
                }
                placeholder="Country"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>
          </View>

          {/* Map Preview */}
          {formData.location.coordinates.latitude !== 0 && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  ...formData.location.coordinates,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
              >
                <Marker coordinate={formData.location.coordinates} />
              </MapView>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
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
    color: COLORS.text.primary,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  saveButtonDisabled: {
    color: COLORS.gray[400],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: 4,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  statusOptionActive: {
    backgroundColor: COLORS.secondary,
  },
  statusOptionInactive: {
    backgroundColor: COLORS.gray[400],
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  statusOptionTextActive: {
    color: COLORS.white,
  },
  statusOptionTextInactive: {
    color: COLORS.white,
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
    color: COLORS.text.primary,
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
  newBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.white,
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
    paddingVertical: 12,
    alignItems: "center",
  },
  sizeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  sizeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  sizeLabel: {
    fontSize: 12,
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
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  rowInputs: {
    flexDirection: "row",
  },
  bottomSpacer: {
    height: 40,
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.error,
    padding: 12,
  },
  activeBannerText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    marginLeft: 10,
  },
  listingStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  listingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray[300],
  },
  listingStatusActive: {
    backgroundColor: COLORS.secondary,
  },
  listingStatusDraft: {
    backgroundColor: COLORS.gray[400],
  },
  listingStatusInactive: {
    backgroundColor: COLORS.error,
  },
  listingStatusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  activateButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activateButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  deactivateButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deactivateButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default EditListingScreen;
