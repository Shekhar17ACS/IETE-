









import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Mail, Search, Clock } from "lucide-react"
import Stepper from "../MemberRegisteration/Stepper";
import toast from "react-hot-toast";
import { getPaymentStatus } from "../../Services/ApiServices/ApiService";

const MultiStepForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const [step, setStep] = useState(() => {
    const savedStep = Number(sessionStorage.getItem("currentStep")) || 1;
    return savedStep;
  });
  // const [formData, setFormData] = useState(() => JSON.parse(sessionStorage.getItem("formData")) || {});
  const [completedSteps, setCompletedSteps] = useState(() => JSON.parse(sessionStorage.getItem("completedSteps")) || []);

  // Map routes to step numbers
  const routeToStep = {
    // "/admin/eligible": 1,
    "/admin/eligible/step1": 1,
    "/admin/eligible/step2": 2,
    "/admin/eligible/step3": 3,
    "/admin/eligible/step4": 4,
    "/admin/eligible/step5": 5,
    "/admin/eligible/step6": 6,
    "/admin/eligible/step7": 7,
  };

  // checking the status of payment 
useEffect(() => {
  const checkPaymentStatus = async () => {
    const token = sessionStorage.getItem("token");
    const res = await getPaymentStatus(token);
    if (res.paymentCompleted) {
      setPaymentCompleted(true);
    }
  };
  checkPaymentStatus();
}, []);




  // Sync step with current route
  useEffect(() => {

    const currentStep = routeToStep[location.pathname] || 1;
    setStep(currentStep);
  }, [location.pathname, navigate]);




  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("currentStep", step);
    // sessionStorage.setItem("formData", JSON.stringify(formData));
    sessionStorage.setItem("completedSteps", JSON.stringify(completedSteps));
  }, [step,  completedSteps]);



  const handleNextStep = () => {
    if (!completedSteps.includes(step) ) {
      setCompletedSteps([...completedSteps, step]);
    }
    const nextStep = step + 1;
    setStep(nextStep);
    const nextRoute = nextStep <= 7 ? `/admin/eligible/step${nextStep}` : "/admin/eligible";
    navigate(nextRoute);
  };

  const handlePrevStep = () => {
    const prevStep = step > 1 ? step - 1 : 1;
    setStep(prevStep);
    const prevRoute = prevStep === 1 ? "/admin/eligible" : `/admin/eligible/step${prevStep}`;
    navigate(prevRoute);
  };

  const handleStepClick = (stepNumber) => {
    const targetRoute = stepNumber === 1 ? "/admin/eligible/step1" : `/admin/eligible/step${stepNumber}`;
    navigate(targetRoute);
  };


  //   setStep(1);
  //   setFormData({});
  //   setCompletedSteps([]);
  //   navigate("/admin/eligible");
  // };

  // return (
  //   <div className="flex flex-col min-h-screen bg-gray-100">
  //     <Stepper
  //       step={step}
  //       onStepClick={handleStepClick}
  //       completedSteps={completedSteps}
  //       canNavigateAll={true} // Change to true for unrestricted navigation
  //     />
  //     <div className="flex-1 flex justify-center bg-gray-100">
  //       <div className="w-full max-w-3xl p-6 bg-gray-100">
  //         <Outlet context={{  handleNextStep, handlePrevStep }} />
  //       </div>
  //     </div>
  //   </div>
  // );
  return paymentCompleted ? (

  <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
              <div className="w-6 h-6 bg-green-500 rounded-full absolute top-0"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </div>
        </div>

        {/* Content Section */}
        <div className="text-center space-y-6">
          <div className="space-y-3">
            <p className="text-lg text-gray-700 leading-relaxed">
              Thank you for submitting your application! We've received all your information and our team is now
              reviewing your submission.
            </p>
            <p className="text-gray-600">
              You'll receive updates throughout the review process to keep you informed of your application status.
            </p>
          </div>

          {/* What's Next Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center justify-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              What's Next?
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-left">
                  <strong>Check your email</strong> - We've sent a confirmation message with your application reference
                  number
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-left">
                  <strong>Use our tracker</strong> - Monitor your application progress in real-time using your reference
                  number
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-left">
                  <strong>Stay updated</strong> - We'll notify you via email at each stage of the review process
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            onClick={
              () =>navigate("/admin/form")
            }>
              <Search className="w-4 h-4" />
              Track Application
            </button>
            <a href="mailto:">
            <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Check Email
            </button>
            </a>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Expected review time: 2-3 Months • Reference: #APP-2025-
              {Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, "0")}
            </p>
          </div>
        </div>
      </div>
    </div>
) : (
  <div className="flex flex-col min-h-screen bg-gray-100">
    <Stepper
      step={step}
      onStepClick={handleStepClick}
      completedSteps={completedSteps}
      canNavigateAll={true}
    />
    <div className="flex-1 flex justify-center bg-gray-100">
      <div className="w-full max-w-3xl p-6 bg-gray-100">
        <Outlet context={{ handleNextStep, handlePrevStep }} />
      </div>
    </div>
  </div>
);
};

export default MultiStepForm;