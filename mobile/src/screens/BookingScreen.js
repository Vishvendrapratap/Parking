import React, { useState } from "react";
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
import { createBooking, checkParkingAvailability } from "../api/services";
import { COLORS, PARKING_SIZES } from "../constants/config";
import Icon from "../components/Icon";

const BookingScreen = ({ route, navigation }) => {
  const { parking } = route.params;
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [hours, setHours] = useState(1);
  const [vehicleInfo, setVehicleInfo] = useState({
    licensePlate: "",
    make: "",
    model: "",
    color: "",
  });
  const [specialRequests, setSpecialRequests] = useState("");

  // Date/Time picker state
  const [startTime, setStartTime] = useState(addMinutes(new Date(), 30)); // Default to 30 mins from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // 'date' or 'time'

  const endTime = addHours(startTime, hours);
  const subtotal = parking.pricePerHour * hours;
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  // Minimum start time is 15 minutes from now
  const minStartTime = addMinutes(new Date(), 15);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      // Keep the time part from current startTime, just change the date
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(startTime.getHours());
      newDateTime.setMinutes(startTime.getMinutes());

      // Ensure the selected datetime is not in the past
      if (isBefore(newDateTime, minStartTime)) {
        Alert.alert(
          "Invalid Time",
          "Please select a time at least 15 minutes from now.",
        );
        return;
      }

      setStartTime(newDateTime);

      // On Android, show time picker after date selection
      if (Platform.OS === "android" && pickerMode === "date") {
        setTimeout(() => {
          setPickerMode("time");
          setShowTimePicker(true);
        }, 100);
      }
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (selectedTime) {
      const newDateTime = new Date(startTime);
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

      setStartTime(newDateTime);
    }
  };

  const openDateTimePicker = () => {
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
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
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
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
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
