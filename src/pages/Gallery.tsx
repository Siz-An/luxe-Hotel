import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/firebase"; // Import Firebase Firestore
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const getEmbedUrl = (url: string) => {
  if (url.includes("youtube.com/watch")) {
    const videoId = new URL(url).searchParams.get("v");
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url; // Return the original URL for other video platforms
};

const GalleryPage = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [tags, setTags] = useState(["All"]);
  const [selectedTag, setSelectedTag] = useState("All");
  const [loading, setLoading] = useState(true);
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Fetch gallery items from Firestore
  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "gallery"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as { tags: string[]; images: string[]; videoLinks: string[] }),
        }));

        // Extract unique tags
        const uniqueTags = Array.from(new Set(items.flatMap((item) => item.tags)));
        setTags(["All", ...uniqueTags]);
        setGalleryItems(items);
      } catch (error) {
        console.error("Error fetching gallery items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

  // Fetch background image for the banner
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      try {
        const docRef = doc(db, "banners", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.gallery || null); // Fetch the "gallery" field
        } else {
          console.error("No background image found for gallery.");
        }
      } catch (error) {
        console.error("Error fetching background image:", error);
      }
    };

    fetchBackgroundImage();
  }, []);

  // Filter items based on selected tag
  const filteredItems =
    selectedTag === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.tags.includes(selectedTag));

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Our Gallery</h1>
            <p className="text-lg max-w-2xl mx-auto">
              Explore the beauty and elegance of LXXRY Hotel through our curated collection of photographs and videos.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Gallery Section */}
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="hotel-container">
          {loading ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-500">Loading gallery...</p>
            </div>
          ) : (
            <>
              {/* Tags Filter */}
              <div className="flex justify-center flex-wrap gap-3 mb-12">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-6 py-2 rounded-full transition-all ${
                      selectedTag === tag
                        ? "bg-hotel-gold text-white"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Gallery Grid */}
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <>
                      {item.images.map((image, index) => (
                        <motion.div
                          layout
                          key={`${item.id}-image-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="aspect-square overflow-hidden rounded-lg cursor-pointer"
                          onClick={() => setLightboxMedia(image)}
                          whileHover={{ scale: 1.03 }}
                        >
                          <img
                            src={image}
                            alt={item.tags.join(", ")}
                            className="w-full h-full object-cover transition-transform duration-500"
                          />
                        </motion.div>
                      ))}

                      {item.videoLinks.map((video, index) => (
                        <motion.div
                          layout
                          key={`${item.id}-video-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="aspect-square overflow-hidden rounded-lg cursor-pointer bg-black flex items-center justify-center relative group"
                          onClick={() => setLightboxMedia(getEmbedUrl(video))}
                        >
                          {/* Video iframe for autoplay on hover */}
                          <iframe
                            src={`${getEmbedUrl(video)}?autoplay=1&mute=1&loop=1&playlist=${new URL(video).searchParams.get("v")}`}
                            title="Video Preview"
                            className="absolute inset-0 w-full h-full rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                          ></iframe>

                          {/* Play icon (visible when not hovering) */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="w-12 h-12 text-white group-hover:opacity-0 transition-opacity duration-300"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.868v4.264a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                            />
                          </svg>
                        </motion.div>
                      ))}
                    </>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-6xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxMedia.includes("youtube.com/embed") ? (
                <iframe
                  src={lightboxMedia}
                  title="Video"
                  className="w-full h-[70vh] rounded-lg"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                ></iframe>
              ) : (
                <img
                  src={lightboxMedia}
                  alt="Enlarged view"
                  className="max-h-[90vh] object-contain"
                />
              )}
              <button
                onClick={() => setLightboxMedia(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors"
                aria-label="Close lightbox"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-6 h-6 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
