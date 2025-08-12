export const mockFormData = {
  applicationNo: "APP596611",
  email: "Shekharsharma17800@gmail.com",
  userId: "USR-2025-0015",
  status: "In Progress",
  amount: 9600,
  date: "2025-06-12",
  isApproved: true,
  paymentStatus: "Pending",
  steps: [
    { id: 1, title: "Personal Details", status: "completed", date: "2025-06-12" },
    { id: 2, title: "Membership Selection", status: "Pending", date: null },
    { id: 3, title: "Document", status: "Pending", date: null },
    { id: 4, title: "Eligibility Check", status: "Pending", date: null },
    { id: 5, title: "Summary", status: "Pending", date: null }, // Corrected duplicate id and typo
    { id: 6, title: "Payment", status: "Pending", date: null }, // Corrected duplicate id
  ],
  images: [
    "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format",
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format",
  ],
};

export const mockPayments = [
  {
    id: "1",
    applicationNo: "APP596611",
    amount: 11800,
    adminFee: 5000,
    status: "Pending",
    date: "2025-05-07",
    transactionId: "TXN-2024-0015",
    paymentMethod: "UPI",
    remarks: "Awaiting bank confirmation",
  },
  {
    id: "2",
    applicationNo: "APP596611",
    amount: 11800,
    adminFee: 3000,
    status: "Completed",
    date: "2025-05-07",
    transactionId: "TXN-2024-0010",
    paymentMethod: "Credit Card",
    remarks: "Payment successful",
  },
];

export const mockAnalytics = {
  totalUsers: 1250,
  activeUsers: 856,
  totalRevenue: 125000,
  growthRate: 15.7,
  monthlyStats: [
    { month: 'Jan', users: 1000, revenue: 100000 },
    { month: 'Feb', users: 1100, revenue: 110000 },
    { month: 'Mar', users: 1250, revenue: 125000 }
  ]
};

export const mockReports = [
  {
    id: '1',
    title: 'Q1 Performance Review',
    date: '2025-06-22',
    status: 'approved',
    author: 'Naurangi LAl',
    type: 'performance',
    summary: 'Overall positive growth in Q1 with 15% increase in user engagement'
  },
  {
    id: '2',
    title: 'Staff Training Report',
    date: '2025-06-24',
    status: 'pending',
    author: 'Accounts',
    type: 'operational',
    summary: 'New employee onboarding program effectiveness analysis'
  },
  {
    id: '3',
    title: 'Budget Analysis',
    date: '2025-06-23',
    status: 'rejected',
    author: 'Secretary General',
    type: 'financial',
    summary: 'Detailed breakdown of Q1 expenses and revenue streams'
  }
];
