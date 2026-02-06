import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, addHours, isAfter, isBefore, addMinutes } from "date-fns";
import {
  createBooking,
  checkParkingAvailability,
  getVehicles,
  addVehicle,
} from "../api/services";
import { COLORS, PARKING_SIZES } from "../constants/config";
import Icon from "../components/Icon";

const BookingScreen = ({ route, navigation }) => {
  const { parking } = route.params;
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [hours, setHours] = useState(1);

  // Vehicle state
  const [garageVehicles, setGarageVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // null = manual entry
  const [vehicleInfo, setVehicleInfo] = useState({
    licensePlate: "",
    make: "",
    model: "",
    color: "",
  });
  const [saveToGarage, setSaveToGarage] = useState(false);

  const [specialRequests, setSpecialRequests] = useState("");

  // Date/Time picker state
  const [startTime, setStartTime] = useState(addMinutes(new Date(), 30)); // Default to 30 mins from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // 'date' or 'time'

  // Ref to store latest datetime for time picker (avoids stale state issues)
  const pendingDateTimeRef = useRef(startTime);

  const endTime = addHours(startTime, hours);
  const subtotal = parking.pricePerHour * hours;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  // Minimum start time is 15 minutes from now
  const minStartTime = addMinutes(new Date(), 15);

  // Fetch user's vehicles on mount
  useEffect(() => {
    fetchGarageVehicles();
  }, []);

  const fetchGarageVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const result = await getVehicles();
      const vehicles = result.data || [];
      setGarageVehicles(vehicles);

      // Auto-select default vehicle if available
      const defaultVehicle = vehicles.find((v) => v.isDefault);
      if (defaultVehicle) {
        setSelectedVehicleId(defaultVehicle._id);
        setVehicleInfo({
          licensePlate: defaultVehicle.licensePlate,
          make: defaultVehicle.make || "",
          model: defaultVehicle.model || "",
          color: defaultVehicle.color || "",
        });
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicleId(vehicle._id);
    setVehicleInfo({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make || "",
      model: vehicle.model || "",
      color: vehicle.color || "",
    });
    setSaveToGarage(false);
  };

  const handleManualEntry = () => {
    setSelectedVehicleId(null);
    setVehicleInfo({
      licensePlate: "",
      make: "",
      model: "",
      color: "",
    });
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case "small":
        return "car";
      case "suv":
        return "van";
      default:
        return "carSide";
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      // Don't process if user dismissed/cancelled the picker
      if (event.type === "dismissed") {
        return;
      }
    }

    if (selectedDate) {
      let newDateTime;

      if (Platform.OS === "ios") {
        // iOS datetime picker returns complete date+time, use it directly
        newDateTime = new Date(selectedDate);
      } else {
        // Android date-only picker: keep the time from current selection, just change the date
        const currentTime = pendingDateTimeRef.current;
        newDateTime = new Date(selectedDate);
        newDateTime.setHours(currentTime.getHours());
        newDateTime.setMinutes(currentTime.getMinutes());
      }

      // Ensure the selected datetime is not in the past
      if (isBefore(newDateTime, minStartTime)) {
        Alert.alert(
          "Invalid Time",
          "Please select a time at least 15 minutes from now.",
        );
        return;
      }

      // Update both state and ref
      pendingDateTimeRef.current = newDateTime;
      setStartTime(newDateTime);

      // On Android, show time picker after date selection
      if (Platform.OS === "android" && pickerMode === "date") {
        setTimeout(() => {
          setPickerMode("time");
          setShowTimePicker(true);
        }, 150);
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      // Don't process if user dismissed/cancelled the picker
      if (event.type === "dismissed") {
        return;
      }
    }

    if (selectedTime) {
      // Use ref to get the latest date (set by handleDateChange)
      const currentDateTime = pendingDateTimeRef.current;
      const newDateTime = new Date(currentDateTime);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());

      // Ensure the selected datetime is not in the past
      if (isBefore(newDateTime, minStartTime)) {
        Alert.alert(
          "Invalid Time",
          "Please select a time at least 15 minutes from now.",
        );
        return;
      }

      // Update both state and ref
      pendingDateTimeRef.current = newDateTime;
      setStartTime(newDateTime);
    }
  };

  const openDateTimePicker = () => {
    // Sync ref with current state before opening picker
    pendingDateTimeRef.current = startTime;
    setPickerMode("date");
    if (Platform.OS === "ios") {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleCheckAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const result = await checkParkingAvailability(
        parking._id,
        startTime.toISOString(),
        endTime.toISOString(),
      );

      if (result.available) {
        Alert.alert("Available", "This time slot is available!");
      } else {
        Alert.alert(
          "Not Available",
          result.message || "This time slot is not available",
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to check availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBooking = async () => {
    if (!vehicleInfo.licensePlate) {
      Alert.alert("Error", "Please enter your vehicle license plate");
      return;
    }

    try {
      setLoading(true);

      // Save vehicle to garage if requested
      if (saveToGarage && !selectedVehicleId) {
        try {
          await addVehicle({
            nickname:
              vehicleInfo.make && vehicleInfo.model
                ? `${vehicleInfo.make} ${vehicleInfo.model}`
                : vehicleInfo.licensePlate,
            type: parking.parkingSize,
            licensePlate: vehicleInfo.licensePlate,
            make: vehicleInfo.make,
            model: vehicleInfo.model,
            color: vehicleInfo.color,
          });
        } catch (error) {
          console.log("Failed to save vehicle to garage:", error);
          // Don't block booking if garage save fails
        }
      }

      const result = await createBooking({
        parkingSpaceId: parking._id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        vehicleInfo: {
          ...vehicleInfo,
          type: parking.parkingSize,
        },
        specialRequests,
      });

      navigation.replace("BookingConfirmation", { booking: result.data });
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrowLeft" size="md" color={COLORS.text.primary} />
          <Text style={styles.backButton}> Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Parking Summary */}
        <View style={styles.card}>
          <Text style={styles.parkingTitle}>{parking.title}</Text>
          <View style={styles.parkingAddressRow}>
            <Icon name="mapMarker" size="sm" color={COLORS.text.secondary} />
            <Text style={styles.parkingAddress}>
              {parking.location.address}
            </Text>
          </View>
          <View style={styles.parkingMeta}>
            <Text style={styles.parkingSize}>
              {PARKING_SIZES.find((s) => s.value === parking.parkingSize)?.icon}{" "}
              {
                PARKING_SIZES.find((s) => s.value === parking.parkingSize)
                  ?.label
              }
            </Text>
          </View>
        </View>

        {/* Duration Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          {/* Date/Time Selection */}
          <TouchableOpacity
            style={styles.dateTimeSelector}
            onPress={openDateTimePicker}
          >
            <View style={styles.dateTimeItem}>
              <Icon name="calendar" size="md" color={COLORS.primary} />
              <View style={styles.dateTimeTextContainer}>
                <Text style={styles.dateTimeLabel}>Start Date & Time</Text>
                <Text style={styles.dateTimeValue}>
                  {format(startTime, "EEE, MMM d, yyyy")}
                </Text>
                <Text style={styles.dateTimeValue}>
                  {format(startTime, "h:mm a")}
                </Text>
              </View>
            </View>
            <Icon name="chevronRight" size="sm" color={COLORS.gray[400]} />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationSelector}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setHours(Math.max(1, hours - 1))}
            >
              <Text style={styles.durationButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.durationDisplay}>
              <Text style={styles.durationValue}>{hours}</Text>
              <Text style={styles.durationUnit}>
                hour{hours > 1 ? "s" : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setHours(hours + 1)}
            >
              <Text style={styles.durationButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeDisplay}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Start</Text>
              <Text style={styles.timeValue}>
                {format(startTime, "MMM d, h:mm a")}
              </Text>
            </View>
            <Icon name="arrowRight" size="lg" color={COLORS.text.secondary} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>End</Text>
              <Text style={styles.timeValue}>
                {format(endTime, "MMM d, h:mm a")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkAvailabilityButton}
            onPress={handleCheckAvailability}
            disabled={checkingAvailability}
          >
            {checkingAvailability ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.checkAvailabilityText}>
                Check Availability
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* iOS Date Picker Modal */}
        {Platform.OS === "ios" && showDatePicker && (
          <Modal visible={showDatePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.pickerModal}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Select Date & Time</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startTime}
                  mode="datetime"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={minStartTime}
                  style={styles.iosPicker}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Android Date Picker */}
        {Platform.OS === "android" && showDatePicker && (
          <DateTimePicker
            value={startTime}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={minStartTime}
          />
        )}

        {/* Android Time Picker */}
        {Platform.OS === "android" && showTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* Vehicle Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          {/* Garage Section - Show saved vehicles */}
          {loadingVehicles ? (
            <View style={styles.loadingVehicles}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingVehiclesText}>
                Loading your garage...
              </Text>
            </View>
          ) : garageVehicles.length > 0 ? (
            <View style={styles.vehicleSelector}>
              <Text style={styles.vehicleSelectorLabel}>
                Select from your garage
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.vehicleList}
              >
                {garageVehicles.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle._id}
                    style={[
                      styles.vehicleOption,
                      selectedVehicleId === vehicle._id &&
                        styles.vehicleOptionSelected,
                    ]}
                    onPress={() => handleSelectVehicle(vehicle)}
                  >
                    <Icon
                      name={getVehicleIcon(vehicle.type)}
                      size="lg"
                      color={
                        selectedVehicleId === vehicle._id
                          ? COLORS.white
                          : COLORS.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.vehicleOptionName,
                        selectedVehicleId === vehicle._id &&
                          styles.vehicleOptionNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {vehicle.nickname || vehicle.licensePlate}
                    </Text>
                    <Text
                      style={[
                        styles.vehicleOptionPlate,
                        selectedVehicleId === vehicle._id &&
                          styles.vehicleOptionPlateSelected,
                      ]}
                    >
                      {vehicle.licensePlate}
                    </Text>
                    {vehicle.isDefault && (
                      <View
                        style={[
                          styles.defaultBadge,
                          selectedVehicleId === vehicle._id &&
                            styles.defaultBadgeSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.defaultBadgeText,
                            selectedVehicleId === vehicle._id &&
                              styles.defaultBadgeTextSelected,
                          ]}
                        >
                          Default
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {/* Add new vehicle option */}
                <TouchableOpacity
                  style={[
                    styles.vehicleOption,
                    styles.vehicleOptionAdd,
                    selectedVehicleId === null && styles.vehicleOptionSelected,
                  ]}
                  onPress={handleManualEntry}
                >
                  <Icon
                    name="plus"
                    size="lg"
                    color={
                      selectedVehicleId === null ? COLORS.white : COLORS.primary
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleOptionName,
                      {
                        color:
                          selectedVehicleId === null
                            ? COLORS.white
                            : COLORS.primary,
                      },
                    ]}
                  >
                    New Vehicle
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : null}

          {/* Manual Entry Fields - Show when no vehicle selected or no vehicles in garage */}
          {(selectedVehicleId === null || garageVehicles.length === 0) && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>License Plate *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ABC 1234"
                  placeholderTextColor={COLORS.gray[400]}
                  value={vehicleInfo.licensePlate}
                  onChangeText={(text) =>
                    setVehicleInfo({ ...vehicleInfo, licensePlate: text })
                  }
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.row}>
                <View
                  style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
                >
                  <Text style={styles.inputLabel}>Make</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Toyota"
                    placeholderTextColor={COLORS.gray[400]}
                    value={vehicleInfo.make}
                    onChangeText={(text) =>
                      setVehicleInfo({ ...vehicleInfo, make: text })
                    }
                  />
                </View>
                <View
                  style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}
                >
                  <Text style={styles.inputLabel}>Model</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Camry"
                    placeholderTextColor={COLORS.gray[400]}
                    value={vehicleInfo.model}
                    onChangeText={(text) =>
                      setVehicleInfo({ ...vehicleInfo, model: text })
                    }
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Silver"
                  placeholderTextColor={COLORS.gray[400]}
                  value={vehicleInfo.color}
                  onChangeText={(text) =>
                    setVehicleInfo({ ...vehicleInfo, color: text })
                  }
                />
              </View>

              {/* Save to Garage Checkbox */}
              <TouchableOpacity
                style={styles.saveToGarageRow}
                onPress={() => setSaveToGarage(!saveToGarage)}
              >
                <View
                  style={[
                    styles.checkbox,
                    saveToGarage && styles.checkboxChecked,
                  ]}
                >
                  {saveToGarage && (
                    <Icon name="check" size="xs" color={COLORS.white} />
                  )}
                </View>
                <Text style={styles.saveToGarageText}>
                  Save this vehicle to my garage
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Show selected vehicle details */}
          {selectedVehicleId !== null && garageVehicles.length > 0 && (
            <View style={styles.selectedVehicleInfo}>
              <View style={styles.selectedVehicleRow}>
                <Text style={styles.selectedVehicleLabel}>License Plate:</Text>
                <Text style={styles.selectedVehicleValue}>
                  {vehicleInfo.licensePlate}
                </Text>
              </View>
              {vehicleInfo.make && (
                <View style={styles.selectedVehicleRow}>
                  <Text style={styles.selectedVehicleLabel}>Vehicle:</Text>
                  <Text style={styles.selectedVehicleValue}>
                    {[vehicleInfo.make, vehicleInfo.model, vehicleInfo.color]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Special Requests */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special instructions or requests..."
            placeholderTextColor={COLORS.gray[400]}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Summary</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              ₹{parking.pricePerHour} x {hours} hour{hours > 1 ? "s" : ""}
            </Text>
            <Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service fee</Text>
            <Text style={styles.priceValue}>₹{serviceFee.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            loading && styles.confirmButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmButtonText}>
              Confirm Booking - ₹{total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  parkingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  parkingAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  parkingAddress: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginLeft: 6,
    flex: 1,
  },
  parkingMeta: {
    marginTop: 8,
  },
  parkingSize: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  dateTimeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  dateTimeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeTextContainer: {
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  pickerCancel: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  iosPicker: {
    height: 200,
  },
  durationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  durationButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.gray[100],
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  durationButtonText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  durationDisplay: {
    alignItems: "center",
    marginHorizontal: 32,
  },
  durationValue: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  durationUnit: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  timeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.gray[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  timeArrow: {
    fontSize: 16,
    color: COLORS.gray[400],
    marginHorizontal: 8,
  },
  checkAvailabilityButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  checkAvailabilityText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  // Vehicle selector styles
  loadingVehicles: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  loadingVehiclesText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  vehicleSelector: {
    marginBottom: 16,
  },
  vehicleSelectorLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  vehicleList: {
    flexDirection: "row",
  },
  vehicleOption: {
    width: 100,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: COLORS.gray[100],
  },
  vehicleOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  vehicleOptionAdd: {
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
  },
  vehicleOptionName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginTop: 6,
    textAlign: "center",
  },
  vehicleOptionNameSelected: {
    color: COLORS.white,
  },
  vehicleOptionPlate: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  vehicleOptionPlateSelected: {
    color: COLORS.white,
    opacity: 0.8,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  defaultBadgeSelected: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  defaultBadgeText: {
    fontSize: 8,
    fontWeight: "600",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  defaultBadgeTextSelected: {
    color: COLORS.white,
  },
  saveToGarageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  saveToGarageText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  selectedVehicleInfo: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  selectedVehicleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  selectedVehicleLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  selectedVehicleValue: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default BookingScreen;
