import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, Image, MessageSquare, Plus, Upload, Edit, Phone, Mail } from "lucide-react";
import { db } from "@/firebase"; // Import Firebase Firestore
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // For navigation

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [bookings, setBookings] = useState([]); // Store booking details
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize navigation

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "home":
        return <Home size={24} />;
      case "calendar":
        return <Calendar size={24} />;
      case "image":
        return <Image size={24} />;
      case "message-square":
        return <MessageSquare size={24} />;
      case "phone":
        return <Phone size={24} />;
      case "mail":
        return <Mail size={24} />;
      default:
        return null;
    }
  };

  // Fetch data from Firestore
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const roomsSnapshot = await getDocs(collection(db, "rooms"));
        const activitiesSnapshot = await getDocs(collection(db, "activities"));
        const gallerySnapshot = await getDocs(collection(db, "gallery"));

        // Fetch testimonials count from the "About Us" document
        const aboutDoc = await getDoc(doc(db, "about", "aboutData"));
        const testimonialsCount = aboutDoc.exists() && aboutDoc.data().testimonials
          ? aboutDoc.data().testimonials.length
          : 0;

        const statsData = [
          { title: "Total Rooms", value: roomsSnapshot.size, icon: "home" },
          { title: "Activities", value: activitiesSnapshot.size, icon: "calendar" },
          { title: "Gallery Items", value: gallerySnapshot.size, icon: "image" },
          { title: "Testimonials", value: testimonialsCount, icon: "message-square" }
        ];

        // Fetch recent updates
        const updates = [
          { message: "Room 'Jungle View' updated", time: "2h ago" },
          { message: "New activity 'Elephant Safari' added", time: "5h ago" },
          { message: "Gallery updated with 8 new images", time: "Yesterday" }
        ];

        // Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, "bookings"));
        const bookingsData = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStats(statsData);
        setRecentUpdates(updates);
        setBookings(bookingsData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your hotel management dashboard.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <Card key={index} className="overflow-hidden animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    {getIconComponent(stat.icon)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate("/admin/rooms")}
                className="p-3 text-sm flex flex-col items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus size={16} className="mb-1" />
                <span>New Room</span>
              </button>
              <button
                onClick={() => navigate("/admin/gallery")}
                className="p-3 text-sm flex flex-col items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Upload size={16} className="mb-1" />
                <span>Upload Photos</span>
              </button>
              <button
                onClick={() => navigate("/admin/about")}
                className="p-3 text-sm flex flex-col items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Edit size={16} className="mb-1" />
                <span>Edit About</span>
              </button>
              <button
                onClick={() => navigate("/admin/inquiries")}
                className="p-3 text-sm flex flex-col items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MessageSquare size={16} className="mb-1" />
                <span>View Inquiries</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="p-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm">
                  <strong>Customer:</strong> {`${booking.firstName} ${booking.lastName}`}
                </p>
                <p className="text-sm">
                  <strong>Room:</strong> {booking.roomName || "N/A"}
                </p>
                <p className="text-sm">
                  <strong>Phone:</strong> {booking.phone || "N/A"}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {booking.email || "N/A"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
