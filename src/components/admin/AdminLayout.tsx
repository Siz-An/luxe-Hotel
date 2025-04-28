import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Home,
  Image,
  Calendar,
  Info,
  HelpCircle,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Circle,
  BookOpen,
  Settings,
} from "lucide-react";

// Define the user type to match your Firestore structure
type AdminUser = {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
};

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [user, setUser] = useState<AdminUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuth") === "true";
    const storedUser = localStorage.getItem("adminUser");

    if (!isAuthenticated || !storedUser) {
      navigate("/admin");
      return;
    }

    try {
      const userData = JSON.parse(storedUser) as AdminUser;

      // Verify the user has admin privileges
      if (!userData.isAdmin) {
        localStorage.removeItem("adminAuth");
        localStorage.removeItem("adminUser");
        navigate("/admin");
        return;
      }

      // Set user data
      setUser(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("adminUser");
      navigate("/admin");
    }
  }, [navigate]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  const menuItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/admin/bookings", label: "Bookings", icon: <BookOpen size={20} /> },
    { path: "/admin/rooms", label: "Rooms", icon: <Home size={20} /> },
    { path: "/admin/activities", label: "Activities", icon: <Calendar size={20} /> },
    { path: "/admin/gallery", label: "Gallery", icon: <Image size={20} /> },
    { path: "/admin/about", label: "About Us", icon: <Info size={20} /> },
    { path: "/admin/faq", label: "FAQ", icon: <HelpCircle size={20} /> },
    { path: "/admin/contact", label: "Contact", icon: <MessageSquare size={20} /> },
    { path: "/admin/manage", label: "Manage", icon: <Settings size={20} /> },
  ];

  // If still checking authentication or not authenticated, show nothing
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <motion.aside
        className={`${
          isMobile ? "fixed top-0 left-0 h-full z-30" : "relative"
        } bg-white dark:bg-gray-800 shadow-lg overflow-y-auto transition-all duration-300`}
        initial={isMobile ? { x: -320 } : false}
        animate={{
          x: isSidebarOpen ? 0 : isMobile ? -320 : 0,
          width: isSidebarOpen ? 240 : 70,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2
            className={`text-xl font-semibold text-gray-800 dark:text-white transition-all duration-200`}
          >
            {isSidebarOpen ? "Hotel Admin" : "HA"}
          </h2>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${
                  isSidebarOpen ? "px-4 py-3" : "justify-center py-4"
                } rounded-md transition-all ${
                  isActive
                    ? "bg-hotel-gold text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {/* Always show the icon */}
                <div className="flex items-center justify-center w-6 h-6">
                  {item.icon}
                </div>
                {/* Show the label only when the sidebar is open */}
                {isSidebarOpen && (
                  <span className="ml-3 transition-opacity duration-200">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              isSidebarOpen ? "px-4 py-3" : "justify-center py-4"
            } mt-8 rounded-md transition-all text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700`}
          >
            <LogOut size={20} />
            {isSidebarOpen && (
              <span className="ml-3 transition-opacity duration-200">Logout</span>
            )}
          </button>
        </nav>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Menu toggle button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Menu size={20} />
            </button>

            {/* Header right items */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.displayName}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
