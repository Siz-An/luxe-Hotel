import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FadeIn, SlideUp } from "@/components/motion-wrapper";
import { db } from "@/firebase"; // Import Firebase Firestore
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    priceRange: [0, 1000],
    capacity: 0,
  });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Fetch rooms from Firestore
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "rooms"));
        const roomsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRooms(roomsData);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Fetch background image for the section
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        const docRef = doc(db, "banners", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.rooms || null); // Fetch the "rooms" field
        } else {
          console.error("No background image found for rooms.");
        }
      } catch (error) {
        console.error("Error fetching background image:", error);
      }
    };

    fetchBackgroundImage();
  }, []);

  const filteredRooms = rooms.filter(
    (room) =>
      room.price >= filter.priceRange[0] &&
      room.price <= filter.priceRange[1] &&
      (filter.capacity === 0 || room.guests >= filter.capacity)
  );

  return (
    <div>
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
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Our Accommodations
            </h1>
            <p className="text-lg max-w-2xl mx-auto">
              Discover our range of luxurious rooms and suites, each designed to provide comfort,
              elegance, and an unforgettable stay.
            </p>
          </SlideUp>
        </div>
      </div>

      {/* Rooms Section */}
      <div className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <FadeIn>
                <div className="glass-card p-6 mb-8 sticky top-24">
                  <h3 className="font-serif text-xl font-bold mb-6">Filters</h3>

                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Price Range (per night)</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">${filter.priceRange[0]}</span>
                      <span className="text-sm">${filter.priceRange[1]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={filter.priceRange[1]}
                      onChange={(e) =>
                        setFilter({
                          ...filter,
                          priceRange: [filter.priceRange[0], parseInt(e.target.value)],
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
                    />
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Guests</h4>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 4, 6].map((num) => (
                        <button
                          key={num}
                          onClick={() => setFilter({ ...filter, capacity: num })}
                          className={`px-4 py-2 border rounded-full text-sm ${
                            filter.capacity === num
                              ? "bg-hotel-gold text-white border-hotel-gold"
                              : "border-gray-300 dark:border-gray-600 hover:border-hotel-gold"
                          }`}
                        >
                          {num === 0 ? "Any" : `${num}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setFilter({ priceRange: [0, 1000], capacity: 0 })}
                    className="text-hotel-gold hover:underline text-sm w-full text-center"
                  >
                    Clear All Filters
                  </button>
                </div>
              </FadeIn>
            </div>

            {/* Rooms Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-lg text-gray-500">Loading rooms...</p>
                </div>
              ) : filteredRooms.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {filteredRooms.map((room, index) => {
                    const discountedPrice = room.price - (room.price * room.discount) / 100; // Calculate discounted price
                    return (
                      <SlideUp key={room.id} delay={index * 0.1} className="h-full">
                        <div className="glass-card overflow-hidden h-full flex flex-col">
                          <div className="relative h-64 overflow-hidden flex items-center justify-center bg-gray-100">
                            <img
                              src={room.image}
                              alt={room.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            />
                            {/* Discounted Price Badge */}
                            <div className="absolute top-4 right-4 bg-hotel-gold text-white px-4 py-1 rounded-full text-sm font-medium">
                              ${discountedPrice.toFixed(2)}/night
                            </div>
                            {/* Discount Percentage Badge */}
                            {room.discount > 0 && (
                              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                {room.discount}% off
                              </div>
                            )}
                          </div>
                          <div className="p-6 flex flex-col flex-grow">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-serif text-xl font-bold">{room.name}</h3>
                              {/* Actual Price with Conditional Strikethrough */}
                              <div className="text-right">
                                {room.discount > 0 ? (
                                  <>
                                    <span className="text-gray-800 line-through text-sm mr-2">${room.price.toFixed(2)}</span>
                                   
                                  </>
                                ) : (
                                  <span className="text-gray-800 font-bold">${room.price.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow text-sm">
                              {room.description.length > 100
                                ? `${room.description.slice(0, 100)}...`
                                : room.description}
                            </p>
                            {/* Number of Guests */}
                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                              <strong>Guests:</strong> {room.guests || "N/A"}
                            </p>
                            {/* Features */}
                            <ul className="text-gray-600 dark:text-gray-300 text-sm mt-4">
                              {room.features?.map((feature: string, featureIndex: number) => (
                                <li key={featureIndex} className="flex items-center gap-2">
                                  <span>✔️</span> {feature}
                                </li>
                              ))}
                            </ul>
                            <Link to="/book" className="btn btn-primary w-full text-center mt-4">
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </SlideUp>
                    );
                  })}
                </div>
              ) : (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-xl font-medium mb-2">No rooms match your criteria</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Please try adjusting your filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
