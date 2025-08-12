








import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchDashboardStats } from "../components/Redux/ReduxSlice/dashboardStatsSlice";
import { Users, UserCheck, IndianRupee, TrendingUp, ChevronRight, Calendar, Bell, User } from "lucide-react";
import { mockReports } from "../mockData/mockData";
import { getMemberDashboard } from "../Services/ApiServices/ApiService";

const StatCard = ({ icon: Icon, label, value, change, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer border border-gray-100`}
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-100 rounded-full">
        <Icon className="h-7 w-7 text-blue-700" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {/* <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p> */}
        <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 truncate">{value}</p>
        {change !== null && (
          <p className={`text-sm font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? `+${change}%` : `${change}%`} from last month
          </p>
        )}
      </div>
    </div>
  </div>
);

const MemberDetailsCard = ({ memberData, status, error }) => {
  if (status === "loading") {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gray-200 rounded-full h-12 w-12"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-xl text-center">
        Error: {error || "Failed to fetch member details"}
      </div>
    );
  }

  // Check if memberData is null or undefined
  if (!memberData) {
    return (
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl text-center">
        No member data available
      </div>
    );
  }

  return (
    // <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border border-gray-100">
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-indigo-100 rounded-full">
          <User className="h-7 w-7 text-indigo-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {memberData.title} {memberData.name} {memberData.middle_name} {memberData.last_name}
          </h2>
          <p className="text-sm text-gray-600">Membership ID: {memberData.membership_id}</p>
          <p className="text-sm text-green-600">{memberData.role.name}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium text-gray-600">Email</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Mobile Number</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData.mobile_number}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Date of Birth</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData.date_of_birth}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Gender</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData.gender}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Father's Name</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData.father_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Mother's Name</p>
          <p className="text-gray-800">
            <p className="text-gray-800 break-words text-sm sm:text-base"></p>
            {memberData.mother_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Spouse's Name</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData.spouse_name || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Address</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData.address1}, {memberData.address2}, {memberData.address3}, {memberData.city}, {memberData.state}, {memberData.country}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Membership Type</p>
          {/* <p className="text-gray-800">{memberData.membership_fee.membership_type}</p> */}
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData?.membership_fee?.membership_type || "N/a"}</p>

        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Membership Fee</p>
          {/* <p className="text-gray-800"> */}
          <p className="text-gray-800 break-words text-sm sm:text-base">
            {memberData?.membership_fee?.currency || "INR"} {parseFloat(memberData?.membership_fee?.fee_amount).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function MemberHome() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    totalUsers,
    activeUsers,
    totalRevenue,
    growthRate,
    newUsersThisMonth,
    status: dashboardStatus,
    error: dashboardError,
  } = useSelector((state) => state.dashboardStats);
  const [memberData, setMemberData] = useState(null);
  const [memberStatus, setMemberStatus] = useState("idle");
  const [memberError, setMemberError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setMemberStatus("loading");
        const response = await getMemberDashboard();
        if (response.status === "success") {
          setMemberData(response.data);
          setMemberStatus("succeeded");
        } else {
          throw new Error("Failed to fetch member details");
        }
      } catch (err) {
        setMemberError(err.message);
        setMemberStatus("failed");
      }
    };

    const token = sessionStorage.getItem("token");
    if (token) {
      dispatch(fetchDashboardStats(token));
      fetchData();
    }
  }, [dispatch]);

  const notifications = [
    {
      id: 1,
      type: "pending_review",
      title: "Pending Review",
      message: "Your application for Advanced Membership Course requires document verification.",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      type: "payment_issue",
      title: "Payment Issue",
      message: "Payment for Membership Course failed. Please update your payment method.",
      time: "5 hours ago",
      status: "urgent",
    },
    {
      id: 3,
      type: "document_expiration",
      title: "Document Expiration",
      message: "Your ID document expires on 2025-05-01. Please upload a new document.",
      time: "1 day ago",
      status: "warning",
    },
  ];

  const handleNotificationAction = (type) => {
    switch (type) {
      case "pending_review":
        navigate("/documents/verify");
        break;
      case "payment_issue":
        navigate("/payments");
        break;
      case "document_expiration":
        navigate("/documents/upload");
        break;
      default:
        navigate("/notifications");
    }
  };

  // return (
  //   <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
  //     {/* Stats Grid */}
  //     {dashboardStatus === "loading" ? (
  //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  //         {[...Array(4)].map((_, index) => (
  //           <div
  //             key={index}
  //             className="bg-white rounded-2xl p-6 shadow-lg animate-pulse"
  //           >
  //             <div className="flex items-center gap-4">
  //               <div className="p-3 bg-gray-200 rounded-full h-12 w-12"></div>
  //               <div className="space-y-2">
  //                 <div className="h-4 bg-gray-200 rounded w-24"></div>
  //                 <div className="h-6 bg-gray-200 rounded w-32"></div>
  //                 <div className="h-4 bg-gray-200 rounded w-20"></div>
  //               </div>
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     // ) : dashboardStatus === "failed" ? (
  //     //   <div className="bg-red-100 text-red-800 p-4 rounded-xl text-center">
  //     //     Error: {dashboardError || "Failed to fetch dashboard statistics"}
  //     //   </div>
  //     // ) : (
  //     ) : dashboardStatus === "failed" ? null : (

  //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  //         <StatCard
  //           icon={Users}
  //           label="Total Users"
  //           value={totalUsers}
  //           change={2.5}
  //           onClick={() => navigate("/Memberdashboard/add-member")}
  //         />
  //         <StatCard
  //           icon={UserCheck}
  //           label="Active Users"
  //           value={activeUsers}
  //           change={1.8}
  //           onClick={() => navigate("/Memberdashboard/add-member")}
  //         />
  //         <StatCard
  //           icon={IndianRupee}
  //           label="Total Revenue"
  //           value={`₹${totalRevenue.toLocaleString('en-IN')}`}
  //           change={3.2}
  //           onClick={() => navigate("/Memberdashboard/Analytics")}
  //         />
  //         <StatCard
  //           icon={TrendingUp}
  //           label="Growth Rate"
  //           value={`${growthRate}%`}
  //           change={growthRate}
  //           onClick={() => navigate("/Memberdashboard/Analytics")}
  //         />
  //       </div>
  //     )}

  //     {/* Member Details */}
  //     <MemberDetailsCard
  //       memberData={memberData}
  //       status={memberStatus}
  //       error={memberError}
  //     />

  //     {/* Recent Reports */}
  //     {/* <div className="bg-white rounded-xl p-6 shadow-sm">
  //       <div className="flex items-center justify-between mb-4">
  //         <h2 className="text-xl font-semibold text-gray-800">Recent Reports</h2>
  //         <button
  //           onClick={() => navigate("/Memberdashboard/Reports")}
  //           className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
  //         >
  //           View all <ChevronRight className="h-4 w-4" />
  //         </button>
  //       </div>
  //       <div className="overflow-x-auto">
  //         <table className="w-full">
  //           <thead>
  //             <tr className="border-b">
  //               <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
  //               <th className="text-left py-3 px-4 font-semibold text-gray-600">Author</th>
  //               <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
  //               <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {mockReports.map((report) => (
  //               <tr key={report.id} className="border-b hover:bg-gray-50">
  //                 <td className="py-3 px-4">{report.title}</td>
  //                 <td className="py-3 px-4">{report.author}</td>
  //                 <td className="py-3 px-4">{report.date}</td>
  //                 <td className="py-3 px-4">
  //                   <span
  //                     className={`px-3 py-1 rounded-full text-sm ${
  //                       report.status === "approved"
  //                         ? "bg-green-100 text-green-800"
  //                         : report.status === "rejected"
  //                         ? "bg-red-100 text-red-800"
  //                         : "bg-yellow-100 text-yellow-800"
  //                     }`}
  //                   >
  //                     {report.status}
  //                   </span>
  //                 </td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       </div>
  //     </div> */}

  //     {/* Quick Actions */}
  //     {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //       <div className="bg-white rounded-xl p-6 shadow-sm">
  //         <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
  //         <div className="space-y-4">
  //           <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
  //             <div className="p-2 bg-purple-100 rounded-lg">
  //               <Calendar className="h-5 w-5 text-purple-600" />
  //             </div>
  //             <div>
  //               <h3 className="font-medium">Team Meeting</h3>
  //               <p className="text-sm text-gray-500">Today at 2:00 PM</p>
  //             </div>
  //           </div>
  //           <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
  //             <div className="p-2 bg-blue-100 rounded-lg">
  //               <Calendar className="h-5 w-5 text-blue-600" />
  //             </div>
  //             <div>
  //               <h3 className="font-medium">Product Launch</h3>
  //               <p className="text-sm text-gray-500">Tomorrow at 10:00 AM</p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="bg-white rounded-xl p-6 shadow-sm">
  //         <h2 className="text-xl font-semibold text-gray-800 mb-4">Notifications & Alerts</h2>
  //         <div className="space-y-4">
  //           {notifications.map((notification) => (
  //             <div
  //               key={notification.id}
  //               className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
  //               onClick={() => handleNotificationAction(notification.type)}
  //             >
  //               <div
  //                 className={`p-2 rounded-lg ${
  //                   notification.status === "urgent"
  //                     ? "bg-red-100"
  //                     : notification.status === "warning"
  //                     ? "bg-yellow-100"
  //                     : "bg-blue-100"
  //                 }`}
  //               >
  //                 <Bell
  //                   className={`h-5 w-5 ${
  //                     notification.status === "urgent"
  //                       ? "text-red-600"
  //                       : notification.status === "warning"
  //                       ? "text-yellow-600"
  //                       : "text-blue-600"
  //                   }`}
  //                 />
  //               </div>
  //               <div>
  //                 <h3 className="font-medium">{notification.title}</h3>
  //                 <p className="text-sm text-gray-600">{notification.message}</p>
  //                 <p className="text-sm text-gray-500">{notification.time}</p>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     </div> */}
  //   </div>
  // );
return (
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 min-h-screen space-y-8">
    {/* Stats Grid */}
    {dashboardStatus === "loading" ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg animate-pulse">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-200 rounded-full h-12 w-12" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-6 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : dashboardStatus === "failed" ? null : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers}
          change={2.5}
          onClick={() => navigate("/Memberdashboard/add-member")}
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          value={activeUsers}
          change={1.8}
          onClick={() => navigate("/Memberdashboard/add-member")}
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          change={3.2}
          onClick={() => navigate("/Memberdashboard/Analytics")}
        />
        <StatCard
          icon={TrendingUp}
          label="Growth Rate"
          value={`${growthRate}%`}
          change={growthRate}
          onClick={() => navigate("/Memberdashboard/Analytics")}
        />
      </div>
    )}

    {/* Member Details */}
    <MemberDetailsCard memberData={memberData} status={memberStatus} error={memberError} />
  </div>
);

}