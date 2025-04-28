import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db, storage } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const aboutSchema = yup.object({
  description: yup.string(),
  yearsOfExcellence: yup.number().required("Years of Excellence is required").positive().integer(),
  roomCount: yup.number().required("Room Count is required").positive().integer(),
  guestCount: yup.number().required("Guest Count is required").positive().integer(),
  vision: yup.string().required("Vision is required"),
  mission: yup.string().required("Mission is required")
});

type AboutFormData = yup.InferType<typeof aboutSchema>;

interface AboutData extends AboutFormData {
  mainImage?: string;
  awards?: Array<{ title: string; year: number }>;
  testimonials?: Array<{
    id: string;
    name: string;
    position: string;
    comment: string;
    rating: number;
  }>;
}

const AdminAbout = () => {
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [awards, setAwards] = useState<Array<{ title: string; year: number }>>([]);
  const [testimonials, setTestimonials] = useState<Array<{
    id: string;
    name: string;
    position: string;
    comment: string;
    rating: number;
  }>>([]);
  const [newAward, setNewAward] = useState({ title: "", year: new Date().getFullYear() });
  const [newTestimonial, setNewTestimonial] = useState({
    name: "",
    position: "",
    comment: "",
    rating: 5
  });
  const [description, setDescription] = useState("");

  const form = useForm<AboutFormData>({
    resolver: yupResolver(aboutSchema),
    defaultValues: {
      yearsOfExcellence: 0,
      roomCount: 0,
      guestCount: 0,
      vision: "",
      mission: ""
    }
  });

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const docRef = doc(db, "about", "aboutData");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as AboutData;
          setAboutData(data);
          setImagePreview(data.mainImage || null);
          setAwards(data.awards || []);
          setTestimonials(data.testimonials || []);
          setDescription(data.description || "");

          form.reset({
            yearsOfExcellence: data.yearsOfExcellence,
            roomCount: data.roomCount,
            guestCount: data.guestCount,
            vision: data.vision,
            mission: data.mission
          });
        } else {
          toast.error("No About Us data found");
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
        toast.error("Failed to fetch about data");
      } finally {
        setLoading(false);
      }
    };

    fetchAboutData();
  }, [form]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        const imageRef = ref(storage, `about/mainImage`);
        await uploadBytes(imageRef, file);
        const uploadedUrl = await getDownloadURL(imageRef);

        setAboutData(prev => prev ? { ...prev, mainImage: uploadedUrl } : { mainImage: uploadedUrl } as AboutData);
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload image");
      }
    }
  };

  const handleAddAward = () => {
    if (!newAward.title.trim()) {
      toast.error("Award title is required");
      return;
    }

    setAwards([...awards, { ...newAward }]);
    setNewAward({ title: "", year: new Date().getFullYear() });
  };

  const handleRemoveAward = (index: number) => {
    const newAwards = [...awards];
    newAwards.splice(index, 1);
    setAwards(newAwards);
  };

  const handleAddTestimonial = () => {
    if (!newTestimonial.name.trim() || !newTestimonial.comment.trim()) {
      toast.error("Name and comment are required for testimonials");
      return;
    }

    setTestimonials([
      ...testimonials,
      { ...newTestimonial, id: `t${Date.now()}` }
    ]);

    setNewTestimonial({
      name: "",
      position: "",
      comment: "",
      rating: 5
    });
  };

  const handleRemoveTestimonial = (index: number) => {
    const newTestimonials = [...testimonials];
    newTestimonials.splice(index, 1);
    setTestimonials(newTestimonials);
  };

  const handleSubmit = async (formData: AboutFormData) => {
    setIsSubmitting(true);

    try {
      const updatedAboutData: AboutData = {
        ...formData,
        description,
        awards,
        testimonials,
        mainImage: aboutData?.mainImage || ""
      };

      console.log("Saving data:", updatedAboutData);

      const docRef = doc(db, "about", "aboutData");
      await setDoc(docRef, updatedAboutData);

      setAboutData(updatedAboutData);
      toast.success("About information updated successfully");
    } catch (error) {
      console.error("Error updating about information:", error);
      toast.error("Failed to update about information");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 bg-gray-200 animate-pulse w-1/3 rounded"></div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 animate-pulse w-1/4 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 animate-pulse w-2/3 rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">About Us Management</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Main Information</CardTitle>
                <CardDescription>
                  Update your hotel's main information and background
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="main-image">Main Image</Label>
                  <Input
                    id="main-image"
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
                        alt="Main hotel image"
                        className="w-full max-w-lg h-auto rounded-md object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    placeholder="Enter hotel description"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Statistics</CardTitle>
                <CardDescription>
                  Update information about your hotel's achievements and milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="yearsOfExcellence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Excellence</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="roomCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Count</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guests Served</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || '')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Awards</CardTitle>
                <CardDescription>
                  Manage your hotel's awards and recognition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {awards.length > 0 && (
                    <div className="space-y-2">
                      <Label>Current Awards:</Label>
                      <div className="space-y-2">
                        {awards.map((award, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md"
                          >
                            <div>
                              <span className="font-medium">{award.title}</span>
                              <span className="text-muted-foreground ml-2">({award.year})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAward(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Add New Award</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="award-title">Award Title</Label>
                        <Input
                          id="award-title"
                          value={newAward.title}
                          onChange={(e) => setNewAward({ ...newAward, title: e.target.value })}
                          placeholder="Best Luxury Hotel"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="award-year">Year</Label>
                        <Input
                          id="award-year"
                          type="number"
                          value={newAward.year}
                          onChange={(e) => setNewAward({ ...newAward, year: parseInt(e.target.value) || new Date().getFullYear() })}
                          min="1900"
                          max={new Date().getFullYear()}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddAward}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Award
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Vision & Mission</CardTitle>
                <CardDescription>
                  Define your hotel's vision and mission statements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="vision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vision</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter hotel vision" 
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <CardDescription>
                        A statement about your hotel's aspirations and long-term goals
                      </CardDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mission</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter hotel mission" 
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <CardDescription>
                        A statement about how your hotel aims to achieve its vision
                      </CardDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Testimonials</CardTitle>
                <CardDescription>
                  Manage guest testimonials and reviews
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonials.length > 0 && (
                  <div className="space-y-4">
                    <Label>Current Testimonials:</Label>
                    <div className="space-y-4">
                      {testimonials.map((testimonial, index) => (
                        <div 
                          key={testimonial.id} 
                          className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTestimonial(index)}
                            className="absolute top-2 right-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          <div className="flex flex-col space-y-2">
                            <div>
                              <h4 className="font-medium">{testimonial.name}</h4>
                              {testimonial.position && (
                                <p className="text-sm text-muted-foreground">{testimonial.position}</p>
                              )}
                            </div>
                            <p className="italic">"{testimonial.comment}"</p>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-lg ${i < testimonial.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-4">Add New Testimonial</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="testimonial-name">Guest Name</Label>
                        <Input
                          id="testimonial-name"
                          value={newTestimonial.name}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                          placeholder="John Smith"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="testimonial-position">Position/Type</Label>
                        <Input
                          id="testimonial-position"
                          value={newTestimonial.position}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, position: e.target.value })}
                          placeholder="Business Traveler"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="testimonial-comment">Comment</Label>
                      <Textarea
                        id="testimonial-comment"
                        value={newTestimonial.comment}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, comment: e.target.value })}
                        placeholder="Enter guest testimonial"
                        className="min-h-[100px] mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="testimonial-rating">Rating (1-5)</Label>
                      <div className="flex items-center mt-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setNewTestimonial({ ...newTestimonial, rating })}
                            className="text-2xl focus:outline-none"
                          >
                            <span className={`${rating <= newTestimonial.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleAddTestimonial}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Testimonial
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
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
                ) : "Save All Changes"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AdminAbout;
