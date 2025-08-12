
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { FiUploadCloud, FiTrash2, FiFileText, FiLoader, FiCheckCircle } from "react-icons/fi";
import { setFiles, clearFiles, createDocumentThunk, fetchDocumentsThunk, deleteDocumentThunk, updateDocumentThunk } from "../Redux/ReduxSlice/documentSlice"; // Added updateDocumentThunk
import { toast } from "react-hot-toast";
import { useOutletContext } from "react-router-dom";

const DocumentUpload = ({ nextStep, prevStep }) => {
  const { handleNextStep, handlePrevStep, resetForm } = useOutletContext();
  const dispatch = useDispatch();
  const { files, loading, error, documents } = useSelector((state) => state.documents);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState({});
  const [transformedDocuments, setTransformedDocuments] = useState([]);

  const fileFields = [
    { name: "profile_photo", label: "Profile Photo", maxSize: 7.5 * 1024 * 1024, maxWidth: 1024, maxHeight: 768 },
    { name: "signature", label: "Signature", maxSize: 7.5 * 1024 * 1024, maxWidth: 1024, maxHeight: 768 },
    { name: "aadhar_front", label: "Aadhar Card Front Side", maxSize: 7.5 * 1024 * 1024 },
    { name: "aadhar_back", label: "Aadhar Card Back Side", maxSize: 7.5 * 1024 * 1024 },
    { name: "passport", label: "Passport", maxSize: 7.5 * 1024 * 1024, isOptional: true },
  ];

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      fileFields.forEach((field) => {
        if (files[field.name] && files[field.name].type.includes("image")) {
          URL.revokeObjectURL(URL.createObjectURL(files[field.name]));
        }
      });
    };
  }, [files]);

  // Fetch existing documents on mount
  useEffect(() => {
    dispatch(fetchDocumentsThunk());
  }, [dispatch]);

  // Transform documents to match expected format
  useEffect(() => {
    const transformed = [];
    documents.forEach((doc) => {
      fileFields.forEach((field) => {
        if (doc[field.name]) {
          transformed.push({
            id: doc.id,
            name: field.name,
            url: doc[field.name],
          });
        }
      });
    });
    setTransformedDocuments(transformed);
  }, [documents]);

  // Simulate progress during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = { ...prev };
          fileFields.forEach((field) => {
            if (files[field.name] && (!newProgress[field.name] || newProgress[field.name] < 100)) {
              newProgress[field.name] = Math.min((newProgress[field.name] || 0) + 2, 100); // Smoother increment
            }
          });
          return newProgress;
        });
      }, 100); // Faster updates
      return () => clearInterval(interval);
    } else {
      setProgress((prev) => {
        const newProgress = { ...prev };
        fileFields.forEach((field) => {
          newProgress[field.name] = files[field.name] ? 100 : 0;
        });
        return newProgress;
      });
    }
  }, [loading, files]);

  const validateFile = async (file, name) => {
    const field = fileFields.find((field) => field.name === name);
    const maxSize = field.maxSize || 7.5 * 1024 * 1024;
    const maxWidth = field.maxWidth || 1024;
    const maxHeight = field.maxHeight || 768;

    if (file.size > maxSize) {
      dispatch(setFiles({ [name]: null, error: `File size must be under ${maxSize / (1024 * 1024)}MB.` }));
      toast.error(`File size must be under ${maxSize / (1024 * 1024)}MB.`);
      return false;
    }

    if (name === "profile_photo" || name === "signature") {
      try {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (img.width > maxWidth || img.height > maxHeight) {
              dispatch(setFiles({ [name]: null, error: `Image size must be within ${maxWidth}x${maxHeight} pixels.` }));
              toast.error(`Image size must be within ${maxWidth}x${maxHeight} pixels.`);
              reject(false);
            } else {
              resolve(true);
            }
          };
          img.onerror = () => reject(false);
        });
      } catch {
        dispatch(setFiles({ [name]: null, error: "Invalid image file." }));
        return false;
      }
    }

    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) { // Aligned with UI
      dispatch(setFiles({ [name]: null, error: "Only JPG, PNG, PDF files are allowed." }));
      toast.error("Only JPG, PNG, PDF files are allowed.");
      return false;
    }

    return true;
  };

  const handleFileChange = async (e) => {
    const { name, files: inputFiles } = e.target;
    if (inputFiles.length > 0) {
      const file = inputFiles[0];
      const existingDoc = transformedDocuments.find((doc) => doc.name === name);
      if (existingDoc && !window.confirm(`Replace existing ${fileFields.find(f => f.name === name).label}?`)) {
        return; // Cancel if user doesn’t confirm replacement
      }
      if (await validateFile(file, name)) {
        dispatch(setFiles({ [name]: file, error: "" }));
        setProgress((prev) => ({ ...prev, [name]: 0 }));
      }
    }
  };

  const removeFile = (name) => {
    if (window.confirm(`Are you sure you want to remove ${fileFields.find(f => f.name === name).label}?`)) {
      dispatch(setFiles({ [name]: null, error: "" }));
      setProgress((prev) => ({ ...prev, [name]: 0 }));
    }
  };

  const handleDrop = async (e, name) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const existingDoc = transformedDocuments.find((doc) => doc.name === name);
      if (existingDoc && !window.confirm(`Replace existing ${fileFields.find(f => f.name === name).label}?`)) {
        return;
      }
      if (await validateFile(file, name)) {
        dispatch(setFiles({ [name]: file, error: "" }));
        setProgress((prev) => ({ ...prev, [name]: 0 }));
      }
    }
  };

  const handleSubmit = async () => {
    const missingFields = fileFields
      .filter((field) => !field.isOptional && !files[field.name] && !transformedDocuments.some(doc => doc.name === field.name))
      .map((field) => field.label);
    if (missingFields.length > 0) {
      const errorMsg = `Please upload: ${missingFields.join(", ")}.`;
      dispatch(setFiles({ error: errorMsg }));
      toast.error(errorMsg);
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      dispatch(setFiles({ error: "Authentication token is missing. Please log in." }));
      return;
    }

    try {
      // Group files by whether they’re updates or new uploads
      const updates = [];
      const newUploads = {};
      fileFields.forEach((field) => {
        if (files[field.name]) {
          const existingDoc = transformedDocuments.find((doc) => doc.name === field.name);
          if (existingDoc) {
            updates.push({ id: existingDoc.id, name: field.name, file: files[field.name] });
          } else {
            newUploads[field.name] = files[field.name];
          }
        }
      });

      // Process updates
      for (const update of updates) {
        await dispatch(updateDocumentThunk({
          id: update.id,
          files: { [update.name]: update.file },
          token
        })).unwrap();
        toast.success(`${fileFields.find(f => f.name === update.name).label} updated successfully!`);
      }

      // Process new uploads
      if (Object.keys(newUploads).length > 0) {
        await dispatch(createDocumentThunk({ files: newUploads, token })).unwrap();
        toast.success("New documents uploaded successfully!");
      }

      dispatch(clearFiles());
      setProgress({});
      handleNextStep();
    } catch (error) {
    
      toast.error("Failed to process documents. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-gray-100 dark:bg-gray-900 rounded-3xl backdrop-blur-lg"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-8"
      >
        Upload Your Documents
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {fileFields.map((field, index) => {
          const fieldDocuments = transformedDocuments.filter((doc) => doc.name === field.name);
          return (
            <div key={field.name}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-100 dark:bg-indigo-900 shadow-lg"
                    : "border-gray-300"
                } rounded-lg p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 hover:border-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer`}
                onDrop={(e) => handleDrop(e, field.name)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                whileHover={{ scale: 1.02 }}
                whileDrag={{ scale: 1.05, boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)" }}
              >
                {/* <input
                  type="file"
                  name={field.name}
                  onChange={handleFileChange}
                  className="hidden"
                  id={field.name}
                  aria-label={`Upload ${field.label}`}
                  accept="image/jpeg,image/png,application/pdf"
                /> */}
                <input
                  type="file"
                  name={field.name}
                  onChange={handleFileChange}
                  className="hidden"
                  id={field.name}
                  aria-label={`Upload ${field.label}`}
                  accept={
                    ["profile_photo", "signature"].includes(field.name)
                      ? "image/jpeg,image/png"
                      : "image/jpeg,image/png,application/pdf"
                  }
                />

                <label
                  htmlFor={field.name}
                  className="flex flex-col items-center cursor-pointer"
                  aria-describedby={`${field.name}-info`}
                >
                  {loading && files[field.name] ? (
                    <FiLoader className="animate-spin text-indigo-500 text-3xl sm:text-4xl mb-2" />
                  ) : files[field.name] ? (
                    <div className="flex flex-col items-center">
                      {files[field.name].type.includes("image") ? (
                        <img
                          src={URL.createObjectURL(files[field.name])}
                          alt="preview"
                          className="w-16 sm:w-20 h-16 sm:h-20 object-cover rounded-lg shadow-md mb-2"
                        />
                      ) : (
                        <FiFileText className="text-green-500 text-3xl sm:text-4xl mb-2" />
                      )}
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center">
                        {files[field.name].name}
                      </span>
                      {progress[field.name] === 100 && !loading && (
                        <div className="flex items-center mt-1">
                          <FiCheckCircle className="text-green-500 text-lg sm:text-xl mr-1" />
                          <span className="text-xs sm:text-sm text-green-500">Uploaded</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(field.name)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        aria-label={`Remove ${field.label}`}
                      >
                        <FiTrash2 size={14} sm:size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FiUploadCloud className="text-indigo-500 text-3xl sm:text-4xl mb-2" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center">
                        Drag & drop or click to upload <br /> {field.label} {field.isOptional ? "(Optional)" : ""}
                      </span>
                    </>
                  )}
                </label>
                {files[field.name] && progress[field.name] > 0 && progress[field.name] < 100 && (
                  <div className="w-full mt-2">
                    <div className="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${progress[field.name]}%` }}
                      ></div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center mt-1">
                      Uploading: {progress[field.name]}%
                    </p>
                  </div>
                )}
                <p className="text-red-500 text-xs mt-2">
                  Max file size: 7.5 MB,
                  {["profile_photo", "signature"].includes(field.name)
                    ? ` Max image size: ${field.maxWidth}x${field.maxHeight} pixels, Allowed file types: .jpg, .png`
                    : ` Allowed file types: .jpg, .png, .pdf`}
                </p>

                {error && typeof error === "string" && error.includes(field.name) && (
                  <p className="text-red-500 text-xs mt-2">{error}</p>
                )}
                {error && typeof error === "object" && error[field.name] && (
                  <p className="text-red-500 text-xs mt-2">{error[field.name]}</p>
                )}
              </motion.div>
              <div className="mt-2">
                {fieldDocuments.length > 0 ? (
                  fieldDocuments.map((doc) => (
                    <div
                      key={`${doc.id}-${doc.name}`}
                      className="flex items-center justify-between bg-gray-200 dark:bg-gray-700 rounded-lg p-2 mt-1"
                    >
                      <div className="flex items-center">
                        {doc.url && (doc.url.includes(".jpg") || doc.url.includes(".png")) ? (
                          <img
                            src={doc.url}
                            alt={doc.name}
                            className="w-12 h-12 object-cover rounded-lg mr-2"
                          />
                        ) : (
                          <FiFileText className="text-green-500 text-2xl mr-2" />
                        )}
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          {field.label} (Uploaded)
                        </span>
                      </div>
                      <button
                        onClick={() => dispatch(deleteDocumentThunk({ id: doc.id, token: sessionStorage.getItem('token') }))}
                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                        aria-label={`Delete ${field.label}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No {field.label} uploaded yet.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && typeof error === "string" && !error.includes("size") && !error.includes("pixels") && (
        <p className="text-red-500 text-xs sm:text-sm mt-4 text-center">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row justify-between mt-6 sm:mt-10 gap-4">
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevStep}
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 text-base"
        >
          ← Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={loading}
          className={`px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 text-base ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"
          }`}
        >
          Save and Next →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DocumentUpload;