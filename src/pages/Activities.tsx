import { useState, useEffect } from "react";
import { FadeIn, SlideUp } from "@/components/motion-wrapper";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { db } from "@/firebase"; // Import Firebase Firestore
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const ActivityCard = ({ activity, index }: { activity: any, index: number }) => {
  // Calculate the discounted price if a discount is available
  const discountedPrice = activity.discount
    ? (activity.price - (activity.price * activity.discount) / 100).toFixed(2)
    : activity.price.toFixed(2);

  return (
    <SlideUp delay={index * 0.1} className="h-full">
      <div className="glass-card h-full overflow-hidden">
        <div className="h-64 overflow-hidden flex items-center justify-center bg-gray-100">
          <motion.img 
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
            src={activity.image} 
            alt={activity.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6">
          <h3 className="font-serif text-2xl font-bold mb-3">{activity.name}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{activity.description}</p>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Highlights:</h4>
            <div className="grid grid-cols-2 gap-2">
              {activity.highlights.map((feature: string) => (
                <div key={feature} className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-2 text-hotel-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">Price:</h4>
            {activity.discount ? (
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-hotel-gold">${discountedPrice}</span>
                <span className="text-sm line-through text-gray-500">${activity.price.toFixed(2)}</span>
                <span className="text-sm text-green-600">({activity.discount}% off)</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-hotel-gold">${activity.price.toFixed(2)}</span>
            )}
          </div>
          
          <div className="flex justify-end">
            <Link 
              to={`/book?activity=${activity.id}`} 
              className="btn btn-sm btn-primary"
            >
              Book This Activity
            </Link>
          </div>
        </div>
      </div>
    </SlideUp>
  );
};

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Fetch activities from Firestore
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "activities"));
        const activitiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Fetch background image for the section
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        const docRef = doc(db, "banners", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.activities || null); // Fetch the "activities" field
        } else {
          console.error("No background image found for activities.");
        }
      } catch (error) {
        console.error("Error fetching background image:", error);
      }
    };

    fetchBackgroundImage();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div
        className="relative text-white h-[40vh] flex items-center justify-center"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="hotel-container relative z-10 text-center">
          <SlideUp>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Our Activities
            </h1>
            <p className="text-lg max-w-2xl mx-auto">
              Discover the wide range of activities and experiences available at LXXRY Hotel, designed to make your stay memorable.
            </p>
          </SlideUp>
        </div>
      </div>

      {/* Activities Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          {loading ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-500">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-500">No activities available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map((activity, index) => (
                <ActivityCard key={activity.id} activity={activity} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-hotel-navy/90 to-hotel-charcoal/90 text-white relative">
        <div className="absolute inset-0 z-0 opacity-20">
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt="Background"
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-center text-gray-500">Loading background image...</p>
          )}
        </div>
        <div className="hotel-container relative z-10">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                Curate Your Perfect Experience
              </h2>
              <p className="text-lg mb-8 text-gray-100">
                Our concierge team is available to help you create a customized itinerary tailored to your preferences.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/contact"
                  className="btn btn-lg btn-outline border-white text-white hover:bg-white/10"
                >
                  Contact Concierge
                </Link>
                <Link to="/book" className="btn btn-lg btn-primary">
                  Book Activities
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
};

export default ActivitiesPage;
