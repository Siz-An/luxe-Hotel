import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

const Layout = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Determine if the navbar should be transparent
  const transparentRoutes = ["/", "/rooms", "/booking-search", "/activities", "/gallery", "/about", "/contact", "/book"];
  const isTransparentNavbar = transparentRoutes.includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isTransparentNavbar && !scrolled
            ? "bg-transparent"
            : "bg-white/80 dark:bg-gray-900/80 shadow-md nav-blur backdrop-blur-sm"
        }`}
      >
        <div className="hotel-container">
          <div className="flex h-20 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-serif text-2xl font-bold text-hotel-gold">LXXRY</span>
              <span className="font-serif italic">Hotel</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="font-medium hover:text-hotel-gold transition-colors">
                Home
              </Link>
              <Link to="/rooms" className="font-medium hover:text-hotel-gold transition-colors">
                Rooms
              </Link>
              <Link to="/booking-search" className="font-medium hover:text-hotel-gold transition-colors">
                Booking Details
              </Link>
              <Link to="/activities" className="font-medium hover:text-hotel-gold transition-colors">
                Activities
              </Link>
              <Link to="/gallery" className="font-medium hover:text-hotel-gold transition-colors">
                Gallery
              </Link>
              <Link to="/about" className="font-medium hover:text-hotel-gold transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="font-medium hover:text-hotel-gold transition-colors">
                Contact
              </Link>
              <ThemeToggle />
              <Link to="/book" className="btn btn-primary">
                Book Now
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden glass-morphism"
            >
              <div className="p-4 flex flex-col space-y-4">
                <Link
                  to="/"
                  className="font-medium p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/rooms"
                  className="font-medium p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Rooms
                </Link>
                <Link
                  to="/booking-search"
                  className="font-medium p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Booking Details
                </Link>
                <Link
                  to="/activities"
                  className="font-medium p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Activities
                </Link>
                <Link
                  to="/gallery"
                  className="font-medium p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Gallery
                </Link>
                <Link
                  to="/about"
                  className="font-medium p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="font-medium p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  to="/book"
                  className="btn btn-primary w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book Now
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="hotel-container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="font-serif text-2xl font-bold text-hotel-gold">LXXRY</span>
                <span className="font-serif italic">Hotel</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Experience luxury and comfort at our exclusive hotel. With premium amenities and exceptional service, we guarantee an unforgettable stay.
              </p>
            </div>

            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="hover:text-hotel-gold transition-colors">Home</Link></li>
                <li><Link to="/rooms" className="hover:text-hotel-gold transition-colors">Rooms</Link></li>
                <li><Link to="/gallery" className="hover:text-hotel-gold transition-colors">Gallery</Link></li>
                <li><Link to="/about" className="hover:text-hotel-gold transition-colors">About Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Activities</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/activities" className="hover:text-hotel-gold transition-colors">Spa</Link></li>
                <li><Link to="/activities" className="hover:text-hotel-gold transition-colors">Pool</Link></li>
                <li><Link to="/activities" className="hover:text-hotel-gold transition-colors">Trekking</Link></li>
                <li><Link to="/activities" className="hover:text-hotel-gold transition-colors">Fine Dining</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-sm mb-2">+1 26 158 418152</p>
              <p className="text-sm mb-2">06, Tokha, Kathmandu</p>
              <p className="text-sm mb-4">reservations@lxxryhotel.com</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-500 hover:text-hotel-gold">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-hotel-gold">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.045-1.064.218-1.504.344-1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-hotel-gold">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-sm text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} LXXRY Hotel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
