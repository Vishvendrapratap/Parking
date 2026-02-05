import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  searchNearbyParking,
  getPlaceAutocomplete,
  getPlaceDetails,
} from "../api/services";
import { useLocation } from "../hooks/useLocation";
import { COLORS, PARKING_SIZES } from "../constants/config";
import Icon from "../components/Icon";
import Header from "../components/Header";

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

  // Location search state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const sessionTokenRef = useRef(Date.now().toString());

  // Fetch autocomplete suggestions when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Always show the suggestions panel when typing
      setShowSuggestions(true);
      setLoadingSuggestions(true);

      try {
        console.log("=== Fetching suggestions for:", searchQuery, "===");
        const result = await getPlaceAutocomplete(
          searchQuery,
          sessionTokenRef.current,
        );
        console.log(
          "=== Autocomplete API result:",
          JSON.stringify(result),
          "===",
        );

        if (result && result.success && Array.isArray(result.data)) {
          console.log("Setting", result.data.length, "suggestions");
          setSuggestions(result.data);
        } else {
          console.log("Invalid response format or no suggestions");
          setSuggestions([]);
        }
      } catch (error) {
        console.error("=== Autocomplete error:", error, "===");
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Debounce
    const timeoutId = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle selecting a place suggestion
  const handleSelectPlace = async (suggestion) => {
    try {
      console.log("Selected place:", suggestion);
      Keyboard.dismiss();
      setShowSuggestions(false);
      setSuggestions([]);
      setSearchQuery(suggestion.description);
      setLoading(true);

      // Get place details to get coordinates
      console.log("Fetching place details for:", suggestion.placeId);
      const placeResult = await getPlaceDetails(suggestion.placeId);
      console.log("Place details result:", JSON.stringify(placeResult));

      if (placeResult && placeResult.success && placeResult.data) {
        const { coordinates } = placeResult.data;
        console.log("Coordinates:", coordinates);
        // coordinates are [lng, lat] - MongoDB format
        const searchCoords = {
          latitude: coordinates[1],
          longitude: coordinates[0],
        };

        setSelectedLocation({
          ...searchCoords,
          address: suggestion.description,
        });

        // Generate new session token for next search
        sessionTokenRef.current = Date.now().toString();

        // Search for parking near this location
        console.log("Searching parking near:", searchCoords);
        const result = await searchNearbyParking(
          searchCoords.latitude,
          searchCoords.longitude,
          20000, // 20km radius
          {
            parkingSize: filters.parkingSize,
            maxPrice: filters.maxPrice,
          },
        );
        console.log(
          "Parking search result:",
          result.data?.length,
          "spaces found",
        );
        setResults(result.data || []);

        if (!result.data || result.data.length === 0) {
          Alert.alert(
            "No Parking Found",
            `No parking spaces found within 20km of ${suggestion.mainText}. Try a different location.`,
          );
        }
      } else {
        Alert.alert(
          "Error",
          "Could not get location details. Please try again.",
        );
      }
    } catch (error) {
      console.error("Select place error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    try {
      Keyboard.dismiss();
      setShowSuggestions(false);
      setLoading(true);

      let coords = selectedLocation || location;

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
  }, [location, selectedLocation, filters]);

  // Clear location selection
  const handleClearLocation = () => {
    setSearchQuery("");
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setResults([]);
  };

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
            <Icon name="parking" size="2xl" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.parkingImage}>
            <Icon name="parking" size="2xl" color={COLORS.primary} />
          </View>
        )}
      </View>
      <View style={styles.parkingInfo}>
        <Text style={styles.parkingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.parkingAddressRow}>
          <Icon name="mapMarker" size="xs" color={COLORS.text.secondary} />
          <Text style={styles.parkingAddress} numberOfLines={1}>
            {item.location.address}
          </Text>
        </View>
        <View style={styles.parkingMeta}>
          <Text style={styles.parkingSize}>
            {PARKING_SIZES.find((s) => s.value === item.parkingSize)?.label}
          </Text>
          <View style={styles.parkingRatingRow}>
            <Icon name="star" size="xs" color={COLORS.accent} />
            <Text style={styles.parkingRating}>
              {item.rating?.toFixed(1) || "New"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>₹{item.pricePerHour}</Text>
        <Text style={styles.priceUnit}>/hr</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with Logo */}
      <Header showLogo={true} />

      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="mapMarker" size="md" color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, state or place..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onFocus={() => {
              if (searchQuery.length >= 2 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearLocation}
              style={styles.clearButton}
            >
              <Icon name="close" size="sm" color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
          {loadingSuggestions && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setShowFilters(!showFilters);
            setShowSuggestions(false);
          }}
        >
          <Icon name="filter" size="lg" color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Location Suggestions - shown when typing */}
      {searchQuery.length >= 2 && showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>
            {loadingSuggestions ? "Searching..." : "Location Suggestions"}
          </Text>

          {loadingSuggestions ? (
            <View style={styles.suggestionLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.suggestionLoadingText}>
                Finding locations...
              </Text>
            </View>
          ) : suggestions.length > 0 ? (
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
            >
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.placeId}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectPlace(item)}
                >
                  <Icon name="mapMarker" size="md" color={COLORS.primary} />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionMainText} numberOfLines={1}>
                      {item.mainText}
                    </Text>
                    <Text
                      style={styles.suggestionSecondaryText}
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  </View>
                  <Icon
                    name="chevronRight"
                    size="sm"
                    color={COLORS.gray[300]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noSuggestionsContainer}>
              <Text style={styles.noSuggestionsText}>
                No locations found for "{searchQuery}"
              </Text>
              <Text style={styles.noSuggestionsSubtext}>
                Try a different search term
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Selected Location Badge */}
      {selectedLocation && !showSuggestions && (
        <View style={styles.selectedLocationBadge}>
          <Icon name="mapMarker" size="sm" color={COLORS.primary} />
          <Text style={styles.selectedLocationText} numberOfLines={1}>
            {selectedLocation.address}
          </Text>
          <TouchableOpacity onPress={handleClearLocation}>
            <Icon name="close" size="sm" color={COLORS.gray[500]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Filters */}
      {showFilters && !showSuggestions && (
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
            {[50, 100, 200, 500].map((price) => (
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
                  ₹{price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleSearch}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Near Me Button - only show when not showing suggestions */}
      {!showSuggestions && (
        <TouchableOpacity
          style={styles.searchNearMeButton}
          onPress={handleSearch}
        >
          <Icon name="mapMarker" size="md" color={COLORS.white} />
          <Text style={styles.searchNearMeText}> Search Near Me</Text>
        </TouchableOpacity>
      )}

      {/* Results Count Header */}
      {!loading &&
        !showSuggestions &&
        results.length > 0 &&
        selectedLocation && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {results.length} parking space{results.length !== 1 ? "s" : ""}{" "}
              found
            </Text>
            <Text style={styles.resultsLocation}>
              near {selectedLocation.address?.split(",")[0]}
            </Text>
          </View>
        )}

      {/* Results - only show when not showing suggestions */}
      {!showSuggestions &&
        (loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            {selectedLocation && (
              <Text style={styles.loadingText}>
                Searching parking near {selectedLocation.address?.split(",")[0]}
                ...
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={renderParkingItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon
                  name={selectedLocation ? "mapMarker" : "search"}
                  size="4xl"
                  color={COLORS.gray[300]}
                />
                <Text style={styles.emptyText}>
                  {selectedLocation
                    ? "No parking spaces found nearby"
                    : "Search for a location"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {selectedLocation
                    ? `No parking available within 10km of ${selectedLocation.address?.split(",")[0]}. Try a different location.`
                    : "Enter a city, area, or landmark to find parking nearby"}
                </Text>
              </View>
            }
          />
        ))}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gray[50],
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
    paddingHorizontal: 8,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: COLORS.gray[50],
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIcon: {
    fontSize: 20,
  },
  // Location suggestions styles
  suggestionsContainer: {
    backgroundColor: COLORS.surface,
    paddingBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: COLORS.gray[50],
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  suggestionLoadingText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  noSuggestionsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  noSuggestionsText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  noSuggestionsSubtext: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  // Selected location badge
  selectedLocationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
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
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary + "30",
    borderColor: COLORS.primary,
  },
  filterOptionIcon: {
    marginRight: 4,
  },
  filterOptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
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
    flexDirection: "row",
    justifyContent: "center",
  },
  searchNearMeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  resultsLocation: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  resultsList: {
    padding: 16,
  },
  parkingItem: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
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
    backgroundColor: COLORS.gray[50],
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
    color: COLORS.text.primary,
  },
  parkingAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  parkingAddress: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  parkingMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  parkingSize: {
    fontSize: 12,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  parkingRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  parkingRating: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
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
    color: COLORS.text.secondary,
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
    color: COLORS.text.primary,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },
});

export default SearchScreen;
