import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { parkingService, chatService } from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import Icon from "../components/Icon";

const ParkingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    fetchParkingSpace();
  }, [id]);

  const fetchParkingSpace = async () => {
    try {
      const response = await parkingService.getById(id);
      setSpace(response.data);
    } catch (error) {
      toast.error("Failed to load parking space");
      navigate("/search");
    } finally {
      setLoading(false);
    }
  };

  const handleContactOwner = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/parking/${id}` } } });
      return;
    }

    try {
      await chatService.sendMessage(
        space.owner._id,
        `Hi, I'm interested in your parking space "${space.title}"`,
        space._id,
      );
      navigate("/messages");
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/parking/${id}` } } });
      return;
    }
    navigate(`/booking/${id}`);
  };

  const amenityIcons = {
    covered: "covered",
    security: "securityCamera",
    ev_charging: "evCharging",
    lighting: "lightbulb",
    wheelchair: "wheelchair",
    gated: "gate",
    "247_access": "24hours",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner" className="text-primary-600" size="3xl" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Parking space not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li>
            <Link to="/" className="hover:text-primary-600">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/search" className="hover:text-primary-600">
              Search
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-800">{space.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image Gallery */}
          <div className="mb-6">
            <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden mb-3">
              {space.images?.[selectedImage] ? (
                <img
                  src={space.images[selectedImage].url}
                  alt={space.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-primary-600">
                  <Icon name="parking" size="5xl" />
                </div>
              )}
            </div>

            {space.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {space.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      selectedImage === index
                        ? "border-primary-600"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${space.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Rating */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              {space.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center">
                <Icon name="star" className="text-yellow-500 mr-1" />
                <span className="font-medium">
                  {space.rating?.average?.toFixed(1) || "New"}
                </span>
                <span className="ml-1">
                  ({space.rating?.count || 0} reviews)
                </span>
              </div>
              <span>•</span>
              <span>
                {space.address?.city}, {space.address?.state}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Description
            </h2>
            <p className="text-gray-600 whitespace-pre-line">
              {space.description}
            </p>
          </div>

          {/* Space Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Space Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium text-gray-800 capitalize">
                  {space.type}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Vehicle Size</p>
                <p className="font-medium text-gray-800 capitalize">
                  {space.vehicleSize?.join(", ")}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-medium text-gray-800">
                  {space.capacity} vehicle(s)
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Access</p>
                <p className="font-medium text-gray-800 capitalize">
                  {space.access}
                </p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {space.amenities?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Amenities
              </h2>
              <div className="flex flex-wrap gap-3">
                {(showAllAmenities
                  ? space.amenities
                  : space.amenities.slice(0, 6)
                ).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg"
                  >
                    <Icon
                      name={amenityIcons[amenity] || "check"}
                      className="text-primary-600"
                    />
                    <span className="text-gray-700 capitalize">
                      {amenity.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
              {space.amenities.length > 6 && !showAllAmenities && (
                <button
                  onClick={() => setShowAllAmenities(true)}
                  className="mt-3 text-primary-600 text-sm font-medium"
                >
                  Show all {space.amenities.length} amenities
                </button>
              )}
            </div>
          )}

          {/* Location Map */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Location
            </h2>
            <p className="text-gray-600 mb-3">
              {space.address?.street}, {space.address?.city},{" "}
              {space.address?.state} {space.address?.zipCode}
            </p>
            <div className="h-64 rounded-xl overflow-hidden bg-gray-200">
              {isLoaded && space.location?.coordinates ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{
                    lat: space.location.coordinates[1],
                    lng: space.location.coordinates[0],
                  }}
                  zoom={15}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                >
                  <Marker
                    position={{
                      lat: space.location.coordinates[1],
                      lng: space.location.coordinates[0],
                    }}
                  />
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Map loading...
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          {space.reviews?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Reviews
              </h2>
              <div className="space-y-4">
                {space.reviews.map((review, index) => (
                  <div key={index} className="border-b pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold">
                          {review.user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {review.user?.name}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="text-yellow-500">
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 card">
            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-800">
                  ${space.pricing?.hourly}
                </span>
                <span className="text-gray-500">/ hour</span>
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                {space.pricing?.daily && (
                  <span>${space.pricing.daily}/day</span>
                )}
                {space.pricing?.monthly && (
                  <span>${space.pricing.monthly}/month</span>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Icon name="circleCheck" />
                <span className="font-medium">Available Now</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleBookNow}
                className="btn-primary w-full py-3"
                disabled={space.owner?._id === user?._id}
              >
                Book Now
              </button>

              <button
                onClick={handleContactOwner}
                className="btn-secondary w-full py-3"
                disabled={space.owner?._id === user?._id}
              >
                Contact Owner
              </button>
            </div>

            {space.owner?._id === user?._id && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                This is your listing
              </p>
            )}

            {/* Owner Info */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {space.owner?.name?.charAt(0) || "O"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Hosted by {space.owner?.name?.split(" ")[0]}
                  </p>
                  <p className="text-sm text-gray-500">
                    Member since{" "}
                    {new Date(space.owner?.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="mt-6 pt-6 border-t space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="clock" />
                <span>Instant Booking Available</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="circleXmark" />
                <span>Free Cancellation (24h before)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="lock" />
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetailsPage;
