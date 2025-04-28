import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import HomePage from "@/pages/Index";
import RoomsPage from "@/pages/Rooms";
import ActivitiesPage from "@/pages/Activities";
import GalleryPage from "@/pages/Gallery";
import AboutPage from "@/pages/About";
import ContactPage from "@/pages/Contact";
import BookPage from "@/pages/Book";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/Admin/Login";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminBookings from "@/pages/Admin/Bookings";
import AdminRooms from "@/pages/Admin/Rooms";
import AdminActivities from "@/pages/Admin/Activities";
import AdminGallery from "@/pages/Admin/Gallery";
import AdminAbout from "@/pages/Admin/About";
import AdminFAQ from "@/pages/Admin/FAQ";
import AdminContact from "@/pages/Admin/Contact";
import AdminManage from "@/pages/Admin/Manage";
import AdminCompanyDetails from "@/pages/Admin/CompanyDetails";
import AdminFeatures from "@/pages/Admin/Features";
import BookingSearch from "@/pages/BookingSearch";

const queryClient = new QueryClient();

const isAuthenticated = () => {
  return localStorage.getItem("adminAuth") === "true" && localStorage.getItem("adminUser") !== null;
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="hotel-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/booking-search" element={<BookingSearch />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="rooms" element={<AdminRooms />} />
              <Route path="activities" element={<AdminActivities />} />
              <Route path="features" element={<AdminFeatures />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="about" element={<AdminAbout />} />
              <Route path="faq" element={<AdminFAQ />} />
              <Route path="contact" element={<AdminContact />} />
              <Route path="manage" element={<AdminManage />} />
              <Route path="company" element={<AdminCompanyDetails />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
