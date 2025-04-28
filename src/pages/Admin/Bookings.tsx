import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(false); // State to toggle dark mode
  const [rooms, setRooms] = useState([]); // Store room data
  const [activities, setActivities] = useState([]); // Store activity data

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, "bookings"));
        const bookingsData = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch rooms
        const roomsSnapshot = await getDocs(collection(db, "rooms"));
        const roomsData = roomsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch activities
        const activitiesSnapshot = await getDocs(collection(db, "activities"));
        const activitiesData = activitiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBookings(bookingsData);
        setFilteredBookings(bookingsData);
        setRooms(roomsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = bookings.filter((booking) => {
      const roomName = getRoomName(booking.roomId).toLowerCase();
      const activityNames = getActivityNames(booking.activities || []).toLowerCase();
      const customerName = `${booking.firstName} ${booking.lastName}`.toLowerCase();
      const phone = booking.phone?.toLowerCase() || "";
      const email = booking.email?.toLowerCase() || "";
      const checkIn = new Date(booking.checkIn.seconds * 1000).toLocaleDateString().toLowerCase();
      const checkOut = new Date(booking.checkOut.seconds * 1000).toLocaleDateString().toLowerCase();
      const totalPrice = booking.totalPrice.toString();

      return (
        roomName.includes(term) ||
        activityNames.includes(term) ||
        customerName.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        checkIn.includes(term) ||
        checkOut.includes(term) ||
        totalPrice.includes(term)
      );
    });

    setFilteredBookings(filtered);
  };

  const handleToggleField = async (id, field, currentValue) => {
    const confirmation = window.confirm(
      `Are you sure you want to ${currentValue ? "revert" : "confirm"} this ${field}?`
    );
    if (!confirmation) return;

    try {
      const bookingRef = doc(db, "bookings", id);
      await updateDoc(bookingRef, { [field]: !currentValue });
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, [field]: !currentValue } : booking
        )
      );
      setFilteredBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, [field]: !currentValue } : booking
        )
      );
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const getRoomName = (roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    return room ? room.name : "N/A";
  };

  const getActivityNames = (activityIds) => {
    return activityIds
      .map((activityId) => {
        const activity = activities.find((act) => act.id === activityId);
        return activity ? activity.name : "N/A";
      })
      .join(", ");
  };

  return (
   
      <div className="container mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Hotel Bookings</h1>
          {/* Dark Mode Toggle */}
          
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search by Room, First Name, or Last Name"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full max-w-md p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
          />
        </div>

        {loading ? (
          <p>Loading bookings...</p>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800"
              >
                <h2 className="text-lg font-bold mb-4">Booking Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Room:</strong> {getRoomName(booking.roomId)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Activities:</strong> {getActivityNames(booking.activities || [])}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Customer:</strong> {`${booking.firstName} ${booking.lastName}`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Phone:</strong> {booking.phone || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Email:</strong> {booking.email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Adults:</strong> {booking.adults}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Children:</strong> {booking.children}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Check In:</strong>{" "}
                    {new Date(booking.checkIn.seconds * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Check Out:</strong>{" "}
                    {new Date(booking.checkOut.seconds * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Total Price:</strong> ${booking.totalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Payment Status:</strong>{" "}
                    {booking.isPayment ? "Paid" : "Pending"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Booking Status:</strong>{" "}
                    {booking.isBooked ? "Confirmed" : "Pending"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Checkout Status:</strong>{" "}
                    {booking.isCompleted ? "Completed" : "Pending"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() =>
                      handleToggleField(booking.id, "isBooked", booking.isBooked)
                    }
                    className={`px-4 py-2 rounded ${
                      booking.isBooked
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {booking.isBooked ? "Revert Booking" : "Confirm Booking"}
                  </button>
                  <button
                    onClick={() =>
                      handleToggleField(booking.id, "isCompleted", booking.isCompleted)
                    }
                    className={`px-4 py-2 rounded ${
                      booking.isCompleted
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {booking.isCompleted ? "Revert Checkout" : "Complete Stay"}
                  </button>
                  <button
                    onClick={() =>
                      handleToggleField(booking.id, "isPayment", booking.isPayment)
                    }
                    className={`px-4 py-2 rounded ${
                      booking.isPayment
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {booking.isPayment ? "Revert Payment" : "Confirm Payment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No bookings found.</p>
        )}
      </div>

  );
};

export default AdminBookings;
