import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parkingService } from "../../api/services";
import toast from "react-hot-toast";

const AddListingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "driveway",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
    },
    pricing: {
      hourly: "",
      daily: "",
      monthly: "",
    },
    vehicleSize: ["sedan"],
    capacity: 1,
    amenities: [],
    access: "key",
    instructions: "",
  });

  const parkingTypes = [
    { id: "driveway", label: "Driveway", icon: "🏠" },
    { id: "garage", label: "Garage", icon: "🚗" },
    { id: "lot", label: "Parking Lot", icon: "🅿️" },
    { id: "street", label: "Street Parking", icon: "🛣️" },
    { id: "underground", label: "Underground", icon: "⬇️" },
  ];

  const vehicleSizes = ["motorcycle", "sedan", "suv", "truck", "rv"];

  const amenitiesList = [
    { id: "covered", label: "Covered", icon: "🏠" },
    { id: "security", label: "Security Camera", icon: "📹" },
    { id: "ev_charging", label: "EV Charging", icon: "⚡" },
    { id: "lighting", label: "Lighting", icon: "💡" },
    { id: "wheelchair", label: "Wheelchair Access", icon: "♿" },
    { id: "gated", label: "Gated Access", icon: "🚧" },
    { id: "247_access", label: "24/7 Access", icon: "🕐" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleVehicleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      vehicleSize: prev.vehicleSize.includes(size)
        ? prev.vehicleSize.filter((s) => s !== size)
        : [...prev.vehicleSize, size],
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.title || !formData.description) {
        toast.error("Please fill in title and description");
        return false;
      }
    } else if (step === 2) {
      if (
        !formData.address.street ||
        !formData.address.city ||
        !formData.address.state ||
        !formData.address.zipCode
      ) {
        toast.error("Please fill in all address fields");
        return false;
      }
    } else if (step === 3) {
      if (!formData.pricing.hourly) {
        toast.error("Please set an hourly rate");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);

    try {
      // Create listing
      const response = await parkingService.create(formData);
      const listingId = response.data._id;

      // Upload images
      if (images.length > 0) {
        const imageFormData = new FormData();
        images.forEach((img) => {
          imageFormData.append("images", img.file);
        });
        await parkingService.addImages(listingId, imageFormData);
      }

      toast.success("Listing created successfully!");
      navigate("/owner/listings");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Add New Listing</h1>
      <p className="text-gray-600 mb-8">
        Share your parking space and start earning
      </p>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`w-16 md:w-24 h-1 mx-2 ${
                  step > s ? "bg-primary-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="card">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parking Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {parkingTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, type: type.id }))
                    }
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.type === type.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Spacious Driveway near Downtown"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your parking space..."
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Location</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="123 Main Street"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing & Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Pricing & Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pricing
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Hourly *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="pricing.hourly"
                      value={formData.pricing.hourly}
                      onChange={handleChange}
                      placeholder="5"
                      className="input-field pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Daily
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="pricing.daily"
                      value={formData.pricing.daily}
                      onChange={handleChange}
                      placeholder="30"
                      className="input-field pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Monthly
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="pricing.monthly"
                      value={formData.pricing.monthly}
                      onChange={handleChange}
                      placeholder="200"
                      className="input-field pl-7"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vehicle Sizes Accepted
              </label>
              <div className="flex flex-wrap gap-2">
                {vehicleSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleVehicleSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 capitalize ${
                      formData.vehicleSize.includes(size)
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <select
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="input-field"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} vehicle{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 ${
                      formData.amenities.includes(amenity.id)
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    <span>{amenity.icon}</span>
                    {amenity.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Photos</h2>
            <p className="text-gray-600 text-sm">
              Add up to 5 photos of your parking space
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <span className="text-3xl text-gray-400">+</span>
                  <span className="text-sm text-gray-500">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={3}
                placeholder="How should guests access your parking space?"
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex-1"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Creating..." : "Create Listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddListingPage;
