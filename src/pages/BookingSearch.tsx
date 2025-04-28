import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, Phone } from "lucide-react";
import { db } from "@/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const BookingSearch = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [heroImage, setHeroImage] = useState<string>(""); // State for hero image
  const { toast } = useToast();

  // Fetch hero image from Firestore
  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const bannerDoc = await getDoc(doc(db, "banners", "main"));
        if (bannerDoc.exists()) {
          const bannerData = bannerDoc.data();
          setHeroImage(bannerData.footer || ""); // Use the 'footer' field for the image URL
        }
      } catch (error) {
        console.error("Error fetching hero image:", error);
      }
    };

    fetchHeroImage();
  }, []);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(bookingsRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "No booking found",
          description: "No booking found with this email address.",
        });
        return;
      }

      setShowPhoneInput(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while searching for the booking.",
      });
    }
  };

  const handleBookingSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("email", "==", email),
        where("phone", "==", phone)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "No booking found",
          description: "The provided email and phone number combination is incorrect.",
        });
        return;
      }

      const bookingData = querySnapshot.docs[0].data();
      setBookingDetails(bookingData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while searching for the booking.",
      });
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div
        className="relative text-white h-[40vh] flex items-center justify-center"
        style={{
          backgroundImage: `url('${heroImage}')`, // Use the fetched hero image
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="relative z-10 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Search Your Booking
          </h1>
          <p className="text-lg max-w-2xl mx-auto">
            Find your booking details by entering your email and phone number.
          </p>
        </div>
      </div>

      {/* Search Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
              Search Your Booking
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-4">
              {!showPhoneInput ? (
                <form onSubmit={handleEmailCheck} className="flex w-full gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 py-2"
                      required
                    />
                  </div>
                  <Button type="submit" className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleBookingSearch} className="flex w-full gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 py-2"
                      required
                    />
                  </div>
                  <Button type="submit" className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Verify
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Booking Details Section */}
          {bookingDetails && (
            <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Booking Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Room:</strong> {bookingDetails.roomName || "N/A"}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Activities:</strong> {bookingDetails.activities?.join(", ") || "N/A"}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Customer:</strong> {`${bookingDetails.firstName} ${bookingDetails.lastName}`}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Phone:</strong> {bookingDetails.phone || "N/A"}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> {bookingDetails.email || "N/A"}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Adults:</strong> {bookingDetails.adults}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Children:</strong> {bookingDetails.children}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Check In:</strong>{" "}
                  {new Date(bookingDetails.checkIn.seconds * 1000).toLocaleDateString()}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Check Out:</strong>{" "}
                  {new Date(bookingDetails.checkOut.seconds * 1000).toLocaleDateString()}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Total Price:</strong> ${bookingDetails.totalPrice}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Payment Status:</strong>{" "}
                  {bookingDetails.isPayment ? "Paid" : "Pending"}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Booking Status:</strong>{" "}
                  {bookingDetails.isBooked ? "Confirmed" : "Pending"}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>Checkout Status:</strong>{" "}
                  {bookingDetails.isCompleted ? "Completed" : "Pending"}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BookingSearch;