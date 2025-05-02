// /components/NGOProfile.js
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Trash2, Plus, X } from "lucide-react";

export default function NGOProfile() {
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    fetchNGOProfile();
  }, []);

  const fetchNGOProfile = async () => {
    try {
      const res = await fetch("/api/ngos", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        console.log("Fetched NGO Data:", data.ngo); // Debug
        setNgo(data.ngo || {});
        setFormData(data.ngo || {});
        setMediaPreviews(data.ngo?.mediaGallery || []);
      } else {
        console.error("Failed to fetch NGO profile:", data.error);
      }
    } catch (error) {
      console.error("Error fetching NGO profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNestedChange = (field, subField, value) => {
    setFormData({
      ...formData,
      [field]: { ...formData[field], [subField]: value },
    });
  };

  const handleArrayChange = (field, index, subField, value) => {
    const updatedArray = [...(formData[field] || [])];
    updatedArray[index] = { ...updatedArray[index], [subField]: value };
    setFormData({ ...formData, [field]: updatedArray });
  };

  const handleAddArrayItem = (field) => {
    const newItem =
      field === "team"
        ? { name: "", role: "", bio: "" }
        : field === "events"
        ? { title: "", date: "", description: "" }
        : { title: "", content: "", date: new Date().toISOString() };
    setFormData({ ...formData, [field]: [...(formData[field] || []), newItem] });
  };

  const handleRemoveArrayItem = (field, index) => {
    const updatedArray = [...(formData[field] || [])];
    updatedArray.splice(index, 1);
    setFormData({ ...formData, [field]: updatedArray });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    console.log("Selected Files Event:", e); // Debug: Check the event
    console.log("Selected Files:", files); // Debug: Check if files are captured
    if (e.target.name === "coverImage") {
      const file = files[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        setFormData({ ...formData, coverImage: file }); // Store the File object
        setNgo((prevNgo) => {
          if (prevNgo?.coverImage && prevNgo.coverImage.startsWith("blob:")) {
            URL.revokeObjectURL(prevNgo.coverImage); // Clean up old preview
          }
          return { ...prevNgo, coverImage: preview };
        }); // Update preview in ngo state
        console.log("Cover Image Updated:", { file, preview }); // Debug
      }
    } else if (e.target.name === "mediaGallery") {
      const newPreviews = files.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        file,
      }));
      setMediaPreviews([...mediaPreviews, ...newPreviews]);
      setFormData({
        ...formData,
        mediaGallery: [...(formData.mediaGallery || []), ...files],
      });
    } else if (e.target.name === "registrationDocs") {
      const newDocs = files.map((file) => ({ url: URL.createObjectURL(file), file }));
      setFormData({
        ...formData,
        registrationDocs: [...(formData.registrationDocs || []), ...files],
      });
    }
  };

  const handleDeleteMedia = (index) => {
    const updatedPreviews = [...mediaPreviews];
    const removedPreview = updatedPreviews.splice(index, 1)[0];
    setMediaPreviews(updatedPreviews);
    if (removedPreview?.url && removedPreview.url.startsWith("blob:")) {
      URL.revokeObjectURL(removedPreview.url); // Clean up preview URL
    }
    const updatedGallery = formData.mediaGallery ? [...formData.mediaGallery] : [];
    updatedGallery.splice(index, 1);
    setFormData({ ...formData, mediaGallery: updatedGallery });
  };

  const updateProfile = async () => {
    const form = new FormData();
    console.log("Form Data Before Append:", formData); // Debug
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "coverImage" && value instanceof File) {
        form.append(key, value);
        console.log("Appended Cover Image:", value); // Debug
      } else if (key === "mediaGallery") {
        (value || []).forEach((item, index) => {
          if (item instanceof File) {
            form.append("mediaGallery", item);
          } else {
            form.append(`existingMediaGallery[${index}]`, JSON.stringify(item));
          }
        });
      } else if (key === "registrationDocs") {
        (value || []).forEach((item, index) => {
          if (item instanceof File) {
            form.append("registrationDocs", item);
          } else {
            form.append(`existingRegistrationDocs[${index}]`, JSON.stringify(item));
          }
        });
      } else if (typeof value === "object" && value !== null) {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, value);
      }
    });

    console.log("FormData Entries:", Array.from(form.entries())); // Debug

    try {
      const res = await fetch("/api/ngos", {
        method: "PUT",
        body: form,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setEditMode(false);
        await fetchNGOProfile(); // Refresh the profile
      } else {
        console.error("Failed to update profile:", data.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const renderMediaItem = (item, index) => {
    const isVideo =
      typeof item === "string"
        ? item.endsWith(".mp4") || item.endsWith(".webm")
        : item.type === "video";
    return (
      <motion.div
        key={index}
        className="relative aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all"
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={() => setSelectedMedia({ item, index })}
      >
        {isVideo ? (
          <video
            src={typeof item === "string" ? item : item.url}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay={!editMode}
          />
        ) : (
          <img
            src={typeof item === "string" ? item : item.url}
            alt={`Media ${index}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/placeholder-image.jpg"; // Fallback image
            }}
          />
        )}
        {editMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMedia(index);
            }}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
          >
            <Trash2 size={16} />
          </button>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Skeleton className="w-11/12 h-96 rounded-3xl animate-pulse bg-gradient-to-r from-gray-200 to-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <motion.section
        className="relative h-[60vh] bg-gradient-to-br from-indigo-600 to-purple-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {ngo?.coverImage ? (
            <img
              src={ngo.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-30"
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg"; // Fallback image
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
          )}
        </div>
        {editMode && (
          <label
            htmlFor="coverImageInput" // Explicitly link label to input with ID
            className="absolute top-6 right-6 p-2 bg-white/90 rounded-full text-indigo-600 cursor-pointer z-50"
            onClick={(e) => {
              e.preventDefault(); // Prevent default behavior
              console.log("Label Clicked"); // Debug
            }}
          >
            Select Cover Image
            <input
              id="coverImageInput" // Match ID with label's htmlFor
              type="file"
              name="coverImage"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                console.log("Input Clicked"); // Debug
              }}
            />
          </label>
        )}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          {editMode ? (
            <Input
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
              className="text-4xl md:text-6xl font-bold text-white bg-transparent border-none focus:ring-0 placeholder:text-white/50 text-center"
              placeholder="NGO Name"
            />
          ) : (
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {ngo?.name || "NGO Name"}
            </motion.h1>
          )}
          <motion.p
            className="text-xl text-white/80 mt-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {ngo?.category || "Category"}
          </motion.p>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About & Impact Section */}
        <motion.section
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* About */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Story</h2>
            {editMode ? (
              <div className="space-y-4">
                <Textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  placeholder="Tell your story..."
                  className="rounded-lg border-gray-200 focus:ring-indigo-500"
                />
                <Textarea
                  name="mission"
                  value={formData.mission || ""}
                  onChange={handleInputChange}
                  placeholder="Our Mission"
                  className="rounded-lg border-gray-200 focus:ring-indigo-500"
                />
                <Textarea
                  name="vision"
                  value={formData.vision || ""}
                  onChange={handleInputChange}
                  placeholder="Our Vision"
                  className="rounded-lg border-gray-200 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div className="space-y-4 text-gray-600">
                <p>{ngo?.description || "No description available."}</p>
                <p>
                  <strong className="text-indigo-600">Mission:</strong>{" "}
                  {ngo?.mission || "No mission available."}
                </p>
                <p>
                  <strong className="text-indigo-600">Vision:</strong>{" "}
                  {ngo?.vision || "No vision available."}
                </p>
              </div>
            )}
          </div>

          {/* Impact */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Impact</h2>
            <div className="space-y-6">
              {[
                { label: "Lives Touched", value: "beneficiariesHelped" },
                { label: "Projects", value: "projectsCompleted" },
                { label: "Hours", value: "volunteerHours" },
              ].map((stat, index) => (
                <div key={index}>
                  <p className="text-gray-600">{stat.label}</p>
                  {editMode ? (
                    <Input
                      type="number"
                      name={stat.value}
                      value={
                        formData.impact && formData.impact[stat.value]
                          ? formData.impact[stat.value]
                          : 0
                      }
                      onChange={(e) =>
                        handleNestedChange("impact", stat.value, Number(e.target.value))
                      }
                      className="mt-1 rounded-lg border-gray-200 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      {(ngo?.impact && ngo.impact[stat.value]) || 0}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Connect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div>
              <p className="text-indigo-600 font-medium">Phone</p>
              {editMode ? (
                <Input
                  name="contactNumber"
                  value={formData.contactNumber || ""}
                  onChange={handleInputChange}
                  className="mt-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-gray-600 mt-2">
                  {ngo?.contactNumber || "No phone number available."}
                </p>
              )}
              <p className="text-indigo-600 font-medium mt-4">Address</p>
              {editMode ? (
                <div className="space-y-2 mt-2">
                  <Input
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    placeholder="Street Address"
                    className="rounded-lg border-gray-200 focus:ring-indigo-500"
                  />
                  <Input
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="rounded-lg border-gray-200 focus:ring-indigo-500"
                  />
                  <Input
                    name="state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    placeholder="State"
                    className="rounded-lg border-gray-200 focus:ring-indigo-500"
                  />
                  <Input
                    name="country"
                    value={formData.country || ""}
                    onChange={handleInputChange}
                    placeholder="Country"
                    className="rounded-lg border-gray-200 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <p className="text-gray-600 mt-2">
                  {ngo?.address && ngo?.city && ngo?.state && ngo?.country
                    ? `${ngo.address}, ${ngo.city}, ${ngo.state}, ${ngo.country}`
                    : "No address available."}
                </p>
              )}
            </div>
            {/* Social Media */}
            <div>
              <p className="text-indigo-600 font-medium">Social</p>
              {editMode ? (
                <div className="space-y-2 mt-2">
                  <Input
                    name="facebook"
                    value={formData.socialMedia?.facebook || ""}
                    onChange={(e) =>
                      handleNestedChange("socialMedia", "facebook", e.target.value)
                    }
                    placeholder="Facebook"
                    className="rounded-lg border-gray-200 focus:ring-indigo-500"
                  />
                  <Input
                    name="twitter"
                    value={formData.socialMedia?.twitter || ""}
                    onChange={(e) =>
                      handleNestedChange("socialMedia", "twitter", e.target.value)
                    }
                    placeholder="Twitter"
                    className="rounded-lg border-gray-200 focus:ring-indigo-500"
                  />
                  <Input
                    name="linkedin"
                    value={formData.socialMedia?.linkedin || ""}
                    onChange={(e) =>
                      handleNestedChange("socialMedia", "linkedin", e.target.value)
                    }
                    placeholder="LinkedIn"
                    className="rounded-lg border-gray-200 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  {ngo?.socialMedia?.facebook ? (
                    <a
                      href={ngo.socialMedia.facebook}
                      className="block text-indigo-600 hover:text-indigo-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </a>
                  ) : (
                    <p className="text-gray-600">No Facebook link</p>
                  )}
                  {ngo?.socialMedia?.twitter ? (
                    <a
                      href={ngo.socialMedia.twitter}
                      className="block text-indigo-600 hover:text-indigo-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </a>
                  ) : (
                    <p className="text-gray-600">No Twitter link</p>
                  )}
                  {ngo?.socialMedia?.linkedin ? (
                    <a
                      href={ngo.socialMedia.linkedin}
                      className="block text-indigo-600 hover:text-indigo-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  ) : (
                    <p className="text-gray-600">No LinkedIn link</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Our Team</h2>
            {editMode && (
              <Button
                onClick={() => handleAddArrayItem("team")}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-full"
              >
                <Plus size={18} className="mr-2" /> Add
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {(editMode ? formData.team : ngo?.team)?.map((member, index) => (
              <motion.div
                key={index}
                className="bg-indigo-50 rounded-xl p-4 hover:bg-indigo-100 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                {editMode ? (
                  <>
                    <Input
                      value={member.name || ""}
                      onChange={(e) =>
                        handleArrayChange("team", index, "name", e.target.value)
                      }
                      placeholder="Name"
                      className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                    />
                    <Input
                      value={member.role || ""}
                      onChange={(e) =>
                        handleArrayChange("team", index, "role", e.target.value)
                      }
                      placeholder="Role"
                      className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                    />
                    <Textarea
                      value={member.bio || ""}
                      onChange={(e) =>
                        handleArrayChange("team", index, "bio", e.target.value)
                      }
                      placeholder="Bio"
                      className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                    />
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveArrayItem("team", index)}
                      className="rounded-full"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-800">
                      {member.name || "No Name"}
                    </h3>
                    <p className="text-indigo-600">{member.role || "No Role"}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {member.bio || "No Bio"}
                    </p>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Events & Updates Section */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Events */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Events</h2>
              {editMode && (
                <Button
                  onClick={() => handleAddArrayItem("events")}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full"
                >
                  <Plus size={18} className="mr-2" /> Add
                </Button>
              )}
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(editMode ? formData.events : ngo?.events)?.map((event, index) => (
                <motion.div
                  key={index}
                  className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  {editMode ? (
                    <>
                      <Input
                        value={event.title || ""}
                        onChange={(e) =>
                          handleArrayChange("events", index, "title", e.target.value)
                        }
                        placeholder="Title"
                        className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                      />
                      <Input
                        type="date"
                        value={
                          event.date
                            ? new Date(event.date).toISOString().slice(0, 10)
                            : ""
                        }
                        onChange={(e) =>
                          handleArrayChange("events", index, "date", e.target.value)
                        }
                        className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                      />
                      <Textarea
                        value={event.description || ""}
                        onChange={(e) =>
                          handleArrayChange(
                            "events",
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Description"
                        className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                      />
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveArrayItem("events", index)}
                        className="rounded-full"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-800">
                        {event.title || "No Title"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {event.date
                          ? new Date(event.date).toLocaleDateString()
                          : "No Date"}
                      </p>
                      <p className="text-gray-600 mt-2">
                        {event.description || "No Description"}
                      </p>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Updates */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Updates</h2>
              {editMode && (
                <Button
                  onClick={() => handleAddArrayItem("updates")}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full"
                >
                  <Plus size={18} className="mr-2" /> Add
                </Button>
              )}
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(editMode ? formData.updates : ngo?.updates)?.map((update, index) => (
                <motion.div
                  key={index}
                  className="bg-pink-50 rounded-xl p-4 hover:bg-pink-100 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  {editMode ? (
                    <>
                      <Input
                        value={update.title || ""}
                        onChange={(e) =>
                          handleArrayChange("updates", index, "title", e.target.value)
                        }
                        placeholder="Title"
                        className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                      />
                      <Textarea
                        value={update.content || ""}
                        onChange={(e) =>
                          handleArrayChange("updates", index, "content", e.target.value)
                        }
                        placeholder="Content"
                        className="mb-2 rounded-lg border-gray-200 focus:ring-indigo-500"
                      />
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveArrayItem("updates", index)}
                        className="rounded-full"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-800">
                        {update.title || "No Title"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {update.date
                          ? new Date(update.date).toLocaleDateString()
                          : "No Date"}
                      </p>
                      <p className="text-gray-600 mt-2">
                        {update.content || "No Content"}
                      </p>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Media Gallery */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Moments of Impact</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaPreviews.map((item, index) => renderMediaItem(item, index))}
          </div>
          {editMode && (
            <input
              type="file"
              name="mediaGallery"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="mt-4 text-sm text-indigo-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
            />
          )}
        </motion.section>

        {/* Registration Documents */}
        <motion.section
          className="bg-white rounded-3xl shadow-lg p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Credentials</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(editMode ? formData.registrationDocs : ngo?.registrationDocs)?.map(
              (doc, index) => (
                <motion.div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  onClick={() =>
                    setSelectedMedia({ item: doc.url || doc, index, isDoc: true })
                  }
                >
                  <img
                    src={doc.url || doc}
                    alt={`Document ${index}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg"; // Fallback image
                    }}
                  />
                </motion.div>
              )
            )}
          </div>
          {editMode && (
            <input
              type="file"
              name="registrationDocs"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="mt-4 text-sm text-indigo-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
            />
          )}
        </motion.section>
      </div>

      {/* Action Buttons */}
      <motion.div
        className="fixed bottom-6 right-6 flex space-x-4 z-50"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {editMode ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditMode(false);
                setFormData(ngo || {});
                setMediaPreviews(ngo?.mediaGallery || []);
                if (ngo?.coverImage && ngo.coverImage.startsWith("blob:")) {
                  URL.revokeObjectURL(ngo.coverImage); // Clean up preview
                }
              }}
              className="bg-white border-indigo-300 text-indigo-600 hover:bg-indigo-100 rounded-full px-6 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={updateProfile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2"
            >
              Save
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setEditMode(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2"
          >
            Edit Profile
          </Button>
        )}
      </motion.div>

      {/* Media Lightbox */}
      {selectedMedia && (
        <motion.div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedMedia(null)}
        >
          <motion.div
            className="relative w-11/12 max-w-4xl p-6 bg-white rounded-3xl shadow-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <X size={24} />
            </button>
            {selectedMedia.isDoc ? (
              <iframe
                src={
                  typeof selectedMedia.item === "string"
                    ? selectedMedia.item
                    : selectedMedia.item.url
                }
                className="w-full h-[80vh] rounded-2xl"
                title="Document"
              />
            ) : selectedMedia.item.type === "video" ||
              (typeof selectedMedia.item === "string" &&
                (selectedMedia.item.endsWith(".mp4") ||
                  selectedMedia.item.endsWith(".webm"))) ? (
              <video
                src={
                  typeof selectedMedia.item === "string"
                    ? selectedMedia.item
                    : selectedMedia.item.url
                }
                controls
                autoPlay
                className="w-full h-auto rounded-2xl"
              />
            ) : (
              <img
                src={
                  typeof selectedMedia.item === "string"
                    ? selectedMedia.item
                    : selectedMedia.item.url
                }
                alt="Selected Media"
                className="w-full h-auto rounded-2xl"
                onError={(e) => {
                  e.target.src = "/placeholder-image.jpg"; // Fallback image
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}