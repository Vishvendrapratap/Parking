import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { parkingService } from "../api/services";
import toast from "react-hot-toast";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    query: searchParams.get("q") || "",
    minPrice: "",
    maxPrice: "",
    vehicleType: "",
    amenities: [],
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const amenitiesList = [
    { id: "covered", label: "Covered", icon: "🏠" },
    { id: "security", label: "Security Camera", icon: "📹" },
    { id: "ev_charging", label: "EV Charging", icon: "⚡" },
    { id: "lighting", label: "Lighting", icon: "💡" },
    { id: "wheelchair", label: "Wheelchair Access", icon: "♿" },
  ];

  const vehicleTypes = ["sedan", "suv", "truck", "motorcycle", "rv"];

  useEffect(() => {
    fetchParkingSpaces();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location error:", error);
        },
      );
    }
  };

  const fetchParkingSpaces = async () => {
    setLoading(true);
    try {
      const params = {
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        radius: 10000,
        ...filters,
      };

      if (filters.query) {
        params.address = filters.query;
      }

      const response = await parkingService.search(params);
      setParkingSpaces(response.data || []);
    } catch (error) {
      console.error("Error fetching parking spaces:", error);
      toast.error("Failed to load parking spaces");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: filters.query });
    fetchParkingSpaces();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenityId) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const onMapClick = useCallback(() => {
    setSelectedSpace(null);
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-full md:w-96 bg-white border-r flex flex-col">
        {/* Search Form */}
        <div className="p-4 border-b">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search location..."
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                className="input-field pl-10"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-3 text-sm text-primary-600 font-medium flex items-center"
          >
            {showFilters ? "▲" : "▼"} Filters
          </button>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 space-y-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range ($/hour)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="input-field w-1/2"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="input-field w-1/2"
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select
                  value={filters.vehicleType}
                  onChange={(e) =>
                    handleFilterChange("vehicleType", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">Any</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map((amenity) => (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        filters.amenities.includes(amenity.id)
                          ? "bg-primary-100 text-primary-700 border-primary-300"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      } border`}
                    >
                      <span>{amenity.icon}</span>
                      {amenity.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={fetchParkingSpaces}
                className="btn-primary w-full"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : parkingSpaces.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-4xl mb-2">🅿️</div>
              <p>No parking spaces found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y">
              {parkingSpaces.map((space) => (
                <Link
                  key={space._id}
                  to={`/parking/${space._id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                  onMouseEnter={() => setSelectedSpace(space)}
                >
                  <div className="flex gap-3">
                    <div className="w-24 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {space.images?.[0] ? (
                        <img
                          src={space.images[0].url}
                          alt={space.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🅿️
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {space.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {space.address?.street}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-primary-600 font-bold">
                          ${space.pricing?.hourly}/hr
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1">
                            {space.rating?.average?.toFixed(1) || "New"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="hidden md:block flex-1">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onClick={onMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {parkingSpaces.map((space) => (
              <Marker
                key={space._id}
                position={{
                  lat: space.location?.coordinates?.[1] || 0,
                  lng: space.location?.coordinates?.[0] || 0,
                }}
                onClick={() => setSelectedSpace(space)}
                icon={{
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#2563eb" stroke="white" stroke-width="3"/>
                      <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">P</text>
                    </svg>
                  `),
                  scaledSize: { width: 40, height: 40 },
                }}
              />
            ))}

            {selectedSpace && (
              <InfoWindow
                position={{
                  lat: selectedSpace.location?.coordinates?.[1] || 0,
                  lng: selectedSpace.location?.coordinates?.[0] || 0,
                }}
                onCloseClick={() => setSelectedSpace(null)}
              >
                <Link
                  to={`/parking/${selectedSpace._id}`}
                  className="block p-2 max-w-xs"
                >
                  <h3 className="font-semibold text-gray-800">
                    {selectedSpace.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedSpace.address?.street}
                  </p>
                  <p className="text-primary-600 font-bold mt-1">
                    ${selectedSpace.pricing?.hourly}/hr
                  </p>
                </Link>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Loading map...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
