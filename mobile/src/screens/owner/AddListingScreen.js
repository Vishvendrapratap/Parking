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
  Switch,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createParkingSpace, getMyListings } from "../../api/services";
import { useLocation } from "../../hooks/useLocation";
import {
  COLORS,
  PARKING_SIZES,
  AMENITIES,
  DEFAULT_LOCATION,
} from "../../constants/config";
import Icon from "../../components/Icon";

const MAX_LISTINGS = 3;
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

const AddListingScreen = ({ navigation }) => {
  const { location, getCurrentLocation } = useLocation();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [listingCount, setListingCount] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState([]);
  const [availabilitySchedule, setAvailabilitySchedule] =
    useState(DEFAULT_AVAILABILITY);
  const [use24HourFormat, setUse24HourFormat] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeEdit, setCurrentTimeEdit] = useState({
    day: null,
    field: null,
  });
  const [tempTime, setTempTime] = useState(new Date());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePerHour: "",
    parkingSize: "sedan",
    amenities: [],
    accessInstructions: "",
    location: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      coordinates: DEFAULT_LOCATION,
    },
  });
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_LOCATION);

  // Fetch current location when component mounts
  useEffect(() => {
    initializeLocation();
    checkListingLimit();
  }, []);

  const checkListingLimit = async () => {
    try {
      setCheckingLimit(true);
      const response = await getMyListings();
      if (response.success) {
        const activeListings = response.data.filter(
          (listing) => listing.isActive,
        );
        setListingCount(activeListings.length);
      }
    } catch (error) {
      console.log("Error checking listing limit:", error);
    } finally {
      setCheckingLimit(false);
    }
  };

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
        if (!formData.location.street.trim()) {
          Alert.alert("Error", "Please enter a street address");
          return false;
        }
        if (!formData.location.city.trim()) {
          Alert.alert("Error", "Please enter a city");
          return false;
        }
        if (!formData.location.state.trim()) {
          Alert.alert("Error", "Please enter a state");
          return false;
        }
        if (!formData.location.zipCode.trim()) {
          Alert.alert("Error", "Please enter a ZIP code");
          return false;
        }
        return true;
      case 4:
        // Availability schedule is always valid (has defaults)
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

  const updateDayAvailability = (day, field, value) => {
    setAvailabilitySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);

      // Combine address fields into full address string
      const fullAddress = `${formData.location.street}, ${formData.location.city}, ${formData.location.state} ${formData.location.zipCode}, ${formData.location.country}`;

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("pricePerHour", parseFloat(formData.pricePerHour));
      submitData.append("parkingSize", formData.parkingSize);
      submitData.append("amenities", JSON.stringify(formData.amenities));
      submitData.append(
        "availabilitySchedule",
        JSON.stringify(availabilitySchedule),
      );
      submitData.append("accessInstructions", formData.accessInstructions);
      submitData.append("address", fullAddress);
      submitData.append("street", formData.location.street);
      submitData.append("city", formData.location.city);
      submitData.append("state", formData.location.state);
      submitData.append("zipCode", formData.location.zipCode);
      submitData.append("country", formData.location.country);
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
        Alert.alert(
          "Success",
          "Listing saved as draft! Activate it from My Listings to make it visible to seekers.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ],
        );
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
                  <Icon name="times" size="sm" color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pin Location on Map</Text>
        <Text style={styles.helperText}>
          Tap on the map or drag the marker to set exact location
        </Text>
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
          <Icon name="crosshairs" size="md" color={COLORS.primary} />
          <Text style={styles.useLocationText}> Use Current Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Helper functions for time format conversion
  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const convertTo24Hour = (time12) => {
    if (!time12) return "";
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return time12; // Return as-is if invalid format
    let [, hours, minutes, ampm] = match;
    let hour = parseInt(hours, 10);
    if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
  };

  const getDisplayTime = (time24) => {
    return use24HourFormat ? time24 : convertTo12Hour(time24);
  };

  // Convert time string to Date object for picker
  const timeStringToDate = (timeStr) => {
    const [hours, minutes] = (timeStr || "09:00").split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date;
  };

  // Convert Date object to time string
  const dateToTimeString = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Open time picker for a specific day and field
  const openTimePicker = (day, field) => {
    const currentTime = availabilitySchedule[day][field];
    setTempTime(timeStringToDate(currentTime));
    setCurrentTimeEdit({ day, field });
    setShowTimePicker(true);
  };

  // Handle time picker change
  const onTimePickerChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (event.type === "set" && selectedDate) {
        const timeStr = dateToTimeString(selectedDate);
        updateDayAvailability(
          currentTimeEdit.day,
          currentTimeEdit.field,
          timeStr,
        );
      }
    } else {
      // iOS - update temp time
      if (selectedDate) {
        setTempTime(selectedDate);
      }
    }
  };

  // Confirm iOS time picker selection
  const confirmIOSTime = () => {
    const timeStr = dateToTimeString(tempTime);
    updateDayAvailability(currentTimeEdit.day, currentTimeEdit.field, timeStr);
    setShowTimePicker(false);
  };

  // Cancel iOS time picker
  const cancelIOSTime = () => {
    setShowTimePicker(false);
  };

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Weekly Availability</Text>
      <Text style={styles.helperText}>
        Set your parking space availability for each day of the week
      </Text>

      {/* Time Format Toggle */}
      <View style={styles.timeFormatToggle}>
        <Text style={styles.timeFormatLabel}>Time Format</Text>
        <View style={styles.timeFormatOptions}>
          <TouchableOpacity
            style={[
              styles.timeFormatOption,
              !use24HourFormat && styles.timeFormatOptionActive,
            ]}
            onPress={() => setUse24HourFormat(false)}
          >
            <Text
              style={[
                styles.timeFormatOptionText,
                !use24HourFormat && styles.timeFormatOptionTextActive,
              ]}
            >
              12 Hour
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeFormatOption,
              use24HourFormat && styles.timeFormatOptionActive,
            ]}
            onPress={() => setUse24HourFormat(true)}
          >
            <Text
              style={[
                styles.timeFormatOptionText,
                use24HourFormat && styles.timeFormatOptionTextActive,
              ]}
            >
              24 Hour
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {DAYS_OF_WEEK.map((day) => (
        <View key={day} style={styles.dayRow}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            <Switch
              value={availabilitySchedule[day].isAvailable}
              onValueChange={(value) =>
                updateDayAvailability(day, "isAvailable", value)
              }
              trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          {availabilitySchedule[day].isAvailable && (
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Start</Text>
                <TouchableOpacity
                  style={styles.timeField}
                  onPress={() => openTimePicker(day, "start")}
                >
                  <Text style={styles.timeFieldText}>
                    {getDisplayTime(availabilitySchedule[day].start)}
                  </Text>
                  <Icon name="clock" size="sm" color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.timeSeparator}>to</Text>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>End</Text>
                <TouchableOpacity
                  style={styles.timeField}
                  onPress={() => openTimePicker(day, "end")}
                >
                  <Text style={styles.timeFieldText}>
                    {getDisplayTime(availabilitySchedule[day].end)}
                  </Text>
                  <Icon name="clock" size="sm" color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}

      <View style={styles.draftNotice}>
        <Icon name="info-circle" size="md" color={COLORS.primary} />
        <Text style={styles.draftNoticeText}>
          This listing will be saved as a draft. You can activate it later from
          My Listings to make it visible to seekers.
        </Text>
      </View>

      {/* Time Picker - Android */}
      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={use24HourFormat}
          display="spinner"
          onChange={onTimePickerChange}
        />
      )}

      {/* Time Picker - iOS Modal */}
      {Platform.OS === "ios" && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={cancelIOSTime}>
                  <Text style={styles.timePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={confirmIOSTime}>
                  <Text style={styles.timePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={use24HourFormat}
                display="spinner"
                onChange={onTimePickerChange}
                style={styles.iosTimePicker}
                textColor={COLORS.text.primary}
              />
            </View>
          </View>
        </Modal>
      )}
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
        <Text style={styles.listingCount}>
          {listingCount}/{MAX_LISTINGS}
        </Text>
      </View>

      {checkingLimit ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking listing limit...</Text>
        </View>
      ) : listingCount >= MAX_LISTINGS ? (
        <View style={styles.limitReachedContainer}>
          <Icon name="exclamation-triangle" size="xl" color={COLORS.error} />
          <Text style={styles.limitReachedTitle}>Listing Limit Reached</Text>
          <Text style={styles.limitReachedText}>
            You have reached the maximum limit of {MAX_LISTINGS} parking spaces.
            Please delete or deactivate an existing listing to create a new one.
          </Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Progress */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((step) => (
              <View key={step} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    currentStep >= step && styles.progressDotActive,
                  ]}
                >
                  <Text style={styles.progressDotText}>{step}</Text>
                </View>
                {step < 4 && (
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

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            {currentStep < 4 ? (
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
                  <Text style={styles.submitButtonText}>Save as Draft</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: COLORS.text.primary,
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
    flexDirection: "row",
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  useLocationText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  rowInputs: {
    flexDirection: "row",
  },
  helperText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 8,
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
  listingCount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[600],
  },
  limitReachedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  limitReachedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 8,
  },
  limitReachedText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 22,
  },
  goBackButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  goBackButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  timeFormatToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  timeFormatLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  timeFormatOptions: {
    flexDirection: "row",
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  timeFormatOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  timeFormatOptionActive: {
    backgroundColor: COLORS.primary,
  },
  timeFormatOptionText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.gray[500],
  },
  timeFormatOptionTextActive: {
    color: COLORS.white,
  },
  dayRow: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  timeField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timeFieldText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: "500",
  },
  timeSeparator: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginHorizontal: 12,
    marginTop: 16,
  },
  draftNotice: {
    flexDirection: "row",
    backgroundColor: COLORS.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  draftNoticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 12,
    lineHeight: 20,
  },
  timePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  timePickerContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  timePickerCancel: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  timePickerDone: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  iosTimePicker: {
    height: 200,
    backgroundColor: COLORS.card,
  },
});

export default AddListingScreen;
