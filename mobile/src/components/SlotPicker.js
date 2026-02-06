import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { format, parseISO, isSameDay } from "date-fns";
import { getWeeklySlots } from "../api/services";
import { COLORS } from "../constants/config";
import Icon from "./Icon";

const DEFAULT_MINIMUM_SLOTS = 8; // 4 hours = 8 x 30-minute slots

const SlotPicker = ({ parkingId, onSlotsSelected, pricePerHour }) => {
  const [loading, setLoading] = useState(true);
  const [weeklySlots, setWeeklySlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (parkingId) {
      fetchSlots();
    }
  }, [parkingId]);

  const fetchSlots = async () => {
    if (!parkingId) {
      setError("Parking ID is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getWeeklySlots(parkingId);
      setWeeklySlots(result.data?.weeklySlots || []);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setError("Failed to load availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotPress = (slot, slotIndex) => {
    if (!slot || !slot.isAvailable) return;

    const daySlots = weeklySlots?.[selectedDay]?.slots || [];

    // If no selection yet, this is the first slot (start of range)
    if (!selectedSlots || selectedSlots.length === 0) {
      setSelectedSlots([slot]);
      return;
    }

    // If only one slot selected, this click defines the range end
    if (selectedSlots.length === 1) {
      const firstIdx = daySlots.findIndex(
        (s) => s.start === selectedSlots[0].start,
      );

      // Clicking the same slot deselects it
      if (slotIndex === firstIdx) {
        setSelectedSlots([]);
        return;
      }

      // Determine range bounds (first to last, regardless of click order)
      const startIdx = Math.min(firstIdx, slotIndex);
      const endIdx = Math.max(firstIdx, slotIndex);

      // Get all slots in range and check if they're all available
      const rangeSlots = daySlots.slice(startIdx, endIdx + 1);
      const unavailableSlots = rangeSlots.filter((s) => !s.isAvailable);

      if (unavailableSlots.length > 0) {
        Alert.alert(
          "Unavailable Slots",
          "Some slots in this range are not available. Please select a different range.",
        );
        return;
      }

      // All slots in range are available, select them all
      setSelectedSlots(rangeSlots);
      return;
    }

    // If multiple slots already selected, clicking resets the selection
    const isClickedSlotSelected = selectedSlots.some(
      (s) => s.start === slot.start,
    );

    if (isClickedSlotSelected) {
      // Clicking a selected slot clears selection and starts fresh
      setSelectedSlots([]);
    } else {
      // Clicking outside the selection starts a new range
      setSelectedSlots([slot]);
    }
  };

  // Get the effective selection (same as selectedSlots now since we select the full range)
  const getSelectionRange = () => {
    return selectedSlots || [];
  };

  // Memoize the effective selection to prevent infinite loops
  const effectiveSelection = useMemo(() => {
    return getSelectionRange() || [];
  }, [selectedSlots, selectedDay, weeklySlots]);

  // Calculate available slots for current day (for validation)
  const currentDayAvailableSlots = useMemo(() => {
    const dayData = weeklySlots?.[selectedDay];
    if (!dayData?.slots) return 0;
    return dayData.slots.filter((s) => s?.isAvailable).length;
  }, [weeklySlots, selectedDay]);

  // Effective minimum for current day
  const currentEffectiveMinimum = useMemo(() => {
    return Math.min(DEFAULT_MINIMUM_SLOTS, currentDayAvailableSlots);
  }, [currentDayAvailableSlots]);

  // Notify parent of selection changes
  useEffect(() => {
    if (
      effectiveSelection &&
      effectiveSelection.length > 0 &&
      weeklySlots?.[selectedDay]
    ) {
      const startTime = effectiveSelection[0]?.start;
      const endTime = effectiveSelection[effectiveSelection.length - 1]?.end;
      const hours = effectiveSelection.length / 2;

      onSlotsSelected({
        date: weeklySlots[selectedDay].date,
        startTime,
        endTime,
        slotCount: effectiveSelection.length,
        hours,
        isValid:
          effectiveSelection.length >= currentEffectiveMinimum &&
          effectiveSelection.length > 0,
        minimumSlots: currentEffectiveMinimum,
      });
    } else {
      onSlotsSelected(null);
    }
  }, [
    effectiveSelection,
    selectedDay,
    onSlotsSelected,
    currentEffectiveMinimum,
  ]);

  const handleDayChange = (index) => {
    setSelectedDay(index);
    setSelectedSlots([]);
  };

  const isSlotSelected = (slot) => {
    return effectiveSelection?.some((s) => s.start === slot?.start) || false;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation" size="xl" color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSlots}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!weeklySlots || weeklySlots.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="calendar" size="xl" color={COLORS.gray[400]} />
        <Text style={styles.errorText}>No availability data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSlots}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentDayData = weeklySlots[selectedDay];
  const daySlots = currentDayData?.slots || [];

  // Calculate total available slots for the day
  const totalAvailableSlots = daySlots.filter((s) => s?.isAvailable).length;

  // Effective minimum: 8 slots (4 hours) or total available if less than 8
  const effectiveMinimum = Math.min(DEFAULT_MINIMUM_SLOTS, totalAvailableSlots);

  return (
    <View style={styles.container}>
      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {(weeklySlots || []).map((day, index) => {
          const isToday = index === 0;
          const isSelected = index === selectedDay;
          const hasAvailable = (day?.availableSlots || 0) > 0;

          return (
            <TouchableOpacity
              key={day?.date || index}
              style={[
                styles.dayItem,
                isSelected && styles.dayItemSelected,
                !hasAvailable && styles.dayItemUnavailable,
              ]}
              onPress={() => handleDayChange(index)}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayNameSelected,
                  !hasAvailable && styles.dayNameUnavailable,
                ]}
              >
                {isToday ? "Today" : (day?.dayName || "").slice(0, 3)}
              </Text>
              <Text
                style={[
                  styles.dayDate,
                  isSelected && styles.dayDateSelected,
                  !hasAvailable && styles.dayDateUnavailable,
                ]}
              >
                {day?.date ? format(parseISO(day.date + "T00:00:00"), "d") : ""}
              </Text>
              {hasAvailable ? (
                <Text
                  style={[
                    styles.slotsCount,
                    isSelected && styles.slotsCountSelected,
                  ]}
                >
                  {day?.availableSlots || 0} slots
                </Text>
              ) : (
                <Text style={styles.slotsUnavailable}>Full</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Minimum booking info */}
      <View style={styles.infoBar}>
        <Icon name="info" size="sm" color={COLORS.info} />
        <Text style={styles.infoText}>
          Tap first slot, then tap last slot to select range
          {effectiveMinimum >= DEFAULT_MINIMUM_SLOTS
            ? " (min 4 hours)"
            : effectiveMinimum > 0
              ? ` (min ${effectiveMinimum / 2} hours available)`
              : ""}
        </Text>
      </View>

      {/* Slot Grid */}
      {daySlots && daySlots.length > 0 ? (
        <ScrollView
          style={styles.slotsContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.slotsGrid}>
            {daySlots.map((slot, index) => {
              if (!slot) return null;
              const isSelected = isSlotSelected(slot);
              const startTime = slot.start
                ? format(parseISO(slot.start), "h:mm a")
                : "";

              return (
                <TouchableOpacity
                  key={slot.start || index}
                  style={[
                    styles.slotItem,
                    slot.isPast && styles.slotPast,
                    slot.isBooked && styles.slotBooked,
                    isSelected && styles.slotSelected,
                    !slot.isAvailable && styles.slotUnavailable,
                  ]}
                  onPress={() => handleSlotPress(slot, index)}
                  disabled={!slot.isAvailable}
                >
                  <Text
                    style={[
                      styles.slotTime,
                      slot.isPast && styles.slotTimePast,
                      slot.isBooked && styles.slotTimeBooked,
                      isSelected && styles.slotTimeSelected,
                    ]}
                  >
                    {startTime}
                  </Text>
                  {slot.isBooked && (
                    <Icon name="lock" size="xs" color={COLORS.gray[400]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.noSlotsContainer}>
          <Icon name="calendar" size="xl" color={COLORS.gray[400]} />
          <Text style={styles.noSlotsText}>
            No slots available for this day
          </Text>
        </View>
      )}

      {/* Selection Summary */}
      {effectiveSelection &&
        effectiveSelection.length > 0 &&
        effectiveSelection[0] && (
          <View style={styles.selectionSummary}>
            {effectiveSelection.length === 1 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Start Time</Text>
                <Text style={styles.summaryValue}>
                  {format(parseISO(effectiveSelection[0].start), "h:mm a")}
                </Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Selected Time</Text>
                <Text style={styles.summaryValue}>
                  {format(parseISO(effectiveSelection[0].start), "h:mm a")} -{" "}
                  {format(
                    parseISO(
                      effectiveSelection[effectiveSelection.length - 1]?.end ||
                        effectiveSelection[0].end,
                    ),
                    "h:mm a",
                  )}
                </Text>
              </View>
            )}
            {effectiveSelection.length === 1 ? (
              <View style={styles.warningRow}>
                <Icon name="arrowRight" size="sm" color={COLORS.info} />
                <Text style={[styles.warningText, { color: COLORS.info }]}>
                  Now tap the end slot to complete your selection
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>
                    {effectiveSelection.length / 2} hours (
                    {effectiveSelection.length} slots)
                  </Text>
                </View>
                {effectiveSelection.length < effectiveMinimum &&
                  effectiveMinimum > 0 && (
                    <View style={styles.warningRow}>
                      <Icon
                        name="exclamation"
                        size="sm"
                        color={COLORS.warning}
                      />
                      <Text style={styles.warningText}>
                        Select at least{" "}
                        {effectiveMinimum - effectiveSelection.length} more
                        slot(s) (minimum {effectiveMinimum / 2} hours)
                      </Text>
                    </View>
                  )}
                {pricePerHour &&
                  effectiveSelection.length >= effectiveMinimum &&
                  effectiveMinimum > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Estimated Cost</Text>
                      <Text style={styles.summaryPrice}>
                        ₹{(effectiveSelection.length / 2) * pricePerHour}
                      </Text>
                    </View>
                  )}
              </>
            )}
          </View>
        )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendAvailable]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendBooked]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendPast]} />
          <Text style={styles.legendText}>Past</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  daySelector: {
    maxHeight: 90,
  },
  daySelectorContent: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  dayItem: {
    width: 70,
    padding: 10,
    marginHorizontal: 4,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayItemUnavailable: {
    opacity: 0.5,
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.secondary,
  },
  dayNameSelected: {
    color: COLORS.white,
  },
  dayNameUnavailable: {
    color: COLORS.gray[400],
  },
  dayDate: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginVertical: 2,
  },
  dayDateSelected: {
    color: COLORS.white,
  },
  dayDateUnavailable: {
    color: COLORS.gray[400],
  },
  slotsCount: {
    fontSize: 10,
    color: COLORS.success,
  },
  slotsCountSelected: {
    color: COLORS.white,
    opacity: 0.9,
  },
  slotsUnavailable: {
    fontSize: 10,
    color: COLORS.error,
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.info + "15",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.info,
    flex: 1,
  },
  slotsContainer: {
    maxHeight: 250,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 4,
  },
  slotItem: {
    width: "23%",
    margin: "1%",
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    flexDirection: "row",
  },
  slotPast: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.5,
  },
  slotBooked: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[200],
  },
  slotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotUnavailable: {
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  slotTimePast: {
    color: COLORS.gray[400],
  },
  slotTimeBooked: {
    color: COLORS.gray[400],
  },
  slotTimeSelected: {
    color: COLORS.white,
  },
  noSlotsContainer: {
    padding: 40,
    alignItems: "center",
  },
  noSlotsText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  selectionSummary: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warning + "15",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.warning,
    flex: 1,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 4,
  },
  legendAvailable: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  legendSelected: {
    backgroundColor: COLORS.primary,
  },
  legendBooked: {
    backgroundColor: COLORS.gray[100],
  },
  legendPast: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.5,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
});

export default SlotPicker;
