import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchNearbyParking } from "../api/services";
import { useLocation } from "../hooks/useLocation";
import { COLORS, PARKING_SIZES } from "../constants/config";

const SearchScreen = ({ navigation }) => {
  const { location, getCurrentLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    parkingSize: null,
    maxPrice: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true);
      let coords = location;

      if (!coords) {
        coords = await getCurrentLocation();
      }

      if (coords) {
        const result = await searchNearbyParking(
          coords.latitude,
          coords.longitude,
          10000,
          {
            parkingSize: filters.parkingSize,
            maxPrice: filters.maxPrice,
          },
        );
        setResults(result.data || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [location, filters]);

  const renderParkingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.parkingItem}
      onPress={() =>
        navigation.navigate("ParkingDetails", { parkingId: item._id })
      }
    >
      <View style={styles.parkingImageContainer}>
        {item.images?.[0] ? (
          <View style={styles.parkingImage}>
            <Text style={styles.placeholderIcon}>🅿️</Text>
          </View>
        ) : (
          <View style={styles.parkingImage}>
            <Text style={styles.placeholderIcon}>🅿️</Text>
          </View>
        )}
      </View>
      <View style={styles.parkingInfo}>
        <Text style={styles.parkingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.parkingAddress} numberOfLines={1}>
          📍 {item.location.address}
        </Text>
        <View style={styles.parkingMeta}>
          <Text style={styles.parkingSize}>
            {PARKING_SIZES.find((s) => s.value === item.parkingSize)?.label}
          </Text>
          <Text style={styles.parkingRating}>
            ⭐ {item.rating?.toFixed(1) || "New"}
          </Text>
        </View>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>${item.pricePerHour}</Text>
        <Text style={styles.priceUnit}>/hr</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for parking..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Vehicle Size</Text>
          <View style={styles.filterOptions}>
            {PARKING_SIZES.map((size) => (
              <TouchableOpacity
                key={size.value}
                style={[
                  styles.filterOption,
                  filters.parkingSize === size.value &&
                    styles.filterOptionActive,
                ]}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    parkingSize:
                      prev.parkingSize === size.value ? null : size.value,
                  }))
                }
              >
                <Text style={styles.filterOptionIcon}>{size.icon}</Text>
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.parkingSize === size.value &&
                      styles.filterOptionTextActive,
                  ]}
                >
                  {size.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterTitle}>Max Price (per hour)</Text>
          <View style={styles.filterOptions}>
            {[5, 10, 20, 50].map((price) => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.filterOption,
                  filters.maxPrice === price && styles.filterOptionActive,
                ]}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    maxPrice: prev.maxPrice === price ? null : price,
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.maxPrice === price && styles.filterOptionTextActive,
                  ]}
                >
                  ${price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Near Me Button */}
      <TouchableOpacity
        style={styles.searchNearMeButton}
        onPress={handleSearch}
      >
        <Text style={styles.searchNearMeText}>📍 Search Near Me</Text>
      </TouchableOpacity>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderParkingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No parking spaces found</Text>
              <Text style={styles.emptySubtext}>
                Try searching near your location or adjusting filters
              </Text>
            </View>
          }
        />
      )}
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray[800],
  },
  filterButton: {
    backgroundColor: COLORS.gray[100],
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIcon: {
    fontSize: 20,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray[700],
    marginBottom: 8,
    marginTop: 8,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary + "20",
    borderColor: COLORS.primary,
  },
  filterOptionIcon: {
    marginRight: 4,
  },
  filterOptionText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  filterOptionTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  searchNearMeButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  searchNearMeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsList: {
    padding: 16,
  },
  parkingItem: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  parkingImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  parkingImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 32,
  },
  parkingInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  parkingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  parkingAddress: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  parkingMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  parkingSize: {
    fontSize: 12,
    color: COLORS.gray[600],
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  parkingRating: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  priceContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: "center",
  },
});

export default SearchScreen;
