import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "seeker";
  const prefilledPhone = searchParams.get("phone") || "";

  const [step, setStep] = useState(1); // 1: info, 2: otp
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: prefilledPhone,
    role: initialRole,
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData({ ...formData, [name]: value.replace(/[^0-9]/g, "") });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    setError("");

    const formattedPhone = `+91${formData.phone}`;
    const result = await sendOTP(formattedPhone, true); // true = registration

    if (result.success) {
      setStep(2);
    } else {
      setError(result.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    const formattedPhone = `+91${formData.phone}`;
    const result = await verifyOTP(formattedPhone, otp, {
      name: formData.name,
      email: formData.email || undefined,
      role: formData.role,
    });

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message || "Invalid OTP");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    const formattedPhone = `+91${formData.phone}`;
    const result = await sendOTP(formattedPhone, true); // true = registration

    if (result.success) {
      alert("OTP sent successfully!");
    } else {
      setError(result.message || "Failed to resend OTP");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Icon name="parking" className="text-primary-600" size="5xl" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">Join our parking community</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              1
            </div>
            <div
              className={`w-16 h-1 mx-2 ${step >= 2 ? "bg-primary-600" : "bg-gray-200"}`}
            />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              2
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, role: "seeker" })
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.role === "seeker"
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-3xl mb-2 text-primary-600">
                        <Icon name="car" size="2xl" />
                      </div>
                      <div className="font-medium text-gray-800">
                        Find Parking
                      </div>
                      <div className="text-xs text-gray-500">Book spaces</div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, role: "owner" })
                      }
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.role === "owner"
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-3xl mb-2 text-primary-600">
                        <Icon name="home" size="2xl" />
                      </div>
                      <div className="font-medium text-gray-800">
                        List Space
                      </div>
                      <div className="text-xs text-gray-500">Earn money</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email (Optional)
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number *
                  </label>
                  <div className="mt-1 flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +91
                    </span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      className="input-field rounded-l-none"
                      placeholder="Enter 10-digit number"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {loading ? (
                    <Icon name="spinner" className="text-white" size="lg" />
                  ) : (
                    "Send OTP"
                  )}
                </button>

                <p className="text-sm text-gray-500 text-center">
                  We'll send a 6-digit verification code to your phone
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Enter OTP
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Code sent to +91{formData.phone}
                  </p>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    maxLength={6}
                    className="input-field text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {loading ? (
                    <Icon name="spinner" className="text-white" size="lg" />
                  ) : (
                    "Create Account"
                  )}
                </button>

                <div className="flex justify-between items-center text-sm">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    Change details
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-4 text-xs text-center text-gray-500">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-primary-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
