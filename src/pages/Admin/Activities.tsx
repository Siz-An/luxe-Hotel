import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db, storage } from "@/firebase"; // Import Firebase Firestore and Storage
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Separator } from "@/components/ui/separator";

// Form schema with Yup validation
const activitySchema = yup.object({
  name: yup.string().required("Activity name is required"),
  image: yup.mixed().required("Activity image is required"),
  description: yup.string().required("Description is required"),
  highlights: yup.string().required("Highlights are required"),
  price: yup.number().required("Price is required").positive(),
  discount: yup.number().min(0).max(100)
});

const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(null);

  // Initialize react-hook-form with yup validation
  const form = useForm({
    resolver: yupResolver(activitySchema),
    defaultValues: {
      name: "",
      image: null,
      description: "",
      highlights: "",
      price: 50,
      discount: 0
    }
  });

  // Fetch activities from Firestore
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "activities"));
        const activitiesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching activities:", error);
        toast.error("Failed to fetch activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      form.setValue("image", file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Convert highlights string to array
      const highlightsArray = data.highlights.split(",").map(highlight => highlight.trim());

      // Upload image if it's a File object (new upload)
      let imageUrl = data.image;
      if (data.image instanceof File) {
        const imageRef = ref(storage, `activities/${data.image.name}`);
        await uploadBytes(imageRef, data.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const activityData = {
        ...data,
        image: imageUrl,
        highlights: highlightsArray
      };

      if (editingActivity) {
        // Update existing activity
        const activityDoc = doc(db, "activities", editingActivity.id);
        await updateDoc(activityDoc, activityData);
        setActivities(activities.map(activity =>
          activity.id === editingActivity.id ? { ...activityData, id: editingActivity.id } : activity
        ));
        toast.success("Activity updated successfully");
      } else {
        // Add new activity
        const docRef = await addDoc(collection(db, "activities"), activityData);
        setActivities([{ ...activityData, id: docRef.id }, ...activities]);
        toast.success("Activity added successfully");
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setImagePreview(activity.image);

    // Set form values
    form.reset({
      name: activity.name,
      image: activity.image,
      description: activity.description,
      highlights: activity.highlights.join(", "),
      price: activity.price,
      discount: activity.discount
    });
  };

  const handleDelete = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        const activityDoc = doc(db, "activities", id);
        await deleteDoc(activityDoc);

        if (imageUrl) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        }

        setActivities(activities.filter(activity => activity.id !== id));
        toast.success("Activity deleted successfully");
      } catch (error) {
        console.error("Error deleting activity:", error);
        toast.error("Failed to delete activity");
      }
    }
  };

  const resetForm = () => {
    form.reset({
      name: "",
      image: null,
      description: "",
      highlights: "",
      price: 50,
      discount: 0
    });
    setEditingActivity(null);
    setImagePreview(null);
  };

  const toggleExpand = (id) => {
    setExpandedActivity(expandedActivity === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Activity Management</h1>
        <Button 
          onClick={resetForm}
          className="bg-hotel-gold hover:bg-hotel-gold/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Activity
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingActivity ? "Edit Activity" : "Add New Activity"}</CardTitle>
          <CardDescription>
            {editingActivity 
              ? `You are editing "${editingActivity.name}"`
              : "Create a new activity with details and image"
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Activity Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Elephant Safari" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Discount */}
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <CardDescription>Discount percentage (0-100%)</CardDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Highlights */}
              <FormField
                control={form.control}
                name="highlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highlights</FormLabel>
                    <FormControl>
                      <Input placeholder="Wildlife Spotting, Guided Tour, Photo Opportunities" {...field} />
                    </FormControl>
                    <CardDescription>Enter highlights separated by commas</CardDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter activity description" 
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
                <Label htmlFor="activity-image">Activity Image</Label>
                <Input
                  id="activity-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {form.formState.errors.image && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.image.message}</p>
                )}
                
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
                    <img
                      src={imagePreview}
                      alt="Activity preview"
                      className="w-full max-w-md h-auto rounded-md object-cover"
                    />
                  </div>
                )}
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
                ) : editingActivity ? "Update Activity" : "Save Activity"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <h2 className="text-2xl font-bold mt-8">Activity Listings</h2>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-24 bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No activities found. Add your first activity above.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/4 h-48 md:h-auto relative">
                    <img 
                      src={activity.image} 
                      alt={activity.name}
                      className="w-full h-full object-cover"
                    />
                    {activity.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {activity.discount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold text-lg">{activity.name}</h3>
                      <div className="flex space-x-1">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(activity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleDelete(activity.id, activity.image)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-baseline mb-2">
                      {activity.discount > 0 ? (
                        <>
                          <span className="text-lg font-bold mr-2">
                            ${(activity.price * (1 - activity.discount / 100)).toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ${activity.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold">${activity.price.toFixed(2)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {activity.description}
                    </p>
                    <div className="flex flex-wrap gap-1 my-2">
                      {activity.highlights.map((highlight, i) => (
                        <span 
                          key={i} 
                          className="inline-block bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-xs"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleExpand(activity.id)}
                      className="mt-2 text-muted-foreground flex items-center p-0 h-auto"
                    >
                      {expandedActivity === activity.id ? (
                        <>Less details <ChevronUp className="ml-1 h-4 w-4" /></>
                      ) : (
                        <>More details <ChevronDown className="ml-1 h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Expandable details section */}
                {expandedActivity === activity.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 pb-4"
                  >
                    <Separator className="my-4" />
                    <div className="prose dark:prose-invert max-w-none">
                      <h4 className="text-lg font-medium mb-2">Description</h4>
                      <p>{activity.description}</p>
                      
                      <h4 className="text-lg font-medium mt-4 mb-2">Highlights</h4>
                      <ul className="list-disc pl-5">
                        {activity.highlights.map((highlight, i) => (
                          <li key={i}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminActivities;
