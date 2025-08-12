




import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../components/Redux/ReduxSlice/dashboardStatsSlice';
import {
  Users,
  IndianRupee,
  UserCheck,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard = ({ icon: Icon, label, value, change, trend, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer border border-gray-100 group relative`}
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-blue-100 rounded-full">
        <Icon className="h-7 w-7 text-blue-700" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {change !== null && (
          <p className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? `+${change}%` : `${change}%`} from last month
          </p>
        )}
      </div>
    </div>
    {/* <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-2xl text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      Click to view details
    </div> */}
  </div>
);

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportRef = useRef();
  const dispatch = useDispatch();
  const {
    totalUsers,
    activeUsers,
    totalRevenue,
    growthRate,
    revenueBreakdown,
    recentSignups,
    status,
    error,
  } = useSelector((state) => state.dashboardStats);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      dispatch(fetchDashboardStats(token));
    }
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (type) => {
    setShowExportOptions(false);
    const data = [
      ["Metric", "Value"],
      ["Total Users", totalUsers],
      ["Active Users", activeUsers],
      ["Total Revenue", totalRevenue],
      ["Growth Rate", growthRate],
      ["Revenue Breakdown", JSON.stringify(revenueBreakdown)],
      ["Recent Signups", JSON.stringify(recentSignups)],
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-data.${type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Placeholder time-series data (since API doesn't provide it)
  const getTimeSeriesData = (range) => {
    // Mock data for charts; replace with real time-series data if available
    switch (range) {
      case '7':
        return {
          revenueChart: [totalRevenue * 0.7, totalRevenue * 0.75, totalRevenue * 0.8, totalRevenue * 0.85, totalRevenue * 0.9, totalRevenue * 0.95, totalRevenue],
          userGrowth: [totalUsers * 0.5, totalUsers * 0.6, totalUsers * 0.7, totalUsers * 0.8, totalUsers * 0.85, totalUsers * 0.9, totalUsers],
          conversion: [totalUsers * 10, totalUsers * 5, activeUsers, activeUsers * 0.3],
        };
      case '90':
        return {
          revenueChart: [totalRevenue * 0.5, totalRevenue * 0.6, totalRevenue * 0.65, totalRevenue * 0.7, totalRevenue * 0.75, totalRevenue * 0.8, totalRevenue * 0.85, totalRevenue * 0.9, totalRevenue],
          userGrowth: [totalUsers * 0.4, totalUsers * 0.5, totalUsers * 0.6, totalUsers * 0.65, totalUsers * 0.7, totalUsers * 0.75, totalUsers * 0.8, totalUsers * 0.9, totalUsers],
          conversion: [totalUsers * 15, totalUsers * 8, activeUsers * 1.5, activeUsers * 0.5],
        };
      default:
        return {
          revenueChart: [totalRevenue * 0.6, totalRevenue * 0.7, totalRevenue * 0.8, totalRevenue * 0.85, totalRevenue * 0.9, totalRevenue],
          userGrowth: [totalUsers * 0.5, totalUsers * 0.6, totalUsers * 0.7, totalUsers * 0.8, totalUsers * 0.9, totalUsers],
          conversion: [totalUsers * 12, totalUsers * 6, activeUsers, activeUsers * 0.4],
        };
    }
  };

  const timeSeriesData = getTimeSeriesData(timeRange);

  const revenueData = {
    labels: timeRange === '7' ? ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'] :
            timeRange === '90' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9'] :
            ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [{
      label: 'Revenue (₹)',
      data: timeSeriesData.revenueChart,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const userGrowthData = {
    labels: timeRange === '7' ? ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'] :
            timeRange === '90' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9'] :
            ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [{
      label: 'New Users',
      data: timeSeriesData.userGrowth,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const conversionData = {
    labels: ['Visitors', 'Signups', 'Active', 'Paying'],
    datasets: [{
      label: 'Conversion Funnel',
      data: timeSeriesData.conversion,
      borderColor: 'rgb(249, 115, 22)',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const userDistributionData = {
    labels: revenueBreakdown.map(item => item.membership_type.replace(/"/g, '')),
    datasets: [{
      data: revenueBreakdown.map(item => item.total_amount),
      backgroundColor: ['rgb(147, 51, 234)', 'rgb(59, 130, 246)', 'rgb(236, 72, 153)', 'rgb(75, 85, 99)'],
      borderColor: ['rgba(147, 51, 234, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(75, 85, 99, 0.8)'],
      borderWidth: 2,
    }],
  };

  const lastUpdated = recentSignups.length > 0 ? new Date(recentSignups[0].created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) : 'N/A';

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Detailed insights and performance metrics</p>
          <p className="text-sm text-gray-400 mt-2">Last Updated: {lastUpdated}</p>
        </div>

        <div className="relative" ref={exportRef}>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-200 rounded-lg px-8 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {showExportOptions && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-xl z-50 animate-slide-down">
              <button
                onClick={() => handleExport('pdf')}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {status === 'loading' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-200 rounded-full h-12 w-12"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : status === 'failed' ? (
        <div className="bg-red-100 text-red-800 p-4 rounded-xl text-center">
          Error: {error || 'Failed to fetch analytics data'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Members"
            value={totalUsers}
            change={2.5} // Placeholder; replace with actual change if available
            trend="up"
            // onClick={() => window.location.href = '/users'}
          />
          <StatCard
            icon={IndianRupee}
            label="Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            change={3.2} // Placeholder; replace with actual change if available
            trend="up"
            // onClick={() => window.location.href = '/analytics'}
          />
          <StatCard
            icon={UserCheck}
            label="Active Members"
            value={activeUsers}
            change={1.8} // Placeholder; replace with actual change if available
            trend="up"
            // onClick={() => window.location.href = '/users'}
          />
          <StatCard
            icon={TrendingUp}
            label="Growth Rate"
            value={`${growthRate}%`}
            change={growthRate}
            trend={growthRate >= 0 ? 'up' : 'down'}
            // onClick={() => window.location.href = '/analytics'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {status === 'loading' ? (
          <>
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </>
        ) : status === 'failed' ? (
          <div className="col-span-2 bg-red-100 text-red-800 p-4 rounded-xl text-center">
            Error: {error || 'Failed to fetch chart data'}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
              <Line
                data={revenueData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                  scales: { y: { beginAtZero: true, title: { display: true, text: 'Revenue (₹)' } } },
                }}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Membership Type</h2>
              <div className="flex items-center justify-center">
                <div className="w-64">
                  <Doughnut
                    data={userDistributionData}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: 'right' }, tooltip: { callbacks: {
                        label: (context) => `${context.label}: ₹${context.raw.toLocaleString('en-IN')}`,
                      }}},
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Growth</h2>
              <Line
                data={userGrowthData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                  scales: { y: { beginAtZero: true, title: { display: true, text: 'Users' } } },
                }}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
              <Line
                data={conversionData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                  scales: { y: { beginAtZero: true, title: { display: true, text: 'Count' } } },
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}