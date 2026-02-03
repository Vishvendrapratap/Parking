import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

const Layout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🅿️</span>
                <span className="text-xl font-bold text-primary-600">
                  Parking App
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/search"
                className="text-gray-600 hover:text-primary-600 font-medium"
              >
                Find Parking
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.activeRole === "owner" && (
                    <Link
                      to="/owner/dashboard"
                      className="text-gray-600 hover:text-primary-600 font-medium"
                    >
                      Dashboard
                    </Link>
                  )}

                  <Link
                    to="/bookings"
                    className="text-gray-600 hover:text-primary-600 font-medium"
                  >
                    My Bookings
                  </Link>

                  <Link
                    to="/messages"
                    className="text-gray-600 hover:text-primary-600 font-medium"
                  >
                    Messages
                  </Link>

                  {/* User Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">
                        {user?.name?.split(" ")[0]}
                      </span>
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Profile
                      </Link>
                      {user?.activeRole === "owner" && (
                        <Link
                          to="/owner/listings"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          My Listings
                        </Link>
                      )}
                      {user?.role === "admin" && (
                        <Link
                          to="/admin/dashboard"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-primary-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-primary-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <Link
                  to="/search"
                  className="text-gray-600 hover:text-primary-600 font-medium"
                >
                  Find Parking
                </Link>

                {isAuthenticated ? (
                  <>
                    {user?.activeRole === "owner" && (
                      <Link
                        to="/owner/dashboard"
                        className="text-gray-600 hover:text-primary-600 font-medium"
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link
                      to="/bookings"
                      className="text-gray-600 hover:text-primary-600 font-medium"
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/messages"
                      className="text-gray-600 hover:text-primary-600 font-medium"
                    >
                      Messages
                    </Link>
                    <Link
                      to="/profile"
                      className="text-gray-600 hover:text-primary-600 font-medium"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700 font-medium text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-gray-600 hover:text-primary-600 font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="text-primary-600 font-semibold"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🅿️</span>
                <span className="text-xl font-bold">Parking App</span>
              </div>
              <p className="text-gray-400">
                Find and share parking spaces in your community.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/search" className="hover:text-white">
                    Find Parking
                  </Link>
                </li>
                <li>
                  <Link to="/owner/listings/new" className="hover:text-white">
                    List Your Space
                  </Link>
                </li>
                <li>
                  <Link to="/bookings" className="hover:text-white">
                    My Bookings
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Parking App. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
