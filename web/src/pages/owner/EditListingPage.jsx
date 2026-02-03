import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parkingService } from "../../api/services";
import toast from "react-hot-toast";

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

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
    vehicleSize: [],
    capacity: 1,
    amenities: [],
    access: "key",
    instructions: "",
    isActive: true,
  });

  const parkingTypes = ["driveway", "garage", "lot", "street", "underground"];
  const vehicleSizes = ["motorcycle", "sedan", "suv", "truck", "rv"];
  const amenitiesList = [
    { id: "covered", label: "Covered" },
    { id: "security", label: "Security Camera" },
    { id: "ev_charging", label: "EV Charging" },
    { id: "lighting", label: "Lighting" },
    { id: "wheelchair", label: "Wheelchair Access" },
    { id: "gated", label: "Gated Access" },
    { id: "247_access", label: "24/7 Access" },
  ];

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await parkingService.getById(id);
      const listing = response.data;

      setFormData({
        title: listing.title || "",
        description: listing.description || "",
        type: listing.type || "driveway",
        address: listing.address || {},
        pricing: listing.pricing || {},
        vehicleSize: listing.vehicleSize || [],
        capacity: listing.capacity || 1,
        amenities: listing.amenities || [],
        access: listing.access || "key",
        instructions: listing.instructions || "",
        isActive: listing.isActive ?? true,
      });

      setImages(listing.images || []);
    } catch (error) {
      toast.error("Failed to load listing");
      navigate("/owner/listings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleArrayItem = (field, item) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImgs = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...newImgs]);
  };

  const removeExistingImage = async (imageId) => {
    try {
      await parkingService.deleteImage(id, imageId);
      setImages((prev) => prev.filter((img) => img._id !== imageId));
      toast.success("Image removed");
    } catch (error) {
      toast.error("Failed to remove image");
    }
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await parkingService.update(id, formData);

      // Upload new images
      if (newImages.length > 0) {
        const imageFormData = new FormData();
        newImages.forEach((img) => {
          imageFormData.append("images", img.file);
        });
        await parkingService.addImages(id, imageFormData);
      }

      toast.success("Listing updated successfully");
      navigate("/owner/listings");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Edit Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Status Toggle */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Listing Status</h3>
              <p className="text-sm text-gray-500">
                {formData.isActive
                  ? "Your listing is visible to guests"
                  : "Your listing is hidden"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field"
              >
                {parkingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Location</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
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
                State
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly ($)
              </label>
              <input
                type="number"
                name="pricing.hourly"
                value={formData.pricing.hourly}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily ($)
              </label>
              <input
                type="number"
                name="pricing.daily"
                value={formData.pricing.daily}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly ($)
              </label>
              <input
                type="number"
                name="pricing.monthly"
                value={formData.pricing.monthly}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Vehicle & Amenities */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {vehicleSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleArrayItem("vehicleSize", size)}
                    className={`px-3 py-1.5 rounded-lg border capitalize ${
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleArrayItem("amenities", amenity.id)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      formData.amenities.includes(amenity.id)
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {amenity.label}
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
                className="input-field w-32"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} vehicle{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Photos</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img._id}
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={img.url}
                  alt="Listing"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img._id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                >
                  ×
                </button>
              </div>
            ))}

            {newImages.map((img, index) => (
              <div
                key={`new-${index}`}
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={img.preview}
                  alt="New"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                >
                  ×
                </button>
              </div>
            ))}

            {images.length + newImages.length < 5 && (
              <label className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                <span className="text-2xl text-gray-400">+</span>
                <span className="text-xs text-gray-500">Add Photo</span>
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
        </div>

        {/* Instructions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Access Instructions
          </h2>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows={3}
            placeholder="How should guests access your parking space?"
            className="input-field"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate("/owner/listings")}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditListingPage;
