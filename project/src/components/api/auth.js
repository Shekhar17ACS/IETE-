import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const logout = (navigate) => {
  // Clear authentication tokens
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.clear();
  
  // Optionally clear MultiStepForm data
  sessionStorage.removeItem('formData');
  sessionStorage.removeItem('currentStep');
  sessionStorage.removeItem('completedSteps');
  
  // Show success message
  toast.success('Logged out successfully');
  
  // Redirect to login
  navigate('/login');
};