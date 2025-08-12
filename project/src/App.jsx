import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { MembershipForm } from './components/membership/MembershipForm';
// import { Dashboard } from './components/admin/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import { Events } from './components/Events';
import { ForgotPassword } from './components/auth/ForgotPassword';
// import { EligibilityCheck } from './components/EligibilityCheck';
import Newsletter from './components/NewsletterAndMap';

import Userdashboard from './Userdash/Userdashboard'
import { LoginDescription } from './components/auth/LoginDescription';
import  ThankYouPage  from './components/MemberRegisteration/ThankYouPage';
import PaymentFailedPage from './components/MemberRegisteration/PaymentFailedPage';
import TermsAndConditions from './components/auth/TermsAndConditions';
import PrivacyPolicy from './components/auth/PrivacyPolicy';
import PaymentHistory from './components/MemberRegisteration/PaymentHistory';
import MultiStepForm from './components/pages/MultiStepForm';
import FormTracker from './Userdash/FormTracker';
import { mockFormData, mockPayments } from './mockData/mockData';
import PersonalDetails from './components/MemberRegisteration/PersonalDetails';
import QualificationDetails from './components/MemberRegisteration/QualificationDetails';
import CourseSelection from './components/MemberRegisteration/CourseSelection';
import DocumentUpload from './components/MemberRegisteration/DocumentUpload';
import EligibilityCheck from './components/MemberRegisteration/EligibilityCheck';
import FormPreview from './components/MemberRegisteration/FormPreview';
import Payment from './components/MemberRegisteration/Payment';
import Matrix from './Memberdash/Matrix';
import RoleManagement from './Memberdash/RoleManagement';
import EmployeeManagement from './Memberdash/EmployeeManagement';
import AuditLogs from './Memberdash/AuditLogs';
import MemberHeader from './Memberdash/MemberHeader';
import MemberLayout from './Memberdash/MemberLayout';
import MemberHome from './Memberdash/MemberHome';
import MemberSidebar from './Memberdash/MemberSidebar';
import Analytics from './Memberdash/Analytics';
import MemberProfile from './Memberdash/MemberProfile';
import ApplicationManagement from './Memberdash/ApplicationManagement';
import Config from './Memberdash/Config';

import MemberReportExport from './Memberdash/MemberReportExport';
import ApprovalStatus from './Memberdash/ApprovalStatus';




import ProposerActionResponse from './Memberdash/ProposerActionResponse';
import PendingPayments from './Memberdash/PendingPayments';
import IdCardCertificate from './Memberdash/IdCardCertificate';


 

function HeaderWrapper() {
  const location = useLocation();
  const excludedPaths = [
    '/login-des',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/reset-password/',
    '/register',
    '/terms',
    '/privacy',
    '/matrix',
    '/Role',
    '/Employee',
    '/Audit-log',
    '/proposers/action/',

  ];

  // Exclude all routes starting with /admin
  return !excludedPaths.includes(location.pathname) && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/Memberdashboard') ? (
    <Header />
  ) : null;
}



function FooterWrapper() {
  const location = useLocation();
  const excludedPaths = [
    '/login-des',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/reset-password/',
    '/register',
    '/terms',
    '/privacy',
    '/matrix',
    '/Role',
    '/Employee',
    '/Audit-log',
    '/proposers/action/',
  ];

  // Exclude all routes starting with /admin
  return !excludedPaths.includes(location.pathname) && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/Memberdashboard') ? (
    <Footer />
  ) : null;
}

function ProtectedRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem('token') !== null; // Replace with your auth logic
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
        <ToastContainer />
          <Toaster position="top-right" />
          <HeaderWrapper />
          {/* <Header /> */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/membership" element={<MembershipForm />} />
              <Route path="/events" element={<Events />} />
              {/* <Route path="/admin" element={<ProtectedRoute><Userdashboard /></ProtectedRoute>} /> */}
              {/* Nested routes under /admin */}
              <Route path="/admin" element={<ProtectedRoute><Userdashboard /></ProtectedRoute>}>
                {/* <Route index element={<MultiStepForm />} />  */}
                <Route index element={<Navigate to="/admin/eligible/step1" replace />} /> {/* Default route: /admin */}
                <Route path="eligible" element={<MultiStepForm />}>
                  {/* <Route index element={<PersonalDetails />} /> */}
                <Route index element={<Navigate to="/admin/eligible/step1" replace />} /> {/* Default route: /admin */}
                  <Route path="step1" element={<PersonalDetails />} />
                  <Route path="step2" element={<QualificationDetails />} />
                  <Route path="step3" element={<CourseSelection />} />
                  <Route path="step4" element={<DocumentUpload />} />
                  <Route path="step5" element={<EligibilityCheck />} />
                  <Route path="step6" element={<FormPreview />} />
                  <Route path="step7" element={<Payment />} />
                  <Route path="*" element={<Navigate to="/admin/eligible/step1" />} />
                </Route>
                <Route path="form" element={<FormTracker formData={mockFormData} />} /> 
                <Route path="payments" element={<PaymentHistory />} /> 
              </Route>
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ForgotPassword />} /> {/* Ensure this exists */}
              <Route path="/eligibility-check" element={<EligibilityCheck />} /> 
              <Route path="/login-des" element={<LoginDescription />} /> 
              <Route path="/thank-you" element={<ThankYouPage />} />
              <Route path="/payment-failed" element={<PaymentFailedPage />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
 
              <Route path="/Memberdashboard" element={<ProtectedRoute><MemberLayout /></ProtectedRoute>}>
                <Route index element={<MemberHome />} />
                <Route path="Sidebar" element={<MemberSidebar />} />
                <Route path="Matrix" element={<Matrix />} />
                <Route path="Role" element={<RoleManagement />} />
                <Route path="add-member" element={<EmployeeManagement />} />
                <Route path="Audit-log" element={<AuditLogs />} />
                <Route path="Analytics" element={<Analytics />} />
                <Route path="MemberHeader" element={<MemberHeader />} />
                <Route path="MemberProfile" element={<MemberProfile />} />
                <Route path="Applicants" element={<ApplicationManagement />} />
                <Route path="Config" element={<Config />} />
                <Route path="Reports" element={<MemberReportExport />} />
                <Route path="Approval_Stats" element={<ApprovalStatus />} />
                <Route path="Cert_Id" element={<IdCardCertificate />} />
  
                
                <Route path="Accounts" element={<PendingPayments />} />

                <Route path="*" element={<Navigate to="/Memberdashboard" />} />
                {/* Add more subroutes like profile, settings, etc. */}
              </Route>
                <Route path="/proposers/action" element={<ProposerActionResponse />} />

              {/* Add more routes as needed */}
            </Routes>
          </main>
          {/* <Footer />  */}
          <FooterWrapper />
        </div>
      </Suspense>
    </Router>
  );
}

function Home() {
  return (
    <>
      <Hero />
      <About />
      <Newsletter/>
      {/* <Contact /> */}
    </>
  );
}

export default App;