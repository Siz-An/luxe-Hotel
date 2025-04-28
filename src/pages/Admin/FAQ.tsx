import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { db } from "@/firebase"; // Import Firebase Firestore
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

// Form schema with Yup validation
const faqSchema = yup.object({
  question: yup.string().required("Question is required"),
  answer: yup.string().required("Answer is required")
});

const AdminFAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // Initialize react-hook-form with yup validation
  const form = useForm({
    resolver: yupResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: ""
    }
  });

  // Fetch FAQs from Firestore
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "faqs"));
        const faqsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFaqs(faqsData);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
        toast.error("Failed to fetch FAQs");
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      if (editingFAQ) {
        // Update existing FAQ
        const faqDoc = doc(db, "faqs", editingFAQ.id);
        await updateDoc(faqDoc, data);
        setFaqs(faqs.map(faq => (faq.id === editingFAQ.id ? { ...data, id: editingFAQ.id } : faq)));
        toast.success("FAQ updated successfully");
      } else {
        // Add new FAQ
        const docRef = await addDoc(collection(db, "faqs"), data);
        setFaqs([{ ...data, id: docRef.id }, ...faqs]);
        toast.success("FAQ added successfully");
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error("Failed to save FAQ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (faq) => {
    setEditingFAQ(faq);

    // Set form values
    form.reset({
      question: faq.question,
      answer: faq.answer
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        const faqDoc = doc(db, "faqs", id);
        await deleteDoc(faqDoc);
        setFaqs(faqs.filter(faq => faq.id !== id));
        toast.success("FAQ deleted successfully");
      } catch (error) {
        console.error("Error deleting FAQ:", error);
        toast.error("Failed to delete FAQ");
      }
    }
  };

  const resetForm = () => {
    form.reset({
      question: "",
      answer: ""
    });
    setEditingFAQ(null);
  };

  const toggleExpandFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
        <Button 
          onClick={resetForm}
          className="bg-hotel-gold hover:bg-hotel-gold/90"
        >
          <Plus className="mr-2 h-4 w-4" /> Add New FAQ
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{editingFAQ ? "Edit FAQ" : "Add New FAQ"}</CardTitle>
          <CardDescription>
            {editingFAQ 
              ? "Edit the existing FAQ question and answer"
              : "Create a new frequently asked question and answer"
            }
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4">
              {/* Question */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input placeholder="What time is check-in and check-out?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Answer */}
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Check-in time is 2:00 PM and check-out time is 11:00 AM..." 
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                ) : editingFAQ ? "Update FAQ" : "Save FAQ"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <h2 className="text-2xl font-bold mt-8">FAQ List</h2>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="shadow animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No FAQs found. Add your first FAQ above.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <motion.div
              key={faq.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow">
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => toggleExpandFAQ(faq.id)}
                      className="flex-1 flex items-center justify-between text-left font-medium"
                    >
                      <h3 className="text-lg">{faq.question}</h3>
                      {expandedFAQ === faq.id ? (
                        <ChevronUp className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 flex-shrink-0" />
                      )}
                    </button>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(faq)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(faq.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Expandable answer */}
                  {expandedFAQ === faq.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Separator className="my-4" />
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFAQ;
