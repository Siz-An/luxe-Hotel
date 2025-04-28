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
import { Plus, Edit, Trash2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db, storage } from "@/firebase"; // Updated import path for Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Form schema with Yup validation
const roomSchema = yup.object({
  name: yup.string().required("Room name is required"),
  image: yup.mixed().required("Room image is required"),
  guests: yup.number().required("Number of guests is required").positive().integer(),
  features: yup.string().required("Features are required"),
  price: yup.number().required("Price is required").positive(),
  discount: yup.number().min(0).max(100),
  description: yup.string().required("Description is required")
});

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: yupResolver(roomSchema),
    defaultValues: {
      name: "",
      image: null,
      guests: 2,
      features: "",
      price: 100,
      discount: 0,
      description: ""
    }
  });

  // Fetch rooms from Firestore
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "rooms"));
        const roomsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(roomsData);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Failed to fetch rooms");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
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
      const featuresArray = data.features.split(",").map(feature => feature.trim());
      let imageUrl = data.image;

      if (data.image instanceof File) {
        const imageRef = ref(storage, `rooms/${data.image.name}`);
        await uploadBytes(imageRef, data.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const roomData = {
        ...data,
        image: imageUrl,
        features: featuresArray
      };

      if (editingRoom) {
        const roomDoc = doc(db, "rooms", editingRoom.id);
        await updateDoc(roomDoc, roomData);
        setRooms(rooms.map(room => (room.id === editingRoom.id ? { ...roomData, id: editingRoom.id } : room)));
        toast.success("Room updated successfully");
      } else {
        const docRef = await addDoc(collection(db, "rooms"), roomData);
        setRooms([{ ...roomData, id: docRef.id }, ...rooms]);
        toast.success("Room added successfully");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Failed to save room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setImagePreview(room.image);

    form.reset({
      name: room.name,
      image: room.image,
      guests: room.guests,
      features: room.features.join(", "),
      price: room.price,
      discount: room.discount,
      description: room.description
    });
  };

  const handleDelete = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        const roomDoc = doc(db, "rooms", id);
        await deleteDoc(roomDoc);

        if (imageUrl) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        }

        setRooms(rooms.filter(room => room.id !== id));
        toast.success("Room deleted successfully");
      } catch (error) {
        console.error("Error deleting room:", error);
        toast.error("Failed to delete room");
      }
    }
  };

  const resetForm = () => {
    form.reset({
      name: "",
      image: null,
      guests: 2,
      features: "",
      price: 100,
      discount: 0,
      description: ""
    });
    setEditingRoom(null);
    setImagePreview(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
        <Button 
          onClick={resetForm}
          className="bg-hotel-gold hover:bg-hotel-gold/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Room
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingRoom ? "Edit Room" : "Add New Room"}</CardTitle>
          <CardDescription>
            {editingRoom 
              ? `You are editing "${editingRoom.name}"`
              : "Create a new room with details and image"
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Deluxe Room" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Guests */}
                <FormField
                  control={form.control}
                  name="guests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guests</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || '')}
                        />
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
              
              {/* Features */}
              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <FormControl>
                      <Input placeholder="King Bed, Mountain View, Balcony, Free WiFi" {...field} />
                    </FormControl>
                    <CardDescription>Enter features separated by commas</CardDescription>
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
                        placeholder="Enter room description" 
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
                <Label htmlFor="image">Room Image</Label>
                <Input
                  id="image"
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
                      alt="Room preview"
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
                ) : editingRoom ? "Update Room" : "Save Room"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <h2 className="text-2xl font-bold mt-8">Room Listings</h2>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="flex flex-col h-full">
              <div className="h-48 bg-gray-200 animate-pulse rounded-t-lg"></div>
              <CardContent className="flex-1 pt-4">
                <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-4/5"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No rooms found. Add your first room above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <Card className="flex flex-col h-full overflow-hidden">
                <div className="relative h-48">
                  <img 
                    src={room.image} 
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                      onClick={() => handleEdit(room)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-red-500 text-white hover:bg-red-600"
                      onClick={() => handleDelete(room.id, room.image)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {room.discount > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      {room.discount}% OFF
                    </span>
                  )}
                </div>
                <CardContent className="flex-1 pt-4">
                  <h3 className="font-semibold text-lg line-clamp-1">{room.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">Guests: {room.guests}</p>
                  <div className="flex items-baseline mb-2">
                    {room.discount > 0 ? (
                      <>
                        <span className="text-lg font-bold mr-2">
                          ${(room.price * (1 - room.discount / 100)).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${room.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">${room.price.toFixed(2)}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{room.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.features.slice(0, 3).map((feature, i) => (
                      <span 
                        key={i} 
                        className="inline-block bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                    {room.features.length > 3 && (
                      <span className="inline-block bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-xs">
                        +{room.features.length - 3} more
                      </span>
                    )}
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

export default AdminRooms;
