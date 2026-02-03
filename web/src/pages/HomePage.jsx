import { Link } from "react-router-dom";
import { useState } from "react";

const HomePage = () => {
  const [searchLocation, setSearchLocation] = useState("");

  const features = [
    {
      icon: "🔍",
      title: "Easy Search",
      description:
        "Find available parking spots near your destination with real-time availability.",
    },
    {
      icon: "💰",
      title: "Save Money",
      description:
        "Compare prices and find the best deals from local homeowners.",
    },
    {
      icon: "🔒",
      title: "Secure Booking",
      description: "Book with confidence using our secure payment system.",
    },
    {
      icon: "💬",
      title: "Direct Chat",
      description: "Communicate directly with space owners for any questions.",
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Search",
      description:
        "Enter your destination and date/time to find available parking spots.",
    },
    {
      step: 2,
      title: "Book",
      description:
        "Choose a spot, select your duration, and confirm your booking.",
    },
    {
      step: 3,
      title: "Park",
      description: "Navigate to the spot and enjoy hassle-free parking.",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Find Parking Made Simple
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              Discover and book available parking spaces in your neighborhood.
              Share your driveway and earn extra income.
            </p>

            {/* Search Box */}
            <div className="bg-white rounded-xl p-4 shadow-xl max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter location or address"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 text-gray-800"
                  />
                </div>
                <Link
                  to={`/search${searchLocation ? `?q=${encodeURIComponent(searchLocation)}` : ""}`}
                  className="btn-primary py-3 px-8 text-center"
                >
                  Search Parking
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose Parking App?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We connect parking space owners with drivers looking for
              convenient parking solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Finding and booking parking has never been easier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section for Owners */}
      <section className="py-16 lg:py-24 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Have a Parking Space?
              </h2>
              <p className="text-gray-600 mb-6">
                Turn your unused driveway, garage, or parking spot into extra
                income. Join thousands of homeowners earning money by sharing
                their parking spaces.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-2">✓</span>
                  Set your own rates and availability
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-2">✓</span>
                  Get paid securely through the platform
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-green-500 mr-2">✓</span>
                  Manage bookings easily from your dashboard
                </li>
              </ul>
              <Link to="/register?role=owner" className="btn-secondary">
                Start Earning Today
              </Link>
            </div>
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Earn Up To
                </h3>
                <p className="text-4xl font-bold text-primary-600 mb-2">
                  $500/month
                </p>
                <p className="text-gray-500">by renting your parking space</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-24 bg-primary-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join our community of drivers and parking space owners today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Find Parking
            </Link>
            <Link
              to="/register"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
