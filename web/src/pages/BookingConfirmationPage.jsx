import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";

const BookingConfirmationPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="circleCheck" className="text-green-600" size="4xl" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Booking Confirmed!
        </h1>

        <p className="text-gray-600 mb-6">
          Your parking space has been successfully booked. You will receive a
          confirmation email shortly.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
          <p className="font-mono font-bold text-lg text-gray-800">
            {id?.slice(-8).toUpperCase()}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to={`/booking/details/${id}`}
            className="btn-primary w-full block"
          >
            View Booking Details
          </Link>

          <Link to="/bookings" className="btn-secondary w-full block">
            Go to My Bookings
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Questions?{" "}
          <a href="#" className="text-primary-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
