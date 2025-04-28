import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"; // Import Firestore functions
import { db } from "@/firebase"; // Import Firebase instance
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminContact = () => {
  const [contactMessages, setContactMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch customer contact messages from Firestore
  useEffect(() => {
    const fetchContactMessages = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "contactMessages"));
        const messages = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContactMessages(messages);
        setFilteredMessages(messages); // Initialize filtered messages
      } catch (error) {
        console.error("Error fetching contact messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactMessages();
  }, []);

  // Delete a message from Firestore
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "contactMessages", id)); // Delete the document from Firestore
      setContactMessages((prevMessages) => prevMessages.filter((message) => message.id !== id)); // Update state
      setFilteredMessages((prevMessages) => prevMessages.filter((message) => message.id !== id)); // Update filtered state
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Handle search input
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = contactMessages.filter(
      (message) =>
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        message.phone.toLowerCase().includes(query) ||
        message.subject.toLowerCase().includes(query) ||
        message.message.toLowerCase().includes(query)
    );

    setFilteredMessages(filtered);
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-500">Loading customer messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Customer Contact Messages</h1>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-64 p-2 border rounded-md focus:ring-2 focus:ring-hotel-gold outline-none transition-all"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMessages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell>{message.phone}</TableCell>
                    <TableCell>{message.subject}</TableCell>
                    <TableCell>{message.message}</TableCell>
                    <TableCell>
                      {new Date(message.timestamp?.seconds * 1000).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">No messages found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContact;
