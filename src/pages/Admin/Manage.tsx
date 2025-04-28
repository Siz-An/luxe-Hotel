import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { db, storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { X } from "lucide-react"; // Import an icon for the cross button

// Define the banner structure type
interface BannerState {
  home: string[];
  rooms: string;
  activities: string;
  gallery: string;
  about: string;
  contact: string;
  footer: string;
}

const AdminManage = () => {
  const [banners, setBanners] = useState<BannerState>({
    home: [],
    rooms: "",
    activities: "",
    gallery: "",
    about: "",
    contact: "",
    footer: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const bannerDoc = await getDoc(doc(db, "banners", "main"));
        if (bannerDoc.exists()) {
          const data = bannerDoc.data();
          setBanners({
            home: Array.isArray(data.home) ? data.home : [],
            rooms: data.rooms || "",
            activities: data.activities || "",
            gallery: data.gallery || "",
            about: data.about || "",
            contact: data.contact || "",
            footer: data.footer || "",
          });
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
        toast.error("Failed to load banner images");
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleImageUpload = async (file: File, section: string) => {
    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      const storageRef = ref(storage, `banners/${section}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      let updateData: Partial<BannerState> = {};
      if (section === "home") {
        const currentImages = [...(banners.home || [])];
        if (currentImages.length >= 4) {
          currentImages.pop();
        }
        currentImages.unshift(url);
        updateData = { home: currentImages };
      } else {
        updateData = { [section]: url } as Partial<BannerState>;
      }

      const docRef = doc(db, "banners", "main");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, updateData);
      } else {
        await setDoc(docRef, updateData);
      }

      setBanners((prev) => ({ ...prev, ...updateData }));
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} banner updated successfully`);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
    }
  };

  const handleImageRemove = async (section: string, index?: number) => {
    try {
      let updateData: Partial<BannerState> = {};
      if (section === "home" && index !== undefined) {
        const updatedImages = [...banners.home];
        updatedImages.splice(index, 1); // Remove the image at the specified index
        updateData = { home: updatedImages };
      } else {
        updateData = { [section]: "" } as Partial<BannerState>;
      }

      const docRef = doc(db, "banners", "main");
      await updateDoc(docRef, updateData);

      setBanners((prev) => ({ ...prev, ...updateData }));
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} banner removed successfully`);
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Banners</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banner Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Homepage Images (up to 4) */}
          <div className="space-y-2">
            <Label>Homepage Banners (Max 4)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "home");
              }}
            />
            <div className="grid grid-cols-2 gap-4 mt-2">
              {banners.home?.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Home banner ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleImageRemove("home", index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Single banner sections */}
          {["rooms", "activities", "gallery", "about", "contact", "footer"].map((section) => (
            <div key={section} className="space-y-2">
              <Label className="capitalize">{section} Banner</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, section);
                }}
              />
              {banners[section as keyof BannerState] && (
                <div className="relative">
                  <img
                    src={banners[section as keyof BannerState] as string}
                    alt={`${section} banner`}
                    className="w-full h-40 object-cover rounded-lg mt-2"
                  />
                  <button
                    onClick={() => handleImageRemove(section)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminManage;
