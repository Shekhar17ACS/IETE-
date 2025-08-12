


"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Download, CheckCircle, XCircle, GitPullRequestDraftIcon, PhoneCallIcon } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { fetchApplicationPreview } from "../Redux/ReduxSlice/applicationPreviewSlice"
import { useOutletContext } from "react-router-dom"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import pendingGif from '../../assets/pendingGif.gif';

const FormPreview = ({ nextStep, prevStep }) => {
  const { handleNextStep, handlePrevStep, resetForm } = useOutletContext();
  const [consent, setConsent] = useState(false)
  const dispatch = useDispatch()
  const {
    personalDetails,
    qualifications,
    experiences,
    proposers,
    areaOfSpecialization,
    electronicsExperience,
    exposure,
    documents,
    membershipFee,
    loading,
    error,
  } = useSelector((state) => state.applicationPreview)
  const componentRef = useRef(null) // Reference to capture the component

  // Fetch data on mount
  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (token) {
      dispatch(fetchApplicationPreview({ token }))
    }
  }, [dispatch])

  // Map Redux state to formData structure
  const formData = {
    personalDetails: personalDetails || {},
    qualifications: qualifications || [],
    experiences: experiences || [],
    proposers: proposers || [],
    files: documents || {},
    membershipFee: membershipFee || {},
    exposure: exposure !== null ? (exposure ? "True" : "False") : "N/A",
    electronics_experience: electronicsExperience !== null ? (electronicsExperience ? "True" : "False") : "N/A",
    area_of_specialization: areaOfSpecialization || "N/A",
    membership_type: membershipFee?.membership_type || "N/A",
  }

  // Title mapping
  const titleMapping = {
    5: "Mr.",
    6: "Mrs.",
    7: "Miss",
    8: "Ms.",
    9: "Dr.",
    10: "Prof.",
    11: "Hon.",
    12: "Engr.",
    13: "Capt.",
    14: "Col.",
    15: "Gen.",
    16: "Adv.",
    Other: formData.personalDetails.custom_title || "Other",
  }

  // Degree mapping
  const degreeMapping = {
    1: "B.Tech",
    2: "M.Tech",
    3: "B.Sc",
    4: "BE",
    5: "M.Sc",
    6: "ME",
    7: "Ph.D.",
    8: "D.Sc",
    9: "D.Eng",
    10: "Other",
  }

  // Stream mapping
  const streamMapping = {
    1: "Computer Science",
    2: "Electronics & Communication",
    3: "Information Technology",
    4: "Mechanical",
    5: "Civil",
    6: "Other",
  }

  const handleDownload = async () => {
    if (componentRef.current) {
      try {
        // Capture the component as a canvas
        const canvas = await html2canvas(componentRef.current, {
          scale: 2, // Increase resolution
          useCORS: true,
          logging: false,
          width: componentRef.current.offsetWidth,
          height: componentRef.current.offsetHeight,
        })

        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
        const imgScaledWidth = imgWidth * ratio
        const imgScaledHeight = imgHeight * ratio

        // Add image to PDF, centered
        pdf.addImage(
          imgData,
          "PNG",
          (pdfWidth - imgScaledWidth) / 2,
          (pdfHeight - imgScaledHeight) / 2,
          imgScaledWidth,
          imgScaledHeight
        )

        pdf.save("membership-application-form.pdf")
      } catch (error) {
      
      }
    }

    // Optional: Keep original JSON download if needed
    /*
    const data = JSON.stringify(formData, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "membership-application-form.json"
    a.click()
    URL.revokeObjectURL(url)
    */
  }

  // Process qualifications
  const processQualifications = () => {
    const processedQuals = []

    if (formData.personalDetails["[0]qualification_type"]) {
      processedQuals.push({
        level: "PhD/Doctorate",
        degree:
          degreeMapping[formData.personalDetails["[0]qualification_type"]] ||
          formData.personalDetails["[0]qualification_type"],
        stream:
          streamMapping[formData.personalDetails["[0]qualification_branch"]] ||
          formData.personalDetails["[0]qualification_branch"],
        university: formData.personalDetails["[0]board_university"],
        institute: formData.personalDetails["[0]institute_name"],
        year: formData.personalDetails["[0]year_of_passing"],
        cgpa: formData.personalDetails["[0]percentage_cgpa"],
      })
    }

    if (formData.personalDetails["[1]qualification_type"]) {
      processedQuals.push({
        level: "Post-Graduation",
        degree:
          degreeMapping[formData.personalDetails["[1]qualification_type"]] ||
          formData.personalDetails["[1]qualification_type"],
        stream:
          streamMapping[formData.personalDetails["[1]qualification_branch"]] ||
          formData.personalDetails["[1]qualification_branch"],
        university: formData.personalDetails["[1]board_university"],
        institute: formData.personalDetails["[1]institute_name"],
        year: formData.personalDetails["[1]year_of_passing"],
        cgpa: formData.personalDetails["[1]percentage_cgpa"],
      })
    }

    if (formData.personalDetails["[2]qualification_type"]) {
      processedQuals.push({
        level: "Graduation",
        degree:
          degreeMapping[formData.personalDetails["[2]qualification_type"]] ||
          formData.personalDetails["[2]qualification_type"],
        stream:
          streamMapping[formData.personalDetails["[2]qualification_branch"]] ||
          formData.personalDetails["[2]qualification_branch"],
        university: formData.personalDetails["[2]board_university"],
        institute: formData.personalDetails["[2]institute_name"],
        year: formData.personalDetails["[2]year_of_passing"],
        cgpa: formData.personalDetails["[2]percentage_cgpa"],
      })
    }

    if (formData.personalDetails.otherQualifications && Array.isArray(formData.personalDetails.otherQualifications)) {
      formData.personalDetails.otherQualifications.forEach((qual, index) => {
        processedQuals.push({
          level: `Other Qualification ${index + 1}`,
          degree: degreeMapping[qual.qualification_type] || qual.qualification_type,
          stream: streamMapping[qual.qualification_branch] || qual.qualification_branch,
          university: qual.board_university,
          institute: qual.institute_name,
          year: qual.year_of_passing,
          cgpa: qual.percentage_cgpa,
        })
      })
    }

    if (formData.qualifications && Array.isArray(formData.qualifications)) {
      formData.qualifications.forEach((qual, index) => {
        processedQuals.push({
          level: qual.level || `Qualification ${index + 1}`,
          degree: degreeMapping[qual.qualification_type] || qual.qualification_type || "N/A",
          stream: streamMapping[qual.qualification_branch] || qual.qualification_branch || "N/A",
          university: qual.board_university || "N/A",
          institute: qual.institute_name || "N/A",
          year: qual.year_of_passing || "N/A",
          cgpa: qual.percentage_cgpa || "N/A",
        })
      })
    }

    return processedQuals
  }

  const processedQualifications = processQualifications()

  if (loading) {
    return <div className="text-center p-4 sm:p-8">Loading application preview...</div>
  }

 
  if (error) {
  return (
    <div className="flex flex-col items-center justify-center  text-center">
      <img
        src={pendingGif}
        alt="Pending approval"
        className="w-72 h-auto mb-2"
      />
      <PhoneCallIcon className="h-10 w-10 text-green-500 mb-2" />
      <p className="text-red-600 text-lg font-medium">
        Membership application is not yet approved by required number of proposers.
      </p>
    </div>
  );
}

  return (
    <motion.div
      ref={componentRef} // Attach ref to capture this element
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 bg-white"
    >
      {/* Government Header */}
      <div className="text-center border-b-4 border-black pb-4 sm:pb-6 mb-6 sm:mb-8">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-black mb-2 px-2">
          THE INSTITUTION OF ELECTRONICS AND TELECOMMUNICATION ENGINEERS
        </h1>
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-black mb-2">MEMBERSHIP APPLICATION FORM</h2>
        <p className="text-xs sm:text-sm text-gray-700 px-2">
          Application Preview - Please verify all details before submission
        </p>
      </div>

      {/* Section 1: Personal Details */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 1: PERSONAL DETAILS
        </h3>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">Title</td>
                <td className="border border-black p-2 w-1/4">
                  {titleMapping[formData.personalDetails.title] || formData.personalDetails.title || "N/A"}
                </td>
                <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">First Name</td>
                <td className="border border-black p-2 w-1/4">{formData.personalDetails.name || "N/A"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Middle Name</td>
                <td className="border border-black p-2">{formData.personalDetails.middle_name || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100">Last Name</td>
                <td className="border border-black p-2">{formData.personalDetails.last_name || "N/A"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Father's Name</td>
                <td className="border border-black p-2">{formData.personalDetails.father_name || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100">Mother's Name</td>
                <td className="border border-black p-2">{formData.personalDetails.mother_name || "N/A"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Spouse Name</td>
                <td className="border border-black p-2">{formData.personalDetails.spouse_name || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100">Date of Birth</td>
                <td className="border border-black p-2">{formData.personalDetails.date_of_birth || "N/A"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Gender</td>
                <td className="border border-black p-2">{formData.personalDetails.gender || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100">Indian Resident</td>
                <td className="border border-black p-2">{formData.personalDetails.from_india ? "Yes" : "No"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          {[
            {
              label: "Title",
              value: titleMapping[formData.personalDetails.title] || formData.personalDetails.title || "N/A",
            },
            { label: "First Name", value: formData.personalDetails.name || "N/A" },
            { label: "Middle Name", value: formData.personalDetails.middle_name || "N/A" },
            { label: "Last Name", value: formData.personalDetails.last_name || "N/A" },
            { label: "Father's Name", value: formData.personalDetails.father_name || "N/A" },
            { label: "Mother's Name", value: formData.personalDetails.mother_name || "N/A" },
            { label: "Spouse Name", value: formData.personalDetails.spouse_name || "N/A" },
            { label: "Date of Birth", value: formData.personalDetails.date_of_birth || "N/A" },
            { label: "Gender", value: formData.personalDetails.gender || "N/A" },
            { label: "Indian Resident", value: formData.personalDetails.from_india ? "Yes" : "No" },
          ].map((item, index) => (
            <div key={index} className="border border-black">
              <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">{item.label}</div>
              <div className="p-2 text-xs sm:text-sm break-words">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Contact Details */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 2: CONTACT DETAILS
        </h3>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">Email Address</td>
                <td className="border border-black p-2 w-3/4" colSpan="3">
                  {formData.personalDetails.email || "N/A"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Mobile Number</td>
                <td className="border border-black p-2">{formData.personalDetails.mobile_number || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100 w-1/4">Landline Number</td>
                <td className="border border-black p-2">{formData.personalDetails.landline_no || "N/A"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Address Line 1</td>
                <td className="border border-black p-2" colSpan="3">
                  {formData.personalDetails.address1 || "N/A"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Address Line 2</td>
                <td className="border border-black p-2" colSpan="3">
                  {formData.personalDetails.address2 || "N/A"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Address Line 3</td>
                <td className="border border-black p-2" colSpan="3">
                  {formData.personalDetails.address3 || "N/A"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Country</td>
                <td className="border border-black p-2">{formData.personalDetails.country || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100">State</td>
                <td className="border border-black p-2">{formData.personalDetails.state || "N/A"}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">City</td>
                <td className="border border-black p-2">{formData.personalDetails.city || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100">Pincode</td>
                <td className="border border-black p-2">{formData.personalDetails.pincode || "N/A"}</td>
              </tr>

              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Centre</td>
                <td className="border border-black p-2">{formData.personalDetails.centre_name || "N/A"}</td>
                <td className="border border-black p-2 font-semibold bg-gray-100">Sub Centre</td>
                <td className="border border-black p-2">{formData.personalDetails.sub_centre_name || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          {[
            { label: "Email Address", value: formData.personalDetails.email || "N/A" },
            { label: "Mobile Number", value: formData.personalDetails.mobile_number || "N/A" },
            { label: "Landline Number", value: formData.personalDetails.landline_no || "N/A" },
            { label: "Address Line 1", value: formData.personalDetails.address1 || "N/A" },
            { label: "Address Line 2", value: formData.personalDetails.address2 || "N/A" },
            { label: "Address Line 3", value: formData.personalDetails.address3 || "N/A" },
            { label: "Country", value: formData.personalDetails.country || "N/A" },
            { label: "State", value: formData.personalDetails.state || "N/A" },
            { label: "City", value: formData.personalDetails.city || "N/A" },
            { label: "Pincode", value: formData.personalDetails.pincode || "N/A" },
            { label: "Centre", value: formData.personalDetails.centre_name || "N/A" },
            { label: "Sub Centre", value: formData.personalDetails.sub_centre_name || "N/A" },
          ].map((item, index) => (
            <div key={index} className="border border-black">
              <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">{item.label}</div>
              <div className="p-2 text-xs sm:text-sm break-words">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Educational Qualifications */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 3: EDUCATIONAL QUALIFICATIONS
        </h3>

        {processedQualifications.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 font-semibold">Level</th>
                    <th className="border border-black p-2 font-semibold">Degree</th>
                    <th className="border border-black p-2 font-semibold">Stream</th>
                    <th className="border border-black p-2 font-semibold">University</th>
                    <th className="border border-black p-2 font-semibold">Institute</th>
                    <th className="border border-black p-2 font-semibold">Year</th>
                    <th className="border border-black p-2 font-semibold">CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {processedQualifications.map((qual, index) => (
                    <tr key={index}>
                      <td className="border border-black p-2">{qual.level}</td>
                      <td className="border border-black p-2">{qual.degree || "N/A"}</td>
                      <td className="border border-black p-2">{qual.stream || "N/A"}</td>
                      <td className="border border-black p-2">{qual.university || "N/A"}</td>
                      <td className="border border-black p-2">{qual.institute || "N/A"}</td>
                      <td className="border border-black p-2">{qual.year || "N/A"}</td>
                      <td className="border border-black p-2">{qual.cgpa || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {processedQualifications.map((qual, index) => (
                <div key={index} className="border border-black">
                  <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">
                    {qual.level}
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { label: "Degree", value: qual.degree || "N/A" },
                      { label: "Stream", value: qual.stream || "N/A" },
                      { label: "University", value: qual.university || "N/A" },
                      { label: "Institute", value: qual.institute || "N/A" },
                      { label: "Year", value: qual.year || "N/A" },
                      { label: "CGPA", value: qual.cgpa || "N/A" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row">
                        <span className="font-semibold text-xs sm:text-sm sm:w-1/3">{item.label}:</span>
                        <span className="text-xs sm:text-sm break-words sm:w-2/3">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="border border-black p-4 text-center text-gray-600 text-xs sm:text-sm">
            No educational qualifications provided
          </div>
        )}
      </div>

      {/* Section 4: Work Experience */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 4: WORK EXPERIENCE
        </h3>

        {formData.experiences && formData.experiences.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 font-semibold">Job Title</th>
                    <th className="border border-black p-2 font-semibold">Organization</th>
                    <th className="border border-black p-2 font-semibold">Employee Type</th>
                    <th className="border border-black p-2 font-semibold">Start Date</th>
                    <th className="border border-black p-2 font-semibold">End Date</th>
                    <th className="border border-black p-2 font-semibold">Work Type</th>
                    <th className="border border-black p-2 font-semibold">Experience</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.experiences.map((exp, index) => (
                    <tr key={index}>
                      <td className="border border-black p-2">{exp.job_title || "N/A"}</td>
                      <td className="border border-black p-2">{exp.organization_name || "N/A"}</td>
                      <td className="border border-black p-2">{exp.employee_type || "N/A"}</td>
                      <td className="border border-black p-2">{exp.start_date || "N/A"}</td>
                      <td className="border border-black p-2">
                        {exp.currently_working ? "Present" : exp.end_date || "N/A"}
                      </td>
                      <td className="border border-black p-2">{exp.work_type || "N/A"}</td>
                      <td className="border border-black p-2">{exp.total_experience || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {formData.experiences.map((exp, index) => (
                <div key={index} className="border border-black">
                  <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">
                    Experience {index + 1}
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { label: "Job Title", value: exp.job_title || "N/A" },
                      { label: "Organization", value: exp.organization_name || "N/A" },
                      { label: "Employee Type", value: exp.employee_type || "N/A" },
                      { label: "Start Date", value: exp.start_date || "N/A" },
                      { label: "End Date", value: exp.currently_working ? "Present" : exp.end_date || "N/A" },
                      { label: "Work Type", value: exp.work_type || "N/A" },
                      { label: "Experience", value: exp.total_experience || "N/A" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row">
                        <span className="font-semibold text-xs sm:text-sm sm:w-1/3">{item.label}:</span>
                        <span className="text-xs sm:text-sm break-words sm:w-2/3">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="border border-black p-4 text-center text-gray-600 text-xs sm:text-sm">
            No work experience provided
          </div>
        )}
      </div>

      {/* Section 5: Proposer Details */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 5: PROPOSER RECOMMENDATIONS
        </h3>

        {formData.proposers && formData.proposers.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 font-semibold">Proposer</th>
                    <th className="border border-black p-2 font-semibold">Name</th>
                    <th className="border border-black p-2 font-semibold">Membership No.</th>
                    <th className="border border-black p-2 font-semibold">Email</th>
                    <th className="border border-black p-2 font-semibold">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.proposers.map((proposer, index) => (
                    <tr key={index}>
                      <td className="border border-black p-2 font-semibold">Proposer {index + 1}</td>
                      <td className="border border-black p-2">{proposer.name || "N/A"}</td>
                      <td className="border border-black p-2">{proposer.membership_no || "N/A"}</td>
                      <td className="border border-black p-2">{proposer.email || "N/A"}</td>
                      <td className="border border-black p-2">{proposer.mobile_no || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {formData.proposers.map((proposer, index) => (
                <div key={index} className="border border-black">
                  <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">
                    Proposer {index + 1}
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { label: "Name", value: proposer.name || "N/A" },
                      { label: "Membership No.", value: proposer.membership_no || "N/A" },
                      { label: "Email", value: proposer.email || "N/A" },
                      { label: "Mobile", value: proposer.mobile_no || "N/A" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row">
                        <span className="font-semibold text-xs sm:text-sm sm:w-1/3">{item.label}:</span>
                        <span className="text-xs sm:text-sm break-words sm:w-2/3">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="border border-black p-4 text-center text-gray-600 text-xs sm:text-sm">
            No proposer details provided
          </div>
        )}
      </div>

      {/* Section 6: Additional Information */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 6: ADDITIONAL INFORMATION
        </h3>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100 w-1/2">
                  Exposure in Technical Seminar/Research Activity
                </td>
                <td className="border border-black p-2 w-1/2">
                  {formData.exposure === "True" ? "Yes" : formData.exposure === "False" ? "No" : "N/A"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Experience in Electronics Domain</td>
                <td className="border border-black p-2">
                  {formData.electronics_experience === "True"
                    ? "Yes"
                    : formData.electronics_experience === "False"
                      ? "No"
                      : "N/A"}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-semibold bg-gray-100">Area of Specialization</td>
                <td className="border border-black p-2">{formData.area_of_specialization || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          {[
            {
              label: "Exposure in Technical Seminar/Research Activity",
              value: formData.exposure === "True" ? "Yes" : formData.exposure === "False" ? "No" : "N/A",
            },
            {
              label: "Experience in Electronics Domain",
              value:
                formData.electronics_experience === "True"
                  ? "Yes"
                  : formData.electronics_experience === "False"
                    ? "No"
                    : "N/A",
            },
            { label: "Area of Specialization", value: formData.area_of_specialization || "N/A" },
          ].map((item, index) => (
            <div key={index} className="border border-black">
              <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">{item.label}</div>
              <div className="p-2 text-xs sm:text-sm break-words">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: Membership Selection */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 7: MEMBERSHIP SELECTION
        </h3>

        <div className="border border-black">
          <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">
            Selected Membership Type
          </div>
          <div className="p-2 text-xs sm:text-sm font-semibold text-blue-800 break-words">
            {formData.membership_type || "N/A"}
          </div>
        </div>
      </div>

      {/* Section 8: Document Upload Status */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          SECTION 8: DOCUMENT UPLOAD STATUS
        </h3>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 font-semibold">Document Type</th>
                <th className="border border-black p-2 font-semibold">Status</th>
                <th className="border border-black p-2 font-semibold">File Name</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: "profile_photo", label: "Profile Photo" },
                { key: "signature", label: "Signature" },
                { key: "aadhar_front", label: "Aadhar Card (Front)" },
                { key: "aadhar_back", label: "Aadhar Card (Back)" },
                { key: "passport", label: "Passport (Optional)" },
              ].map(({ key, label }) => (
                <tr key={key}>
                  <td className="border border-black p-2">{label}</td>
                  <td className="border border-black p-2">
                    {formData.files[key] ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Not Uploaded
                      </span>
                    )}
                  </td>
                  <td className="border border-black p-2">
                    {formData.files[key] ? formData.files[key].name || "File uploaded" : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {[
            { key: "profile_photo", label: "Profile Photo" },
            { key: "signature", label: "Signature" },
            { key: "aadhar_front", label: "Aadhar Card (Front)" },
            { key: "aadhar_back", label: "Aadhar Card (Back)" },
            { key: "passport", label: "Passport (Optional)" },
          ].map(({ key, label }) => (
            <div key={key} className="border border-black">
              <div className="bg-gray-100 border-b border-black p-2 font-semibold text-xs sm:text-sm">{label}</div>
              <div className="p-3 space-y-2">
                <div className="flex flex-col sm:flex-row">
                  <span className="font-semibold text-xs sm:text-sm sm:w-1/3">Status:</span>
                  <span className="text-xs sm:text-sm sm:w-2/3">
                    {formData.files[key] ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Not Uploaded
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="font-semibold text-xs sm:text-sm sm:w-1/3">File Name:</span>
                  <span className="text-xs sm:text-sm break-words sm:w-2/3">
                    {formData.files[key] ? formData.files[key].name || "File uploaded" : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Declaration and Consent */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-black bg-gray-200 p-2 mb-4 border border-black">
          DECLARATION AND CONSENT
        </h3>

        <div className="border border-black p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-justify mb-4">
            I hereby declare that the information provided in this application form is true and accurate to the best of
            my knowledge. I understand that any false information may result in the rejection of my application or
            cancellation of membership. I agree to abide by the rules and regulations of The Institution of Electronics
            and Telecommunication Engineers (IETE).
          </p>

          <div className="flex items-start space-x-2 mt-4">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-2 border-black rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
            />
            <label htmlFor="consent" className="text-xs sm:text-sm font-medium">
              I agree to the above declaration and give my consent for processing this application.
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 sm:pt-6 border-t-2 border-black">
        <button
          onClick={handlePrevStep}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border-2 border-black text-black font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
        >
          ← Back to Eligibility
        </button>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border-2 border-black text-black font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
          >
            <Download className="h-4 w-4" />
            Download Application
          </button>

          <button
            onClick={handleNextStep}
            disabled={!consent}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-semibold transition-colors text-sm sm:text-base ${
              consent
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300"
            }`}
          >
            Submit Application →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default FormPreview