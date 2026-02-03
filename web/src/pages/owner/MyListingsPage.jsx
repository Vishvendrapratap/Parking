import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { parkingService } from "../../api/services";
import toast from "react-hot-toast";

const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await parkingService.getMyListings();
      setListings(response.data || []);
    } catch (error) {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await parkingService.update(id, { isActive: !currentStatus });
      setListings(
        listings.map((l) =>
          l._id === id ? { ...l, isActive: !currentStatus } : l,
        ),
      );
      toast.success(`Listing ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error("Failed to update listing");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      await parkingService.delete(id);
      setListings(listings.filter((l) => l._id !== id));
      toast.success("Listing deleted");
    } catch (error) {
      toast.error("Failed to delete listing");
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (filter === "active") return listing.isActive;
    if (filter === "inactive") return !listing.isActive;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Listings</h1>
        <Link to="/owner/listings/new" className="btn-primary">
          + Add New Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["all", "active", "inactive"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && ` (${listings.length})`}
            {f === "active" &&
              ` (${listings.filter((l) => l.isActive).length})`}
            {f === "inactive" &&
              ` (${listings.filter((l) => !l.isActive).length})`}
          </button>
        ))}
      </div>

      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🅿️</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No listings found
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === "all"
              ? "You haven't created any listings yet"
              : `No ${filter} listings`}
          </p>
          <Link to="/owner/listings/new" className="btn-primary">
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing._id}
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="h-40 -mx-6 -mt-6 mb-4 bg-gray-200 overflow-hidden">
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🅿️
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 truncate flex-1">
                  {listing.title}
                </h3>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    listing.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {listing.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-3 truncate">
                {listing.address?.street}, {listing.address?.city}
              </p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-primary-600 font-bold">
                  ${listing.pricing?.hourly}/hr
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1">
                    {listing.rating?.average?.toFixed(1) || "New"}
                  </span>
                  <span className="ml-1">({listing.rating?.count || 0})</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                <div>
                  <span className="font-medium">
                    {listing.stats?.totalBookings || 0}
                  </span>
                  <span className="ml-1">bookings</span>
                </div>
                <div>
                  <span className="font-medium">
                    ${listing.stats?.totalEarnings?.toFixed(0) || 0}
                  </span>
                  <span className="ml-1">earned</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  to={`/owner/listings/${listing._id}/edit`}
                  className="btn-secondary py-2 flex-1 text-center text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() =>
                    handleToggleStatus(listing._id, listing.isActive)
                  }
                  className={`py-2 px-3 rounded-lg text-sm ${
                    listing.isActive
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {listing.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(listing._id)}
                  className="py-2 px-3 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListingsPage;
