import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FadeIn, SlideUp } from "@/components/motion-wrapper";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase"; // Import Firebase Firestore instance

const HeroSlide = ({ image, title, subtitle }: { image: string; title: string; subtitle: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1 }}
    className="w-full h-full absolute inset-0"
  >
    <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
    <img src={image} alt={title} className="w-full h-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-4 drop-shadow-lg"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="text-lg md:text-xl mb-8 max-w-2xl drop-shadow-lg"
      >
        {subtitle}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
      >
        <Link
          to="/book"
          className="glass-morphism px-8 py-3 text-lg font-medium rounded-full hover:bg-white/30 transition-all"
        >
          Book Your Stay
        </Link>
      </motion.div>
    </div>
  </motion.div>
);

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<
    { image: string; title: string; subtitle: string }[]
  >([]);
  const [footerImage, setFooterImage] = useState<string | null>(null);
  const [welcomeImage, setWelcomeImage] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("LXXRY Hotel");
  const [welcomeDescription, setWelcomeDescription] = useState<string>(
    "Nestled amidst breathtaking natural beauty, our luxury hotel offers an unparalleled retreat from the ordinary."
  );
  const [discountedRooms, setDiscountedRooms] = useState<
    { id: string; name: string; image: string; price: number; description: string; discount: number; features?: string[]; guests?: number }[]
  >([]);

  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        const docRef = doc(db, "banners", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const images = data.home || []; // Fetch the "home" field
          const slides = images.map((image: string, index: number) => ({
            image,
            title: ["Welcome to LXXRY HOTEL", "Adventure Awaits", "Natural Paradise", "Luxury Awaits"][
              index % 4
            ], // Rotate titles
            subtitle: [
              "Experience the natural beauty of Nepal's breathtaking landscapes, from the towering peaks of the Himalayas to lush green valleys, serene lakes, and vibrant cultural villages.",
              "Explore wildlife with our guided jungle safaris",
              "Discover the beauty of Rapti River and surrounding wilderness",
              "Indulge in the ultimate luxury experience",
            ][index % 4], // Rotate subtitles
          }));
          setHeroSlides(slides);
        } else {
          console.error("No hero slides found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching hero slides:", error);
      }
    };

    fetchHeroSlides();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides]);

  // Fetch the footer image from Firestore
  useEffect(() => {
    const fetchFooterImage = async () => {
      try {
        const docRef = doc(db, "banners", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFooterImage(data.footer || null); // Fetch the "footer" field
        } else {
          console.error("No footer image found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching footer image:", error);
      }
    };

    fetchFooterImage();
  }, []);

  // Fetch welcome section data
  useEffect(() => {
    const fetchWelcomeData = async () => {
      try {
        // Fetch company name
        const companyRef = doc(db, "company", "details");
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          setCompanyName(companySnap.data().name || "LXXRY Hotel");
        }

        // Fetch welcome image and description
        const aboutRef = doc(db, "about", "aboutData");
        const aboutSnap = await getDoc(aboutRef);
        if (aboutSnap.exists()) {
          const aboutData = aboutSnap.data();
          setWelcomeImage(aboutData.mainImage || null); // Fetch the main image
          setWelcomeDescription(
            aboutData.description ||
              "Nestled amidst breathtaking natural beauty, our luxury hotel offers an unparalleled retreat from the ordinary."
          ); // Fetch the description
        }
      } catch (error) {
        console.error("Error fetching welcome section data:", error);
      }
    };

    fetchWelcomeData();
  }, []);

  // Fetch discounted rooms from Firestore
  useEffect(() => {
    const fetchDiscountedRooms = async () => {
      try {
        const roomsRef = collection(db, "rooms");
        const q = query(roomsRef, where("discount", ">", 0)); // Fetch rooms with discounts
        const querySnapshot = await getDocs(q);

        const rooms = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as { id: string; name: string; image: string; price: number; description: string; discount: number; guestCount?: number }[];

        setDiscountedRooms(rooms);
      } catch (error) {
        console.error("Error fetching discounted rooms:", error);
      }
    };

    fetchDiscountedRooms();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Slider */}
      <div className="h-screen relative overflow-hidden">
        <AnimatePresence mode="wait">
          {heroSlides.length > 0 && (
            <HeroSlide
              key={currentSlide}
              image={heroSlides[currentSlide].image}
              title={heroSlides[currentSlide].title}
              subtitle={heroSlides[currentSlide].subtitle}
            />
          )}
        </AnimatePresence>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? "bg-white scale-125" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Welcome Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div className="glass-card p-1 rotate-1">
                <img
                  src={welcomeImage || "https://via.placeholder.com/800"}
                  alt="Welcome Image"
                  className="rounded-xl"
                />
              </div>
            </FadeIn>

            <div>
              <SlideUp>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                  Welcome to {companyName}
                </h2>
                <p
                  className="mb-6 text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: welcomeDescription }}
                />
                <Link
                  to="/about"
                  className="btn btn-outline border-hotel-gold text-hotel-gold hover:bg-hotel-gold/10"
                >
                  Discover Our Story
                </Link>
              </SlideUp>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="hotel-container">
          <SlideUp>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Featured Accommodations</h2>
              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                Discover our most popular rooms, each crafted to provide an exceptional stay experience.
              </p>
            </div>
          </SlideUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {discountedRooms.length > 0 ? (
              discountedRooms.map((room, index) => {
                const discountedPrice = room.price - (room.price * room.discount) / 100; // Calculate discounted price
                const isDescriptionLong = room.description.length > 100; // Check if the description is too long
                return (
                  <SlideUp key={room.id} delay={index * 0.2}>
                    <div className="glass-card overflow-hidden h-full flex flex-col">
                      <div className="relative h-64 overflow-hidden">
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
                          {/* Actual Price */}
                          <div className="text-right">
                            <span className="text-gray-500 line-through text-sm mr-2">${room.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                          {isDescriptionLong ? `${room.description.slice(0, 100)}...` : room.description}
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
                        <div className="mt-4">
                          <Link to="/book" className="btn btn-sm btn-primary">
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SlideUp>
                );
              })
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-300 col-span-full">
                No discounted rooms available at the moment.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          <SlideUp>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Experience Excellence</h2>
              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                At LXXRY Hotel, we pride ourselves on providing exceptional amenities and services.
              </p>
            </div>
          </SlideUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🍽️",
                title: "Fine Dining",
                description: "Award-winning restaurants serving gourmet cuisine with locally-sourced ingredients."
              },
              {
                icon: "💆",
                title: "Luxury Spa",
                description: "Rejuvenating treatments and therapies to relax and revitalize your body and mind."
              },
              {
                icon: "🏊",
                title: "Infinity Pool",
                description: "Breathtaking infinity pool overlooking majestic mountain landscapes."
              },
              {
                icon: "🥂",
                title: "Exclusive Bar",
                description: "Sophisticated bar offering premium spirits, wines, and signature cocktails."
              },
              {
                icon: "🏋️",
                title: "Fitness Center",
                description: "State-of-the-art fitness center with personal trainers available upon request."
              },
              {
                icon: "🌳",
                title: "Private Gardens",
                description: "Serene gardens perfect for peaceful walks and quiet contemplation."
              }
            ].map((feature, index) => (
              <SlideUp key={feature.title} delay={index * 0.1}>
                <div className="glass-card p-6 h-full flex flex-col hover:shadow-xl transition-shadow">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-serif text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              </SlideUp>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-hotel-navy/90 to-hotel-charcoal/90 text-white relative">
        <div className="absolute inset-0 z-0 opacity-20">
          {footerImage ? (
            <img
              src={footerImage}
              alt="Background"
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-center text-gray-500">Loading background image...</p>
          )}
        </div>
        <div className="hotel-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <SlideUp>
              <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">
                Begin Your Luxurious Journey
              </h2>
              <p className="text-lg mb-8 text-gray-100">
                Book your stay today and experience the epitome of comfort and elegance at LXXRY Hotel.
              </p>
              <Link
                to="/book"
                className="btn btn-lg btn-primary bg-hotel-gold hover:bg-hotel-gold/90 border-none"
              >
                Book Your Stay Now
              </Link>
            </SlideUp>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
