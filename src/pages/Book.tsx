import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { SlideUp } from "@/components/motion-wrapper";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { collection, getDocs, doc, getDoc, addDoc, query, where } from "firebase/firestore";
import { db } from "@/firebase";

const BookPage = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const activityParam = searchParams.get("activity");

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [rooms, setRooms] = useState([]);
  const [activities, setActivities] = useState([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [booking, setBooking] = useState({
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 3)),
    guests: 2,
    roomId: "",
    activities: activityParam ? [activityParam] : [],
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
    adults: 1,
    children: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch background image for the banner
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        const docRef = doc(db, "banners", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.footer || null); // Fetch the "footer" field
        } else {
          console.error("No background image found for footer.");
        }
      } catch (error) {
        console.error("Error fetching background image:", error);
      }
    };

    fetchBackgroundImage();
  }, []);

  // Fetch rooms and activities from Firestore
  useEffect(() => {
    const fetchRoomsAndActivities = async () => {
      try {
        // Fetch rooms
        const roomsSnapshot = await getDocs(collection(db, "rooms"));
        const roomsData = roomsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRooms(roomsData);

        // Fetch activities
        const activitiesSnapshot = await getDocs(collection(db, "activities"));
        const activitiesData = activitiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching rooms or activities:", error);
      }
    };

    fetchRoomsAndActivities();
  }, []);

  const handleRoomSelect = (roomId: string) => {
    setBooking((prev) => ({ ...prev, roomId }));
  };

  const handleActivityToggle = (activityId: string) => {
    setBooking((prev) => {
      const activities = prev.activities.includes(activityId)
        ? prev.activities.filter((id) => id !== activityId)
        : [...prev.activities, activityId];
      return { ...prev, activities };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBooking((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (bookingStep === 1 && !booking.roomId) {
      toast({
        title: "Room Selection Required",
        description: "Please select a room to continue with your booking.",
        variant: "destructive",
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setBookingStep((prev) => prev + 1);
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setBookingStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("email", "==", booking.email),
        where("phone", "==", booking.phone),
        where("isCompleted", "==", false) // Check if there is an incomplete booking
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: "Incomplete Booking Found",
          description: "You already have an incomplete booking. Please complete it before making another booking.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get the selected room name
      const selectedRoom = rooms.find((room) => room.id === booking.roomId);
      const roomName = selectedRoom ? selectedRoom.name : "N/A";

      // Get the names of selected activities
      const selectedActivities = booking.activities.map((actId) => {
        const activity = activities.find((act) => act.id === actId);
        return activity ? activity.name : "N/A";
      });

      // Save booking data to Firestore with names instead of IDs
      const bookingData = {
        ...booking,
        roomName, // Save room name
        activityNames: selectedActivities, // Save activity names
        isBooked: false, // Initially set to false
        isCompleted: false, // Initially set to false
        isPayment: false, // Initially set to false
        totalPrice,
        nights,
        roomDiscountedPrice,
        activityPrices,
      };

      await addDoc(bookingsRef, bookingData);

      toast({
        title: "Booking Submitted",
        description: "Your booking has been submitted and is awaiting confirmation.",
        variant: "default",
      });

      setIsSubmitting(false);
      setBookingStep(3);
    } catch (error) {
      console.error("Error saving booking:", error);
      toast({
        title: "Error",
        description: "There was an error saving your booking. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Calculate total price
  const selectedRoom = rooms.find((room) => room.id === booking.roomId);
  const roomDiscountedPrice = selectedRoom
    ? selectedRoom.price - (selectedRoom.price * (selectedRoom.discount || 0)) / 100
    : 0;

  const activityPrices = booking.activities.reduce((total, actId) => {
    const activity = activities.find((act) => act.id === actId);
    const discountedPrice = activity
      ? activity.price - (activity.price * (activity.discount || 0)) / 100
      : 0;
    return total + discountedPrice;
  }, 0);

  const nights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = roomDiscountedPrice * nights + activityPrices;

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Hero Section */}
      <div
        className="relative text-white h-[40vh] flex items-center justify-center"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="hotel-container relative z-10 text-center">
          <SlideUp>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Book Your Stay</h1>
            <p className="text-lg max-w-2xl mx-auto">
              Secure your luxurious getaway at LXXRY Hotel and prepare for an unforgettable experience.
            </p>
          </SlideUp>
        </div>
      </div>

      {/* Booking Steps */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex justify-between items-center max-w-3xl mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center relative">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      bookingStep >= step ? "bg-hotel-gold" : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  >
                    {step}
                  </div>
                  <p className={`mt-2 text-sm ${
                    bookingStep >= step ? "text-gray-900 dark:text-gray-100" : "text-gray-500"
                  }`}>
                    {step === 1 ? "Select Room" : step === 2 ? "Your Details" : "Confirmation"}
                  </p>
                  
                  {step < 3 && (
                    <div className={`absolute w-full top-5 left-1/2 h-1 ${
                      bookingStep > step ? "bg-hotel-gold" : "bg-gray-300 dark:bg-gray-700"
                    }`} style={{ width: "calc(100% - 2.5rem)", left: "calc(50% + 1.25rem)" }}>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <AnimateStepPresence step={bookingStep} currentStep={1}>
            <div className="max-w-5xl mx-auto">
              <div className="mb-10">
                <h2 className="font-serif text-2xl font-bold mb-6">1. Select Your Dates</h2>
                
                <div className="glass-card p-6 mb-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Check-in Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {format(booking.checkIn, "PPP")}
                            <svg className="ml-auto h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={booking.checkIn}
                            onSelect={(date) => date && setBooking((prev) => ({ ...prev, checkIn: date }))}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Check-out Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {format(booking.checkOut, "PPP")}
                            <svg className="ml-auto h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={booking.checkOut}
                            onSelect={(date) => date && setBooking((prev) => ({ ...prev, checkOut: date }))}
                            disabled={(date) => date <= booking.checkIn}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-10">
                <h2 className="font-serif text-2xl font-bold mb-6">2. Select Your Room</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {rooms.map((room) => {
                    const discountedPrice = room.price - (room.price * (room.discount || 0)) / 100;
                    return (
                      <motion.div
                        key={room.id}
                        whileHover={{ scale: 1.03 }}
                        className={cn(
                          "glass-card overflow-hidden cursor-pointer relative",
                          booking.roomId === room.id && "ring-2 ring-hotel-gold"
                        )}
                        onClick={() => handleRoomSelect(room.id)}
                      >
                        {/* Discount Badge */}
                        {room.discount > 0 && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
                            {room.discount}% Off
                          </div>
                        )}
                        {/* Discounted Price Badge */}
                        <div className="absolute top-2 right-2 bg-hotel-gold text-white px-2 py-1 rounded-md text-sm font-medium">
                          ${discountedPrice.toFixed(2)}
                        </div>
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={room.image} 
                            alt={room.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-serif text-xl font-bold">{room.name}</h3>
                            <div className="text-right">
                              {room.discount > 0 && (
                                <span className="text-gray-500 line-through text-sm mr-2">
                                  ${room.price.toFixed(2)}
                                </span>
                              )}
                              <span className="text-hotel-gold font-medium">
                                ${discountedPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{room.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-10">
                <h2 className="font-serif text-2xl font-bold mb-6">3. Add Activities (Optional)</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {activities.map((activity) => {
                    const discountedPrice = activity.price - (activity.price * (activity.discount || 0)) / 100;
                    return (
                      <div
                        key={activity.id}
                        className={cn(
                          "glass-card p-5 cursor-pointer",
                          booking.activities.includes(activity.id) && "ring-2 ring-hotel-gold"
                        )}
                        onClick={() => handleActivityToggle(activity.id)}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{activity.name}</h3>
                          <div className="text-right">
                            {activity.discount > 0 && (
                              <span className="text-gray-500 line-through text-sm mr-2">
                                ${activity.price.toFixed(2)}
                              </span>
                            )}
                            <span className="text-hotel-gold font-medium">
                              ${discountedPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {activity.discount > 0 && (
                          <p className="text-sm text-red-500">{activity.discount}% off</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="btn btn-primary min-w-[120px]"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </AnimateStepPresence>

          <AnimateStepPresence step={bookingStep} currentStep={2}>
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-2xl font-bold mb-6">Enter Your Details</h2>
              
                <form onSubmit={handleSubmit} className="glass-card p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={booking.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-hotel-gold outline-none"
                  />
                  </div>
                  
                  <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={booking.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-hotel-gold outline-none"
                  />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={booking.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-hotel-gold outline-none"
                  />
                  </div>
                  
                  <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                    Phone Number (Enter Your Country Code)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={booking.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-hotel-gold outline-none"
                  />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="specialRequests" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                  Special Requests (Optional)
                  </label>
                  <textarea
                  id="specialRequests"
                  name="specialRequests"
                  value={booking.specialRequests}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-hotel-gold outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="adults" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                      Number of Adults
                    </label>
                    <input
                      type="number"
                      id="adults"
                      name="adults"
                      value={booking.adults || 1} // Default to 1 adult
                      onChange={handleInputChange}
                      min={1}
                      required
                      className="w-full p-3 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-hotel-gold outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="children" className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
                      Number of Children
                    </label>
                    <input
                      type="number"
                      id="children"
                      name="children"
                      value={booking.children || 0} // Default to 0 children
                      onChange={handleInputChange}
                      min={0}
                      className="w-full p-3 border rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-hotel-gold outline-none"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-6 text-gray-900 dark:text-gray-100">
                  <h3 className="font-medium mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Check-in:</span>
                    <span className="font-medium">{format(booking.checkIn, "PPP")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Check-out:</span>
                    <span className="font-medium">{format(booking.checkOut, "PPP")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of Nights:</span>
                    <span className="font-medium">{nights} {nights === 1 ? "Night" : "Nights"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests:</span>
                    <span className="font-medium">{booking.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span className="font-medium">{selectedRoom?.name}</span>
                  </div>
                  {selectedRoom && (
                    <div className="flex justify-between">
                    <span>Room Rate:</span>
                    <div className="text-right">
                      {selectedRoom.discount > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 line-through text-sm mr-2">
                        ${selectedRoom.price.toFixed(2)} per night
                      </span>
                      )}
                      <span className="font-medium text-hotel-gold">
                      ${roomDiscountedPrice.toFixed(2)} per night
                      </span>
                    </div>
                    </div>
                  )}
                  {booking.activities.length > 0 && (
                    <div className="flex justify-between items-start">
                    <span>Activities:</span>
                    <div className="text-right">
                      {booking.activities.map((actId) => {
                      const activity = activities.find((a) => a.id === actId);
                      const discountedPrice = activity
                        ? activity.price - (activity.price * (activity.discount || 0)) / 100
                        : 0;
                      return activity ? (
                        <div key={actId} className="flex justify-between min-w-[150px]">
                        <span>{activity.name}</span>
                        <div className="text-right">
                          {activity.discount > 0 && (
                          <span className="text-gray-500 dark:text-gray-400 line-through text-sm mr-2">
                            ${activity.price.toFixed(2)}
                          </span>
                          )}
                          <span className="font-medium text-hotel-gold">
                          ${discountedPrice.toFixed(2)}
                          </span>
                        </div>
                        </div>
                      ) : null;
                      })}
                    </div>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={prevStep}
                  className="btn btn-outline bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  >
                  Back
                  </motion.button>
                  
                  <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="btn btn-primary flex items-center justify-center min-w-[150px]"
                  disabled={isSubmitting}
                  >
                  {isSubmitting ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                    </>
                  ) : "Complete Booking"}
                  </motion.button>
                </div>
                </form>
            </div>
          </AnimateStepPresence>

          <AnimateStepPresence step={bookingStep} currentStep={3}>
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-serif text-3xl font-bold mb-4">Booking Pending Confirmed!</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Thank you for choosing LXXRY Hotel. Your booking will be confirmed and we look forward to welcoming you.
                </p>
              </div>
              
              <div className="glass-card p-6 mb-8">
                <h3 className="font-serif text-xl font-bold mb-4">Booking Details</h3>
                <div className="space-y-3 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Check-in</p>
                      <p className="font-medium">{format(booking.checkIn, "PPP")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Check-out</p>
                      <p className="font-medium">{format(booking.checkOut, "PPP")}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Room</p>
                      <p className="font-medium">{selectedRoom?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Guests</p>
                      <p className="font-medium">{booking.guests}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Booking Name</p>
                    <p className="font-medium">{booking.firstName} {booking.lastName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                    <p className="font-bold text-lg">${totalPrice}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                A confirmation email Will be sent to {booking.email}. If you have any questions, please contact our concierge team.
              </p>
              
              <Button asChild variant="default" className="btn-primary">
                <a href="/">Return to Home</a>
              </Button>
            </div>
          </AnimateStepPresence>
        </div>
      </section>
    </div>
  );
};

// Helper component to animate between steps
const AnimateStepPresence = ({ 
  step, 
  currentStep, 
  children 
}: { 
  step: number; 
  currentStep: number; 
  children: React.ReactNode;
}) => {
  if (step !== currentStep) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: step < currentStep ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default BookPage;
