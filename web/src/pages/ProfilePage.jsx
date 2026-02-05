import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../api/services";
import toast from "react-hot-toast";
import Icon from "../components/Icon";

const ProfilePage = () => {
  const { user, updateUser, switchRole, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await userService.updateProfile(formData);
      updateUser(response.data);
      toast.success("Profile updated successfully");
      setEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async () => {
    const newRole = user.activeRole === "seeker" ? "owner" : "seeker";
    await switchRole(newRole);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await userService.uploadProfilePicture(formData);
      updateUser(response.data);
      toast.success("Profile picture updated");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto overflow-hidden">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700">
                <Icon name="camera" className="text-white" size="sm" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="text-xl font-semibold text-gray-800">
              {user?.name}
            </h2>
            <p className="text-gray-500">{user?.email}</p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              <Icon name={user?.activeRole === "owner" ? "home" : "car"} />
              <span className="capitalize">{user?.activeRole}</span>
            </div>

            <button
              onClick={handleSwitchRole}
              className="mt-4 w-full btn-secondary text-sm"
            >
              Switch to {user?.activeRole === "seeker" ? "Owner" : "Seeker"}{" "}
              Mode
            </button>
          </div>

          {/* Stats */}
          <div className="card mt-4">
            <h3 className="font-semibold text-gray-800 mb-4">Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Bookings</span>
                <span className="font-medium">
                  {user?.stats?.totalBookings || 0}
                </span>
              </div>
              {user?.activeRole === "owner" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listings</span>
                    <span className="font-medium">
                      {user?.stats?.totalListings || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Earnings</span>
                    <span className="font-medium text-green-600">
                      ₹{user?.stats?.totalEarnings?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Member since</span>
                <span className="font-medium">
                  {new Date(user?.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Personal Information
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-primary-600 hover:underline text-sm"
                >
                  Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              {editing && (
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Quick Links */}
          <div className="card mt-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Links
            </h2>
            <div className="space-y-2">
              <a
                href="#"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              >
                <Icon name="bell" className="text-gray-500" />
                <span className="text-gray-700">Notification Settings</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              >
                <Icon name="creditCard" className="text-gray-500" />
                <span className="text-gray-700">Payment Methods</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              >
                <Icon name="lock" className="text-gray-500" />
                <span className="text-gray-700">Change Password</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
              >
                <Icon name="help" className="text-gray-500" />
                <span className="text-gray-700">Help & Support</span>
              </a>
              <button
                onClick={logout}
                className="flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg w-full text-left text-red-600"
              >
                <Icon name="signOut" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
