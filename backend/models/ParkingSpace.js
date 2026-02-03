const mongoose = require("mongoose");

const parkingSpaceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      maxlength: 1000,
    },
    // Location details
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: "2dsphere",
      },
      address: {
        type: String,
        required: true,
      },
      city: String,
      state: String,
      country: String,
      zipCode: String,
      formattedAddress: String,
    },
    // Parking size types with examples
    parkingSize: {
      type: String,
      enum: ["small", "sedan", "suv"],
      required: true,
    },
    // Pricing
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerDay: {
      type: Number,
      min: 0,
    },
    // Images
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Availability
    status: {
      type: String,
      enum: ["available", "unavailable", "booked"],
      default: "available",
    },
    // Availability schedule (optional recurring schedule)
    availabilitySchedule: {
      monday: { start: String, end: String, isAvailable: Boolean },
      tuesday: { start: String, end: String, isAvailable: Boolean },
      wednesday: { start: String, end: String, isAvailable: Boolean },
      thursday: { start: String, end: String, isAvailable: Boolean },
      friday: { start: String, end: String, isAvailable: Boolean },
      saturday: { start: String, end: String, isAvailable: Boolean },
      sunday: { start: String, end: String, isAvailable: Boolean },
    },
    // Features/Amenities
    amenities: [
      {
        type: String,
        enum: [
          "covered",
          "security_camera",
          "gated",
          "ev_charging",
          "well_lit",
          "handicap_accessible",
          "24_7_access",
          "security_guard",
        ],
      },
    ],
    // Special instructions
    accessInstructions: {
      type: String,
      maxlength: 500,
    },
    // Stats
    totalBookings: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // Flags
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
parkingSpaceSchema.index({ "location.coordinates": "2dsphere" });
parkingSpaceSchema.index({ owner: 1 });
parkingSpaceSchema.index({ status: 1 });
parkingSpaceSchema.index({ parkingSize: 1 });
parkingSpaceSchema.index({ pricePerHour: 1 });

// Virtual for bookings
parkingSpaceSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "parkingSpace",
  justOne: false,
});

// Static method to find nearby parking spaces
parkingSpaceSchema.statics.findNearby = function (
  coordinates,
  maxDistance = 5000,
  filters = {},
) {
  const query = {
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: coordinates, // [longitude, latitude]
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    status: "available",
    isActive: true,
  };

  if (filters.parkingSize) {
    query.parkingSize = filters.parkingSize;
  }

  if (filters.maxPrice) {
    query.pricePerHour = { $lte: filters.maxPrice };
  }

  return this.find(query).populate("owner", "name avatar rating");
};

// Static parking size details (not stored in DB)
parkingSpaceSchema.statics.PARKING_SIZE_DETAILS = {
  small: {
    description: "Compact cars like Smart Car, Mini Cooper, Fiat 500",
    maxLength: 14, // feet
    maxWidth: 6,
  },
  sedan: {
    description: "Standard sedans like Honda Civic, Toyota Camry, BMW 3 Series",
    maxLength: 16,
    maxWidth: 6.5,
  },
  suv: {
    description: "Large vehicles like Ford F-150, Chevy Tahoe, Range Rover",
    maxLength: 20,
    maxWidth: 7,
  },
};

module.exports = mongoose.model("ParkingSpace", parkingSpaceSchema);
