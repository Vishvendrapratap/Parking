import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Icon from "../components/Icon";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    const formattedPhone = `+91${phone}`;
    const result = await sendOTP(formattedPhone, false); // false = not registration

    if (result.success) {
      if (result.requiresRegistration) {
        // User doesn't exist, redirect to registration with phone pre-filled
        navigate(`/register?phone=${phone}`);
      } else {
        setStep("otp");
      }
    } else {
      setError(result.message || "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    const formattedPhone = `+91${phone}`;
    const result = await verifyOTP(formattedPhone, otp);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || "Invalid OTP");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setError("");
    setLoading(true);
    const formattedPhone = `+91${phone}`;
    const result = await sendOTP(formattedPhone, false);

    if (result.success && !result.requiresRegistration) {
      setError("");
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
            Welcome back
          </h2>
          <p className="mt-2 text-gray-600">Sign in with your phone number</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
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
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    maxLength={10}
                    className="input-field rounded-l-none"
                    placeholder="Enter 10-digit number"
                  />
                </div>
              </div>

              <button
                type="submit"
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
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700"
                >
                  Enter OTP
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Code sent to +91{phone}
                </p>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  required
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                  }
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
                  "Verify & Sign in"
                )}
              </button>

              <div className="flex justify-between items-center text-sm">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-primary-600 hover:text-primary-500"
                >
                  Change number
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
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to ParkEase?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="btn-secondary w-full flex justify-center"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
