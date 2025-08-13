import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export const logout = (navigate) => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.clear();
  sessionStorage.removeItem("formData");
  sessionStorage.removeItem("currentStep");
  sessionStorage.removeItem("completedSteps");
  toast.success("Logged out successfully");
  navigate("/login");
};
