import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Video, Image, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db, storage } from "@/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const gallerySchema = yup.object({
  title: yup.string().required("Title is required"),
  tags: yup.string().required("Tags are required"),
  videoLinks: yup.string()
});

interface GalleryItem {
  id: string;
  title: string;
  tags: string[];
  images: string[];
  videoLinks: string[];
}

const AdminGallery = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoLinks, setVideoLinks] = useState<string[]>([""]);

  const form = useForm({
    resolver: yupResolver(gallerySchema),
    defaultValues: {
      title: "",
      tags: "",
      videoLinks: ""
    }
  });

  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "gallery"));
        const items = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as GalleryItem[];
        setGalleryItems(items);
      } catch (error) {
        console.error("Error fetching gallery items:", error);
        toast.error("Failed to fetch gallery items");
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviewUrls = [...imagePreviewUrls];

    URL.revokeObjectURL(newPreviewUrls[index]);

    newFiles.splice(index, 1);
    newPreviewUrls.splice(index, 1);

    setSelectedFiles(newFiles);
    setImagePreviewUrls(newPreviewUrls);
  };

  const handleAddVideoLink = () => {
    setVideoLinks([...videoLinks, ""]);
  };

  const handleVideoLinkChange = (index: number, value: string) => {
    const newVideoLinks = [...videoLinks];
    newVideoLinks[index] = value;
    setVideoLinks(newVideoLinks);
  };

  const removeVideoLink = (index: number) => {
    const newVideoLinks = [...videoLinks];
    newVideoLinks.splice(index, 1);
    setVideoLinks(newVideoLinks);
  };

  const handleSubmit = async (data: { title: string; tags: string; videoLinks: string }) => {
    setIsSubmitting(true);

    try {
      const tagsArray = data.tags.split(",").map(tag => tag.trim());

      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const imageRef = ref(storage, `gallery/${file.name}`);
          await uploadBytes(imageRef, file);
          return await getDownloadURL(imageRef);
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      const filteredVideoLinks = videoLinks.filter(link => link.trim() !== "");

      const galleryData = {
        title: data.title,
        tags: tagsArray,
        images: imageUrls,
        videoLinks: filteredVideoLinks
      };

      if (editingItem) {
        const galleryDoc = doc(db, "gallery", editingItem.id);
        await updateDoc(galleryDoc, {
          ...galleryData,
          images: [...(editingItem.images || []), ...imageUrls]
        });

        const updatedItem = {
          ...editingItem,
          title: data.title,
          tags: tagsArray,
          images: [...(editingItem.images || []), ...imageUrls],
          videoLinks: filteredVideoLinks
        };

        setGalleryItems(galleryItems.map(item =>
          item.id === editingItem.id ? updatedItem : item
        ));
        toast.success("Gallery item updated successfully");
      } else {
        const docRef = await addDoc(collection(db, "gallery"), galleryData);
        setGalleryItems([{ ...galleryData, id: docRef.id } as GalleryItem, ...galleryItems]);
        toast.success("Gallery item added successfully");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving gallery item:", error);
      toast.error("Failed to save gallery item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);

    form.reset({
      title: item.title,
      tags: item.tags.join(", ")
    });

    setVideoLinks(item.videoLinks.length > 0 ? item.videoLinks : [""]);

    setSelectedFiles([]);
    setImagePreviewUrls([]);
  };

  const handleDeleteImage = async (itemId: string, imageUrl: string, index: number) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);

      const updatedGalleryItems = galleryItems.map(item => {
        if (item.id === itemId) {
          const newImages = [...item.images];
          newImages.splice(index, 1);
          return { ...item, images: newImages };
        }
        return item;
      });

      setGalleryItems(updatedGalleryItems);

      if (editingItem && editingItem.id === itemId) {
        const newImages = [...editingItem.images];
        newImages.splice(index, 1);
        setEditingItem({ ...editingItem, images: newImages });
      }

      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this gallery item?")) {
      try {
        const itemToDelete = galleryItems.find(item => item.id === id);

        if (itemToDelete && itemToDelete.images && itemToDelete.images.length > 0) {
          for (const imageUrl of itemToDelete.images) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          }
        }

        const galleryDoc = doc(db, "gallery", id);
        await deleteDoc(galleryDoc);

        setGalleryItems(galleryItems.filter(item => item.id !== id));
        toast.success("Gallery item deleted successfully");
      } catch (error) {
        console.error("Error deleting gallery item:", error);
        toast.error("Failed to delete gallery item");
      }
    }
  };

  const resetForm = () => {
    form.reset({
      title: "",
      tags: ""
    });

    setEditingItem(null);
    setSelectedFiles([]);

    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImagePreviewUrls([]);

    setVideoLinks([""]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gallery Management</h1>
        <Button 
          onClick={resetForm}
          className="bg-hotel-gold hover:bg-hotel-gold/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Gallery Item
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "Edit Gallery Item" : "Add New Gallery Item"}</CardTitle>
          <CardDescription>
            {editingItem 
              ? `You are editing "${editingItem.title}"`
              : "Create a new gallery item with images and videos"
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Luxury Rooms" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="Rooms, Luxury, Interior" {...field} />
                    </FormControl>
                    <CardDescription>Enter tags separated by commas</CardDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label htmlFor="gallery-images">Upload Images</Label>
                <Input
                  id="gallery-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="cursor-pointer"
                />
                <CardDescription>You can select multiple images at once</CardDescription>
              </div>
              
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>New Image Previews:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {editingItem && editingItem.images && editingItem.images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Existing Images:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {editingItem.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-contain rounded-md bg-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(editingItem.id, url, index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Video Links</Label>
                <CardDescription>Add YouTube or other video platform links</CardDescription>
                
                {videoLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={link}
                      onChange={(e) => handleVideoLinkChange(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeVideoLink(index)}
                      disabled={videoLinks.length === 1 && videoLinks[0] === ""}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddVideoLink}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Video Link
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-hotel-gold hover:bg-hotel-gold/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : editingItem ? "Update Gallery Item" : "Save Gallery Item"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <h2 className="text-2xl font-bold mt-8">Gallery Items</h2>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : galleryItems.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No gallery items found. Add your first item above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden h-full flex flex-col">
                <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                  {item.images && item.images.length > 0 ? (
                    <img 
                      src={item.images[0]} 
                      alt={item.title}
                      className="w-full h-full object-cover" // Changed from object-contain to object-cover
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {item.images && item.images.length > 1 && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                      <Image className="h-3 w-3 mr-1" />
                      {item.images.length}
                    </div>
                  )}
                  
                  {item.videoLinks && item.videoLinks.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-red-500/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                      <Video className="h-3 w-3 mr-1" />
                      {item.videoLinks.length}
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="inline-block bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
