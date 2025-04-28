import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FadeIn, SlideUp } from "@/components/motion-wrapper";
import { db } from "@/firebase"; // Import Firebase Firestore
import { doc, getDoc } from "firebase/firestore";

const Counter = ({ value, suffix, text }: { value: number; suffix?: string; text: string }) => {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-hotel-gold mb-2">
        {value}
        {suffix || ""}
      </div>
      <p className="text-gray-600 dark:text-gray-300">{text}</p>
    </div>
  );
};

const AboutPage = () => {
  const [aboutData, setAboutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Fetch about data from Firestore
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const docRef = doc(db, "about", "aboutData");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAboutData(docSnap.data());
        } else {
          console.error("No About Us data found");
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, []);

  // Fetch background image for the banner
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        const docRef = doc(db, "banners", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.about || null); // Fetch the "about" field
        } else {
          console.error("No background image found for about.");
        }
      } catch (error) {
        console.error("Error fetching background image:", error);
      }
    };

    fetchBackgroundImage();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % (aboutData?.testimonials?.length || 1));
    }, 8000);

    return () => clearInterval(interval);
  }, [aboutData]);

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

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
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-lg max-w-2xl mx-auto">
              LXXRY Hotel blends modern style with cozy comfort in the heart of the city. Enjoy
              premium rooms, great dining, and warm, personalized service — your perfect escape
              awaits.
            </p>
          </SlideUp>
        </div>
      </div>

      {/* Our Story */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div className="glass-card p-1 rotate-1">
                <img
                  src={aboutData?.mainImage || "https://via.placeholder.com/800"}
                  alt="Hotel View"
                  className="rounded-xl"
                />
              </div>
            </FadeIn>

            <div>
              <SlideUp>
                <h2 className="font-serif text-3xl font-bold mb-6">Our Story</h2>
                <p
                  className="text-lg text-center max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{
                    __html: aboutData?.description || "Discover the story behind our hotel.",
                  }}
                />
              </SlideUp>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="hotel-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Counter value={aboutData?.yearsOfExcellence || 0} text="Years of Excellence" />
            <Counter value={aboutData?.roomCount || 0} suffix="+" text="Luxury Rooms" />
            <Counter value={aboutData?.guestCount || 0} suffix="+" text="Happy Guests" />
            <Counter value={aboutData?.awards?.length || 0} text="Industry Awards" />
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          <div className="text-center mb-12">
            <SlideUp>
              <h2 className="font-serif text-3xl font-bold mb-4">Our Awards</h2>
              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                Recognizing our excellence in hospitality and service.
              </p>
            </SlideUp>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aboutData?.awards?.length > 0 ? (
              aboutData.awards.map((award: { title: string; year: number }, index: number) => (
                <SlideUp key={index}>
                  <div className="glass-card p-6 text-center">
                    <h3 className="font-serif text-xl font-bold mb-2">{award.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">Awarded in {award.year}</p>
                  </div>
                </SlideUp>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-300 text-center col-span-full">
                No awards have been added yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          <div className="grid md:grid-cols-2 gap-12">
            <SlideUp>
              <div className="glass-card p-8 h-full">
                <div className="text-3xl mb-6">🎯</div>
                <h3 className="font-serif text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {aboutData?.mission || "Our mission is to provide exceptional hospitality."}
                </p>
              </div>
            </SlideUp>

            <SlideUp delay={0.2}>
              <div className="glass-card p-8 h-full">
                <div className="text-3xl mb-6">👁️</div>
                <h3 className="font-serif text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {aboutData?.vision || "Our vision is to be the epitome of luxury hospitality."}
                </p>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-gray-50 dark:bg-gray-800">
        <div className="hotel-container">
          <div className="text-center mb-12">
            <SlideUp>
              <h2 className="font-serif text-3xl font-bold mb-4">Guest Testimonials</h2>
              <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                Hear what our guests have to say about their experiences.
              </p>
            </SlideUp>
          </div>

          <div className="relative h-[360px] md:h-[300px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {aboutData?.testimonials?.map((testimonial: any, index: number) => (
                <motion.div
                  key={testimonial.id}
                  initial={false}
                  animate={{
                    opacity: activeTestimonial === index ? 1 : 0,
                    x: activeTestimonial === index ? 0 : activeTestimonial > index ? -100 : 100,
                    scale: activeTestimonial === index ? 1 : 0.8,
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 max-w-3xl mx-auto"
                >
                  <div className="glass-card p-8 text-center">
                    {/* Replace image with an icon */}
                    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-hotel-gold flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-12 h-12 text-hotel-gold"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 21v-2c0-2.21 1.79-4 4-4h4c2.21 0 4 1.79 4 4v2"
                        />
                      </svg>
                    </div>
                    <p className="text-lg mb-6 italic">"{testimonial.comment}"</p>
                    <div>
                      <h4 className="font-serif font-bold">{testimonial.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {aboutData?.testimonials?.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeTestimonial === index ? "bg-hotel-gold scale-150" : "bg-gray-400"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
