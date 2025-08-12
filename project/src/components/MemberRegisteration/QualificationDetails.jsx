



import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useOutletContext } from "react-router-dom";
import {
  updateFormData,
  addOtherQualification,
  fetchQualifications,
  addQualification,
  editQualification,
  removeQualification,
  resetFormData,
} from "../Redux/ReduxSlice/qualificationsSlice";
import {
  updateExperienceFormEntry,
  addExperienceFormEntry,
  removeExperience,
  getExperiencesData,
  addExperience,
} from "../Redux/ReduxSlice/experiencesSlice";
import { getQualificationBranch,getQualificationType } from "../../Services/ApiServices/ApiService";
import {
  createNewProposer,
  fetchProposers,
  updateExistingProposer,
} from "../Redux/ReduxSlice/proposerSlice";
import { Plus, Upload, Trash2, Save, GraduationCap, Briefcase, Users, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const QualificationDetails = () => {
  const dispatch = useDispatch();
  const { formData, qualifications, otherQualifications, loading: qualLoading } = useSelector((state) => state.qualifications);
  const { formEntries, loading: expLoading } = useSelector((state) => state.experiences);
  const { proposers, loading: propLoading, exposure, electronics_experience, area_of_specialization } = useSelector((state) => state.proposers);
  const { handleNextStep, handlePrevStep } = useOutletContext();

  const [qualsTypeData,setQualsTypeData]=useState([])
  const [qualsBranchData,setQualsBranchData]=useState([])
  const [qualificationCount, setQualificationCount] = useState(Math.max(qualifications.length, 3));
  const [experienceCount, setExperienceCount] = useState(formEntries.length);
  const [proposerForms, setProposerForms] = useState([
    { name: "", email: "", membership_no: "", mobile_no: "" },
    { name: "", email: "", membership_no: "", mobile_no: "" },
  ]);

  useEffect(() => {
    dispatch(fetchQualifications());
    dispatch(getExperiencesData());
    dispatch(fetchProposers());
  }, [dispatch]);

  useEffect(() => {
    setQualificationCount(Math.max(qualifications.length, 3));
    setExperienceCount(formEntries.length);
  }, [qualifications, formEntries]);

  const getQualsBranch=async()=>{
    try {
      const res=await getQualificationBranch();
      setQualsBranchData(res)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getQualsType=async()=>{
    try {
      const res=await getQualificationType();
      setQualsTypeData(res)
    } catch (error) {
      toast.error(error.message)
    }
  }

  console.log("qual type",qualsTypeData)
  console.log("qualsBranch",qualsBranchData)

  useEffect(()=>{
    getQualsBranch()
    getQualsType()
  },[])

  useEffect(() => {
    if (proposers.length > 0) {
      const updatedForms = proposerForms.map((form, index) => {
        const proposer = proposers[index] || {};
        return {
          name: proposer.name || "",
          email: proposer.email || "",
          membership_no: proposer.membership_no || "",
          mobile_no: proposer.mobile_no || "",
        };
      });
      setProposerForms(updatedForms);
    }
  }, [proposers]);

  const handleAddQualification = () => {
    if (qualificationCount < 9) {
      const newIndex = qualificationCount;
      setQualificationCount(newIndex + 1);
      const newQual = {
        id: "",
        qualification_type: "",
        qualification_branch: "",
        institute_name: "",
        board_university: "",
        year_of_passing: "",
        percentage_cgpa: "",
        document: null,
      };
      dispatch(addOtherQualification(newQual));
    } else {
      toast.error("Maximum 9 qualifications allowed.");
    }
  };

  const handleQualificationChange = (index, field, value) => {
    console.log(`handleQualificationChange: Index ${index}, Field ${field}, Value:`, value);
    dispatch(updateFormData({ name: `${field}_${index + 1}`, value }));
    if (field === "qualification_type") {
      dispatch(updateFormData({ name: `qualification_branch_${index + 1}`, value: "" }));
    }
  };

  const handleQualificationSubmit = async (e) => {
    e.preventDefault();
    const qualificationsToUpdate = [];
    const qualificationsToCreate = [];

    console.log("handleQualificationSubmit: FormData State", formData);

    // Check only the Graduation field (index 1) for mandatory fields
    if (
      !formData[`qualification_type_1`] ||
      !formData[`qualification_branch_1`] ||
      !formData[`institute_name_1`] ||
      !formData[`board_university_1`] ||
      !formData[`year_of_passing_1`] ||
      !formData[`percentage_cgpa_1`]
    ) {
      // toast.error("Please fill all fields for the Graduation qualification.");
      return;
    }

    for (let i = 1; i <= qualificationCount; i++) {
      // Only process entries with at least one filled field
      if (
        formData[`qualification_type_${i}`] ||
        formData[`qualification_branch_${i}`] ||
        formData[`institute_name_${i}`] ||
        formData[`board_university_${i}`] ||
        formData[`year_of_passing_${i}`] ||
        formData[`percentage_cgpa_${i}`] ||
        formData[`document_${i}`]
      ) {
        // For non-Graduation fields, ensure all fields are filled if any are provided
        if (i !== 1 && (
          !formData[`qualification_type_${i}`] ||
          !formData[`qualification_branch_${i}`] ||
          !formData[`institute_name_${i}`] ||
          !formData[`board_university_${i}`] ||
          !formData[`year_of_passing_${i}`] ||
          !formData[`percentage_cgpa_${i}`]
        )) {
          toast.error(`Please fill all fields for Qualification ${i} or clear them.`);
          return;
        }

        const qual = {
          id: formData[`id_${i}`] || "",
          qualification_type: formData[`qualification_type_${i}`] || "",
          qualification_branch: formData[`qualification_branch_${i}`] || "",
          institute_name: formData[`institute_name_${i}`] || "",
          board_university: formData[`board_university_${i}`] || "",
          year_of_passing: formData[`year_of_passing_${i}`] || "",
          percentage_cgpa: formData[`percentage_cgpa_${i}`] || "",
          document: formData[`document_${i}`] || null,
        };

        if (qual.id && qual.id !== "") {
          const existingQual = qualifications.find((q) => q.id?.toString() === qual.id.toString());
          if (
            existingQual &&
            (qual.qualification_type !== (existingQual.qualification_type?.toString() || "") ||
             qual.qualification_branch !== (existingQual.qualification_branch?.toString() || "") ||
             qual.institute_name !== (existingQual.institute_name || "") ||
             qual.board_university !== (existingQual.board_university || "") ||
             qual.year_of_passing !== (existingQual.year_of_passing?.toString() || "") ||
             qual.percentage_cgpa !== (existingQual.percentage_cgpa?.toString() || "") ||
             qual.document !== (existingQual.document || null))
          ) {
            qualificationsToUpdate.push(qual);
          }
        } else if (
          qual.qualification_type &&
          qual.qualification_branch &&
          qual.institute_name &&
          qual.board_university &&
          qual.year_of_passing &&
          qual.percentage_cgpa
        ) {
          const isDuplicate = qualifications.some(
            (q) =>
              q.qualification_type?.toString() === qual.qualification_type &&
              q.qualification_branch?.toString() === qual.qualification_branch &&
              q.institute_name === qual.institute_name &&
              q.board_university === qual.board_university &&
              q.year_of_passing?.toString() === qual.year_of_passing &&
              q.percentage_cgpa?.toString() === qual.percentage_cgpa
          );
          if (!isDuplicate) {
            qualificationsToCreate.push(qual);
          }
        }
      }
    }

    console.log("handleQualificationSubmit: Qualifications to Update:", qualificationsToUpdate);
    console.log("handleQualificationSubmit: Qualifications to Create:", qualificationsToCreate);

    if (qualificationsToUpdate.length === 0 && qualificationsToCreate.length === 0) {
      // toast.error("Please fill at least the Graduation qualification.");
      return;
    }

    try {
      if (qualificationsToUpdate.length > 0) {
        await dispatch(editQualification({ qualifications: qualificationsToUpdate })).unwrap();
      }
      if (qualificationsToCreate.length > 0) {
        await dispatch(addQualification({ data: qualificationsToCreate })).unwrap();
      }
      toast.success("Qualifications saved successfully!");
      await dispatch(fetchQualifications()).unwrap();
      setQualificationCount(Math.max(qualifications.length, 3));
    } catch (error) {
      console.error("handleQualificationSubmit: Error saving qualifications", error);
      toast.error(error.message || "Failed to save qualifications");
    }
  };

  const handleSubmit = async () => {
    const hasQualChanges = qualifications.some((qual, index) => {
      const i = index + 1;
      return (
        formData[`qualification_type_${i}`] !== (qual.qualification_type?.toString() || "") ||
        formData[`qualification_branch_${i}`] !== (qual.qualification_branch?.toString() || "") ||
        formData[`institute_name_${i}`] !== (qual.institute_name || "") ||
        formData[`board_university_${i}`] !== (qual.board_university || "") ||
        formData[`year_of_passing_${i}`] !== (qual.year_of_passing?.toString() || "") ||
        formData[`percentage_cgpa_${i}`] !== (qual.percentage_cgpa?.toString() || "") ||
        formData[`document_${i}`] !== (qual.document || null)
      );
    }) || qualifications.length < qualificationCount;

    const hasExpChanges = formEntries.some((entry, index) => {
      const existing = formEntries[index] || {};
      return (
        entry.organization_name !== (existing.organization_name || "") ||
        entry.employee_type !== (existing.employee_type || "") ||
        entry.job_title !== (existing.job_title || "") ||
        entry.currently_working !== (existing.currently_working || false) ||
        entry.start_date !== (existing.start_date || "") ||
        entry.end_date !== (existing.end_date || "") ||
        entry.work_type !== (existing.work_type || "") ||
        entry.total_experience !== (existing.total_experience || "") ||
        !entry.id
      );
    });

    if (hasQualChanges) {
      await handleQualificationSubmit({ preventDefault: () => {} });
    }
    if (hasExpChanges) {
      await handleExperienceSubmit({ preventDefault: () => {} });
    }
    await handleSaveProposerDetails();
    handleNextStep();
  };

  const handleExperienceChange = (index, field, value) => {
    dispatch(updateExperienceFormEntry({ index, name: field, value }));
    if (field === "start_date" || field === "end_date" || field === "currently_working") {
      calculateTotalExperience(index);
    }
  };

  const calculateTotalExperience = (index) => {
    const entry = formEntries[index];
    if (entry.start_date) {
      const start = new Date(entry.start_date);
      const end = entry.currently_working ? new Date() : entry.end_date ? new Date(entry.end_date) : new Date();
      if (start <= end) {
        const diffTime = Math.abs(end - start);
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        dispatch(updateExperienceFormEntry({ index, name: "total_experience", value: diffYears.toFixed(1) }));
      }
    }
  };

  const handleAddExperience = () => {
    if (experienceCount < 9) {
      dispatch(addExperienceFormEntry());
      setExperienceCount(experienceCount + 1);
    } else {
      toast.error("Maximum 9 experiences allowed.");
    }
  };

  const handleDeleteExperience = async (id) => {
    try {
      await dispatch(removeExperience(id)).unwrap();
      setExperienceCount(formEntries.length - 1);
      toast.success("Experience deleted successfully!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete experience");
    }
  };

  const handleDeleteQualification = async (id) => {
    try {
      await dispatch(removeQualification(id)).unwrap();
      setQualificationCount(Math.max(qualifications.length - 1, 3));
      toast.success("Qualification deleted successfully!");
    } catch (error) {
      toast.error(error?.message || "Failed to delete qualification");
    }
  };

  const handleExperienceSubmit = async (e) => {
    e.preventDefault();
    const experienceData = formEntries.map((entry) => ({
      id: entry.id || null,
      organization_name: entry.organization_name || "",
      employee_type: entry.employee_type || "",
      job_title: entry.job_title || "",
      currently_working: entry.currently_working || false,
      start_date: entry.start_date || "",
      end_date: entry.currently_working ? "" : entry.end_date || "",
      work_type: entry.work_type || "",
      total_experience: entry.total_experience || "",
    }));
    try {
      await dispatch(addExperience(experienceData)).unwrap();
      toast.success("Experiences saved successfully!");
      await dispatch(getExperiencesData()).unwrap();
    } catch (error) {
      toast.error(error || "Failed to save experiences");
    }
  };

  const handleProposerChange = (index, field, value) => {
    setProposerForms((prev) =>
      prev.map((form, i) =>
        i === index ? { ...form, [field]: value } : form
      )
    );
  };

  const handleProposerSubmit = async (e, index) => {
    e.preventDefault();
    const proposerData = proposerForms[index];
    try {
      const existingProposer = proposers[index];
      if (existingProposer?.id) {
        await dispatch(
          updateExistingProposer({
            id: existingProposer.id,
            data: { proposers: [proposerData] },
            token: "token",
          })
        ).unwrap();
        toast.success(`Proposer ${index + 1} updated successfully!`);
      } else {
        await dispatch(
          createNewProposer({ data: proposerData, token: "token" })
        ).unwrap();
        toast.success(`Proposer ${index + 1} saved successfully!`);
      }
      await dispatch(fetchProposers()).unwrap();
    } catch (error) {
      toast.error(error || `Failed to save Proposer ${index + 1}`);
    }
  };

  // const handleProposerDetailsChange = (field, value) => {
  //   dispatch({
  //     type: `proposers/set${field.charAt(0).toUpperCase() + field.slice(1)}`,
  //     payload: value,
  //   });
  // };
  const handleProposerDetailsChange = (field, value) => {
  dispatch({
    type: `proposers/set${field.charAt(0).toUpperCase() + field.slice(1)}`,
    payload: value,
  });
};

  // const handleSaveProposerDetails = async () => {
  //   if (proposers.length > 0) {
  //     const proposerId = proposers[0].id;
  //     const updatedData = {
  //       exposure,
  //       electronics_experience,
  //       area_of_specialization,
  //     };
  //     try {
  //       await dispatch(
  //         updateExistingProposer({
  //           id: proposerId,
  //           data: { proposers: [{ ...updatedData, id: proposerId }] },
  //           token: "token",
  //         })
  //       ).unwrap();
  //       toast.success("Proposer details saved successfully!");
  //     } catch (error) {
  //       toast.error(error || "Failed to save proposer details");
  //     }
  //   } else {
  //     toast.error("No proposers available to update.");
  //   }
  // };


const handleSaveProposerDetails = async () => {
  if (proposers.length > 0) {
    const proposerId = proposers[0].id;
    const existingProposer = proposers[0];
    const updatedData = {
      proposers: [
        {
          id: proposerId,
          name: existingProposer.name || "",
          membership_no: existingProposer.membership_no || "",
          mobile_no: existingProposer.mobile_no || "",
          email: existingProposer.email || "",
          exposure: exposure,
          electronics_experience: electronics_experience,
          area_of_specialization: area_of_specialization,
        },
      ],
    };

    try {
      await dispatch(
        updateExistingProposer({
          id: proposerId,
          data: updatedData,
          token: sessionStorage.getItem('token'), // Replace with actual token retrieval
        })
      ).unwrap();
      toast.success("Proposer details saved successfully!");
    } catch (error) {
      toast.error(error || "Failed to save proposer details");
    }
  } else {
    toast.error("No proposers available to update.");
  }
};

  const qualificationTypes = ["Graduation", "Post Graduation", "PhD"];

  const branchOptions = qualsBranchData.reduce((acc, branch) => {
    const key = branch.qualification_type;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({ value: branch.id, label: branch.name });
    return acc;
  }, {});

  const getDocumentFilename = (fileOrUrl, qualDocument) => {
    if (fileOrUrl instanceof File) {
      return fileOrUrl.name;
    }
    if (typeof qualDocument === "string" && qualDocument) {
      return qualDocument.split("/").pop();
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg">
      {/* Qualifications Section */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <GraduationCap className="mr-2 w-5 h-5 sm:w-6 sm:h-6" /> Qualifications
        </h2>
        <form onSubmit={handleQualificationSubmit} className="space-y-6">
          {Array.from({ length: qualificationCount }, (_, index) => {
            const qual = qualifications[index] || {};
            const documentFile = formData[`document_${index + 1}`];
            const documentFilename = getDocumentFilename(documentFile, qual.document);
            const selectedQualType = formData[`qualification_type_${index + 1}`] || qual.qualification_type || "";
            return (
              <div key={qual.id || index} className="border p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-gray-700 flex items-center">
                  {index < 3 ? qualificationTypes[index] : `Additional Qualification ${index - 2}`}
                  {index >= 3 && qual.id && (
                    <Trash2
                      className="ml-2 text-red-500 cursor-pointer w-4 h-4 sm:w-5 sm:h-5"
                      onClick={() => handleDeleteQualification(qual.id)}
                    />
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="hidden"
                    value={formData[`id_${index + 1}`] || qual.id || ""}
                    onChange={(e) => handleQualificationChange(index, "id", e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Qualification Type {index === 0 ? "*" : ""}</label>
                    <select
                      value={formData[`qualification_type_${index + 1}`] || qual.qualification_type || ""}
                      onChange={(e) => handleQualificationChange(index, "qualification_type", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required={index === 0}
                    >
                      <option value="">Select Qualification Type</option>
                      {qualsTypeData.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stream {index === 0 ? "*" : ""}</label>
                    <select
                      value={formData[`qualification_branch_${index + 1}`] || qual.qualification_branch || ""}
                      onChange={(e) => handleQualificationChange(index, "qualification_branch", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required={index === 0}
                    >
                      <option value="">Select Stream</option>
                      {branchOptions[selectedQualType]?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Institute Name {index === 0 ? "*" : ""}</label>
                    <input
                      type="text"
                      value={formData[`institute_name_${index + 1}`] || qual.institute_name || ""}
                      onChange={(e) => handleQualificationChange(index, "institute_name", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required={index === 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">University {index === 0 ? "*" : ""}</label>
                    <input
                      type="text"
                      value={formData[`board_university_${index + 1}`] || qual.board_university || ""}
                      onChange={(e) => handleQualificationChange(index, "board_university", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required={index === 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year of Passing {index === 0 ? "*" : ""}</label>
                    <input
                      type="number"
                      value={formData[`year_of_passing_${index + 1}`] || qual.year_of_passing || ""}
                      onChange={(e) => handleQualificationChange(index, "year_of_passing", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required={index === 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CGPA/Percentage {index === 0 ? "*" : ""}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData[`percentage_cgpa_${index + 1}`] || qual.percentage_cgpa || ""}
                      onChange={(e) => handleQualificationChange(index, "percentage_cgpa", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required={index === 0}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Upload Document {index === 0 ? "*" : ""}</label>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleQualificationChange(index, "document", e.target.files[0] || null)}
                        className="hidden"
                        id={`document_${index + 1}`}
                        // required={index === 0}
                      />
                      <label
                        htmlFor={`document_${index + 1}`}
                        className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto hover:bg-blue-600 transition-colors text-sm sm:text-base"
                      >
                        <Upload className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Upload PDF (Max 7.5MB)
                      </label>
                      {documentFilename && (
                        <span className="text-sm text-gray-600 truncate max-w-full sm:max-w-md">
                          Current: {documentFilename}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              type="button"
              onClick={handleAddQualification}
              className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto hover:bg-green-600 transition-colors text-sm sm:text-base"
            >
              <Plus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Add Other Qualification
            </button>
            <button
              type="submit"
              disabled={qualLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <Save className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Save Qualifications
            </button>
          </div>
        </form>
      </div>

      {/* Work Experience Section */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <Briefcase className="mr-2 w-5 h-5 sm:w-6 sm:h-6" /> Work Experience
        </h2>
        <form onSubmit={handleExperienceSubmit} className="space-y-6">
          {formEntries.map((entry, index) => (
            <div key={entry.id || index} className="border p-4 rounded-lg relative">
              <h3 className="text-base sm:text-lg font-medium text-gray-700">Experience {index + 1}</h3>
              {entry.id && (
                <Trash2
                  className="absolute top-4 right-4 text-red-500 cursor-pointer w-4 h-4 sm:w-5 sm:h-5"
                  onClick={() => handleDeleteExperience(entry.id)}
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="hidden"
                  value={entry.id || ""}
                  onChange={(e) => handleExperienceChange(index, "id", e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title *</label>
                  <input
                    type="text"
                    value={entry.job_title || ""}
                    onChange={(e) => handleExperienceChange(index, "job_title", e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee Type *</label>
                  <select
                    value={entry.employee_type || ""}
                    onChange={(e) => handleExperienceChange(index, "employee_type", e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization *</label>
                  <input
                    type="text"
                    value={entry.organization_name || ""}
                    onChange={(e) => handleExperienceChange(index, "organization_name", e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Type *</label>
                  <select
                    value={entry.work_type || ""}
                    onChange={(e) => handleExperienceChange(index, "work_type", e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="On-Site">On-Site</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    value={entry.start_date || ""}
                    onChange={(e) => handleExperienceChange(index, "start_date", e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={entry.end_date || ""}
                    onChange={(e) => handleExperienceChange(index, "end_date", e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    disabled={entry.currently_working}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currently Working</label>
                  <input
                    type="checkbox"
                    checked={entry.currently_working || false}
                    onChange={(e) => handleExperienceChange(index, "currently_working", e.target.checked)}
                    className="mt-1 h-4 w-4 sm:h-5 sm:w-5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={entry.total_experience || ""}
                    readOnly
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              type="button"
              onClick={handleAddExperience}
              className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto hover:bg-green-600 transition-colors text-sm sm:text-base"
            >
              <Plus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Add Experience
            </button>
            <button
              type="submit"
              disabled={expLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <Save className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Save Experiences
            </button>
          </div>
        </form>
      </div>

      {/* Proposer's Recommendations Section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="mr-2 w-5 h-5 sm:w-6 sm:h-6" /> Proposer's Recommendations
        </h2>
        <div className="space-y-6">
          {proposerForms.map((form, index) => {
            const proposer = proposers[index] || {};
            console.log(`Rendering Proposer ${index + 1}:`, proposer);
            return (
              <form key={index} onSubmit={(e) => handleProposerSubmit(e, index)} className="border p-4 rounded-lg">
                <h3 className="text-base sm:text-lg font-medium text-gray-700">Proposer {index + 1}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Based on personal knowledge of this professional's competence, qualification & experience, through their work, publication & professional services in public domain.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      name={`proposer_name_${index}`}
                      value={form.name}
                      onChange={(e) => handleProposerChange(index, "name", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class & Membership No. *</label>
                    <input
                      type="text"
                      name={`proposer_membership_${index}`}
                      value={form.membership_no}
                      onChange={(e) => handleProposerChange(index, "membership_no", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      name={`proposer_email_${index}`}
                      value={form.email}
                      onChange={(e) => handleProposerChange(index, "email", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile *</label>
                    <input
                      type="tel"
                      name={`proposer_mobile_${index}`}
                      value={form.mobile_no}
                      onChange={(e) => handleProposerChange(index, "mobile_no", e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={propLoading}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  <Save className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Save Proposer
                </button>
              </form>
            );
          })}
          <div className="border p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-medium text-gray-700">Technical Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Exposure in Technical Seminar/Research Activity *</label>
                <select
                  value={exposure === true ? "Yes" : exposure === false ? "No" : ""}
                  onChange={(e) => handleProposerDetailsChange("exposure", e.target.value === "Yes" ? true : e.target.value === "No" ? false : null)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience in Electronics Domain *</label>
                <select
                  value={electronics_experience === true ? "Yes" : electronics_experience === false ? "No" : ""}
                  onChange={(e) => handleProposerDetailsChange("electronics_experience", e.target.value === "Yes" ? true : e.target.value === "No" ? false : null)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Area of Specialization *</label>
                <input
                  type="text"
                  value={area_of_specialization || ""}
                  onChange={(e) => handleProposerDetailsChange("area_of_specialization", e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveProposerDetails}
              disabled={propLoading}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-center w-full sm:w-auto hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <Save className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Save Proposer Details
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between mt-8 pt-4 border-t gap-4">
        <button
          type="button"
          onClick={handlePrevStep}
          className="px-4 py-2 sm:px-6 sm:py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base flex items-center justify-center"
        >
          <ArrowLeft className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base flex items-center justify-center"
        >
          <Save className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Save and Continue
        </button>
      </div>
    </div>
  );
};

export default QualificationDetails;