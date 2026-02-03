import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../api/services";
import toast from "react-hot-toast";

const ListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchListings();
  }, [page, statusFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter !== "all") params.isActive = statusFilter === "active";
      if (search) params.search = search;

      const response = await adminService.getListings(params);
      setListings(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleToggleStatus = async (listingId, currentStatus) => {
    try {
      await adminService.updateListing(listingId, { isActive: !currentStatus });
      toast.success(`Listing ${!currentStatus ? "activated" : "deactivated"}`);
      fetchListings();
    } catch (error) {
      toast.error("Failed to update listing");
    }
  };

  const handleDelete = async (listingId) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      await adminService.deleteListing(listingId);
      toast.success("Listing deleted");
      fetchListings();
    } catch (error) {
      toast.error("Failed to delete listing");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Listings</h1>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 w-full"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-field w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500">No listings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing._id} className="card">
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

              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 truncate flex-1">
                  {listing.title}
                </h3>
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    listing.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {listing.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-2">
                {listing.address?.city}, {listing.address?.state}
              </p>

              <p className="text-sm text-gray-600 mb-3">
                Owner: {listing.owner?.name || "Unknown"}
              </p>

              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-primary-600">
                  ${listing.pricing?.hourly}/hr
                </span>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1">
                    {listing.rating?.average?.toFixed(1) || "New"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  to={`/parking/${listing._id}`}
                  className="btn-secondary py-1.5 px-3 text-sm flex-1 text-center"
                >
                  View
                </Link>
                <button
                  onClick={() =>
                    handleToggleStatus(listing._id, listing.isActive)
                  }
                  className={`py-1.5 px-3 rounded-lg text-sm ${
                    listing.isActive
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {listing.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(listing._id)}
                  className="py-1.5 px-3 rounded-lg bg-red-100 text-red-600 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingsPage;
