
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building, Mail, Phone, MapPin, FileText, Facebook, Instagram, Twitter } from "lucide-react";
import { db, storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

interface CompanyDetails {
  name: string;
  logo: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

const AdminCompanyDetails = () => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<CompanyDetails>({
    name: "",
    logo: "",
    email: "",
    phone: "",
    location: "",
    description: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const docRef = doc(db, "company", "details");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setDetails(docSnap.data() as CompanyDetails);
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
        toast.error("Failed to load company details");
      }
    };

    fetchCompanyDetails();
  }, []);

  const handleLogoUpload = async (file: File) => {
    try {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      const storageRef = ref(storage, `company/logo/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setDetails((prev) => ({
        ...prev,
        logo: url,
      }));

      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = doc(db, "company", "details");
      await setDoc(docRef, details);
      toast.success("Company details updated successfully");
    } catch (error) {
      console.error("Error updating company details:", error);
      toast.error("Failed to update company details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("social.")) {
      const socialNetwork = name.split(".")[1];
      setDetails((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialNetwork]: value,
        },
      }));
    } else {
      setDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Company Details</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company Name
              </Label>
              <Input
                name="name"
                value={details.name}
                onChange={handleInputChange}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Company Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              {details.logo && (
                <img
                  src={details.logo}
                  alt="Company logo"
                  className="w-32 h-32 object-contain mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                name="email"
                type="email"
                value={details.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                name="phone"
                value={details.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <Input
                name="location"
                value={details.location}
                onChange={handleInputChange}
                placeholder="Enter company location"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </Label>
              <Textarea
                name="description"
                value={details.description}
                onChange={handleInputChange}
                placeholder="Enter company description"
                required
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Social Links (Optional)</h3>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Label>
                <Input
                  name="social.facebook"
                  value={details.socialLinks.facebook}
                  onChange={handleInputChange}
                  placeholder="Enter Facebook URL"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Label>
                <Input
                  name="social.instagram"
                  value={details.socialLinks.instagram}
                  onChange={handleInputChange}
                  placeholder="Enter Instagram URL"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Label>
                <Input
                  name="social.twitter"
                  value={details.socialLinks.twitter}
                  onChange={handleInputChange}
                  placeholder="Enter Twitter URL"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCompanyDetails;
