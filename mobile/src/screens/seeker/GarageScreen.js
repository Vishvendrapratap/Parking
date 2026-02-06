import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  setDefaultVehicle,
} from "../../api/services";
import { COLORS, PARKING_SIZES } from "../../constants/config";
import Icon from "../../components/Icon";
import Header from "../../components/Header";

const VEHICLE_TYPES = PARKING_SIZES.map((size) => ({
  value: size.value,
  label: size.label,
  icon: size.icon,
}));

const GarageScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    nickname: "",
    type: "sedan",
    licensePlate: "",
    make: "",
    model: "",
    color: "",
  });

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, []),
  );

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const result = await getVehicles();
      setVehicles(result.data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      Alert.alert("Error", "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nickname: "",
      type: "sedan",
      licensePlate: "",
      make: "",
      model: "",
      color: "",
    });
    setEditingVehicle(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setFormData({
      nickname: vehicle.nickname || "",
      type: vehicle.type || "sedan",
      licensePlate: vehicle.licensePlate || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      color: vehicle.color || "",
    });
    setEditingVehicle(vehicle);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.licensePlate.trim()) {
      Alert.alert("Error", "License plate is required");
      return;
    }

    if (!formData.nickname.trim()) {
      // Auto-generate nickname from make/model or license plate
      const autoNickname =
        formData.make && formData.model
          ? `${formData.make} ${formData.model}`
          : formData.licensePlate;
      formData.nickname = autoNickname;
    }

    try {
      setSaving(true);
      if (editingVehicle) {
        await updateVehicle(editingVehicle._id, formData);
        Alert.alert("Success", "Vehicle updated successfully");
      } else {
        await addVehicle(formData);
        Alert.alert("Success", "Vehicle added to garage");
      }
      closeModal();
      fetchVehicles();
    } catch (error) {
      console.error("Error saving vehicle:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to save vehicle",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (vehicle) => {
    Alert.alert(
      "Delete Vehicle",
      `Are you sure you want to remove "${vehicle.nickname || vehicle.licensePlate}" from your garage?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVehicle(vehicle._id);
              fetchVehicles();
            } catch (error) {
              Alert.alert("Error", "Failed to delete vehicle");
            }
          },
        },
      ],
    );
  };

  const handleSetDefault = async (vehicle) => {
    if (vehicle.isDefault) return;
    try {
      await setDefaultVehicle(vehicle._id);
      fetchVehicles();
    } catch (error) {
      Alert.alert("Error", "Failed to set default vehicle");
    }
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

  const renderVehicleCard = (vehicle) => (
    <View key={vehicle._id} style={styles.vehicleCard}>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleIconContainer}>
          <Icon
            name={getVehicleIcon(vehicle.type)}
            size="xl"
            color={vehicle.isDefault ? COLORS.primary : COLORS.text.secondary}
          />
        </View>
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleNameRow}>
            <Text style={styles.vehicleName}>
              {vehicle.nickname || vehicle.licensePlate}
            </Text>
            {vehicle.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
          {(vehicle.make || vehicle.model) && (
            <Text style={styles.vehicleDetails}>
              {[vehicle.make, vehicle.model, vehicle.color]
                .filter(Boolean)
                .join(" • ")}
            </Text>
          )}
          <Text style={styles.vehicleType}>
            {VEHICLE_TYPES.find((t) => t.value === vehicle.type)?.label ||
              "Sedan"}
          </Text>
        </View>
      </View>

      <View style={styles.vehicleActions}>
        {!vehicle.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(vehicle)}
          >
            <Icon name="star" size="sm" color={COLORS.accent} />
            <Text style={styles.actionButtonText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(vehicle)}
        >
          <Icon name="edit" size="sm" color={COLORS.info} />
          <Text style={[styles.actionButtonText, { color: COLORS.info }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(vehicle)}
        >
          <Icon name="trash" size="sm" color={COLORS.error} />
          <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="car" size="xl" color={COLORS.gray[400]} />
      </View>
      <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add your vehicles to quickly select them when booking parking spots
      </Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={openAddModal}>
        <Icon name="plus" size="sm" color={COLORS.white} />
        <Text style={styles.addFirstButtonText}>Add Your First Vehicle</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrowLeft" size="md" color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Garage</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Icon name="plus" size="md" color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : vehicles.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>
            {vehicles.length} Vehicle{vehicles.length !== 1 ? "s" : ""}
          </Text>
          {vehicles.map(renderVehicleCard)}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size="md" color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Nickname */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nickname (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., My Honda"
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.nickname}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nickname: text })
                  }
                />
              </View>

              {/* Vehicle Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Type</Text>
                <View style={styles.typeSelector}>
                  {VEHICLE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeOption,
                        formData.type === type.value &&
                          styles.typeOptionSelected,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, type: type.value })
                      }
                    >
                      <Icon
                        name={type.icon}
                        size="lg"
                        color={
                          formData.type === type.value
                            ? COLORS.white
                            : COLORS.text.secondary
                        }
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          formData.type === type.value &&
                            styles.typeOptionTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* License Plate */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>License Plate *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MH 01 AB 1234"
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.licensePlate}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      licensePlate: text.toUpperCase(),
                    })
                  }
                  autoCapitalize="characters"
                />
              </View>

              {/* Make & Model */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Make</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Toyota"
                    placeholderTextColor={COLORS.gray[400]}
                    value={formData.make}
                    onChangeText={(text) =>
                      setFormData({ ...formData, make: text })
                    }
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Model</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Camry"
                    placeholderTextColor={COLORS.gray[400]}
                    value={formData.model}
                    onChangeText={(text) =>
                      setFormData({ ...formData, model: text })
                    }
                  />
                </View>
              </View>

              {/* Color */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Silver"
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.color}
                  onChangeText={(text) =>
                    setFormData({ ...formData, color: text })
                  }
                />
              </View>
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingVehicle ? "Save Changes" : "Add Vehicle"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  backButtonContainer: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  vehicleHeader: {
    flexDirection: "row",
  },
  vehicleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.gray[50],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  vehiclePlate: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  vehicleDetails: {
    fontSize: 12,
    color: COLORS.text.light,
    marginTop: 2,
  },
  vehicleType: {
    fontSize: 12,
    color: COLORS.text.light,
    marginTop: 2,
  },
  vehicleActions: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    padding: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.accent,
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray[50],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  rowInputs: {
    flexDirection: "row",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeOption: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  typeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: "center",
  },
  typeOptionTextSelected: {
    color: COLORS.white,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GarageScreen;
