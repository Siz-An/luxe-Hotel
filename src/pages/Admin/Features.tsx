import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db, storage } from "@/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Form schema
const featureSchema = yup.object({
  name: yup.string().required("Feature name is required"),
  image: yup.mixed().required("Feature image is required"),
  description: yup.string().required("Description is required"),
  category: yup.string().required("Category is required"),
  isActive: yup.boolean().default(true),
  ordering: yup.number().default(0)
});

const AdminFeatures = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: yupResolver(featureSchema),
    defaultValues: {
      name: "",
      image: null,
      description: "",
      category: "amenity",
      isActive: true,
      ordering: 0
    }
  });

  // Fetch features from Firestore
  const fetchFeatures = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "features"));
      const featuresData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Fetched Features:", featuresData); // Debugging log
      setFeatures(featuresData);
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("Failed to fetch features");
    } finally {
      setLoading(false);
    }
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      form.setValue("image", file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      let imageUrl = data.image;

      if (data.image instanceof File) {
        const imageRef = ref(storage, `features/${data.image.name}`);
        await uploadBytes(imageRef, data.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const featureData = {
        ...data,
        image: imageUrl,
        updatedAt: new Date().toISOString()
      };

      if (editingFeature) {
        const featureDoc = doc(db, "features", editingFeature.id);
        await updateDoc(featureDoc, featureData);
        setFeatures(features.map(feature => 
          feature.id === editingFeature.id ? { ...featureData, id: editingFeature.id } : feature
        ));
        toast.success("Feature updated successfully");
      } else {
        const docRef = await addDoc(collection(db, "features"), {
          ...featureData,
          createdAt: new Date().toISOString()
        });
        setFeatures([{ ...featureData, id: docRef.id }, ...features]);
        toast.success("Feature added successfully");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving feature:", error);
      toast.error("Failed to save feature");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (feature) => {
    setEditingFeature(feature);
    setImagePreview(feature.image);
    form.reset({
      name: feature.name,
      image: feature.image,
      description: feature.description,
      category: feature.category,
      isActive: feature.isActive,
      ordering: feature.ordering
    });
  };

  // Handle delete
  const handleDelete = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this feature?")) {
      try {
        const featureDoc = doc(db, "features", id);
        await deleteDoc(featureDoc);

        if (imageUrl) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        }

        setFeatures(features.filter(feature => feature.id !== id));
        toast.success("Feature deleted successfully");
      } catch (error) {
        console.error("Error deleting feature:", error);
        toast.error("Failed to delete feature");
      }
    }
  };

  // Reset form
  const resetForm = () => {
    form.reset({
      name: "",
      image: null,
      description: "",
      category: "amenity",
      isActive: true,
      ordering: 0
    });
    setEditingFeature(null);
    setImagePreview(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Hotel Features & Amenities</h1>
        <Button 
          onClick={resetForm}
          className="bg-hotel-gold hover:bg-hotel-gold/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Feature
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingFeature ? "Edit Feature" : "Add New Feature"}</CardTitle>
          <CardDescription>
            {editingFeature 
              ? `You are editing "${editingFeature.name}"`
              : "Add a new hotel feature or amenity"
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Swimming Pool" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-hotel-gold"
                          {...field}
                        >
                          <option value="amenity">Amenity</option>
                          <option value="facility">Facility</option>
                          <option value="service">Service</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter feature description" 
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Feature Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Feature preview"
                      className="w-full max-w-md h-auto rounded-md object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Is Active */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
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
                ) : editingFeature ? "Update Feature" : "Save Feature"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Features List */}
      <h2 className="text-2xl font-bold mt-8">Features List</h2>
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">Loading features...</p>
        </div>
      ) : features.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No features found. Add your first feature above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="flex flex-col h-full">
                <div className="relative h-48">
                  <img 
                    src={feature.image} 
                    alt={feature.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                      onClick={() => handleEdit(feature)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600"
                      onClick={() => handleDelete(feature.id, feature.image)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {!feature.isActive && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </div>
                <CardContent className="flex-1 pt-4">
                  <h3 className="font-semibold text-lg mb-2">{feature.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Category: {feature.category.charAt(0).toUpperCase() + feature.category.slice(1)}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeatures;
