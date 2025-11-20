import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emissionsAPI } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Calendar, TrendingUp, PieChart, BarChart3 } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Analytics = () => {
  const [period, setPeriod] = useState('month');

  // Fetch stats data using the new endpoints
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery(
    ['emissions-stats', period],
    () => emissionsAPI.getStats(period),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: overTimeData, isLoading: overTimeLoading } = useQuery(
    ['emissions-overtime', period],
    () => emissionsAPI.getOverTime(period),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: breakdownData, isLoading: breakdownLoading } = useQuery(
    ['emissions-breakdown', period],
    () => emissionsAPI.getCategoryBreakdown(period),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Get all emissions for trend calculation
  const { data: emissionsData } = useQuery(
    ['emissions', period],
    () => emissionsAPI.getAll({}),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const stats = statsData?.data || {};
  const overTime = overTimeData?.data?.emissionsOverTime || [];
  const breakdown = breakdownData?.data?.breakdown || [];
  const emissions = emissionsData?.data?.emissions || [];

  console.log('📊 Analytics Data:', {
    stats,
    overTime,
    breakdown,
    emissionsCount: emissions.length
  });

  // Prepare data for category distribution chart
  const categoryData = {
    labels: stats.categories?.map(item => item.category) || [],
    datasets: [
      {
        label: 'CO₂ Emissions (kg)',
        data: stats.categories?.map(item => item.totalCO2) || [],
        backgroundColor: [
          '#3B82F6', // Blue - Transportation
          '#F59E0B', // Orange - Energy
          '#10B981', // Green - Diet
          '#8B5CF6', // Purple - Shopping
          '#EF4444', // Red - Waste
        ],
        borderColor: [
          '#2563EB',
          '#D97706',
          '#059669',
          '#7C3AED',
          '#DC2626',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Prepare data for trend chart using overTime data
  const prepareTrendData = () => {
    if (overTime.length > 0) {
      return {
        labels: overTime.map(item => {
          // Format date based on period
          if (period === 'year') {
            return item.date; // Already in YYYY-MM format
          }
          // For week/month, format as short date
          const date = new Date(item.date + (period === 'year' ? '-01' : ''));
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        datasets: [
          {
            label: 'CO₂ Emissions (kg)',
            data: overTime.map(item => item.totalCO2),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      };
    }

    // Fallback to calculating from emissions data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const dailyTotals = last7Days.map(date => {
      const dayEmissions = emissions.filter(e => {
        const emissionDate = new Date(e.date).toISOString().split('T')[0];
        return emissionDate === date;
      });
      return dayEmissions.reduce((sum, e) => sum + e.co2e, 0);
    });

    return {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
      datasets: [
        {
          label: 'Daily CO₂ Emissions (kg)',
          data: dailyTotals,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const trendData = prepareTrendData();

  // Prepare detailed breakdown data
  const prepareBreakdownData = () => {
    if (breakdown.length > 0) {
      return breakdown.map(category => ({
        category: category.category,
        activities: category.activities,
        total: category.categoryTotal
      }));
    }

    // Fallback to simple category totals
    return stats.categories?.map(cat => ({
      category: cat.category,
      activities: [],
      total: cat.totalCO2
    })) || [];
  };

  const detailedBreakdown = prepareBreakdownData();

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Emissions by Category',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Emission Trends - ${period === 'week' ? '7 Days' : period === 'month' ? '30 Days' : '12 Months'}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'CO₂ Emissions (kg)',
        },
      },
    },
  };

  const isLoading = statsLoading || overTimeLoading || breakdownLoading;

  if (statsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading analytics: {statsError.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Visualize and understand your carbon footprint</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field w-32"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Emissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : (stats.totalEmissions || 0).toFixed(2)} kg
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">CO₂ equivalent this period</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Daily</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : (
                  ((stats.totalEmissions || 0) / (
                    period === 'week' ? 7 : 
                    period === 'month' ? 30 : 
                    365
                  )).toFixed(2)
                )} kg
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Per day average</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : stats.totalEntries || '0'}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Emission entries</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution - Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Emissions by Category
          </h3>
          <div className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="loading-spinner"></div>
              </div>
            ) : stats.categories?.length > 0 ? (
              <Bar data={categoryData} options={barOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution - Doughnut Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Distribution
          </h3>
          <div className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="loading-spinner"></div>
              </div>
            ) : stats.categories?.length > 0 ? (
              <Doughnut data={categoryData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Trends Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Emission Trends
          </h3>
          <div className="h-80">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="loading-spinner"></div>
              </div>
            ) : overTime.length > 0 || emissions.length > 0 ? (
              <Line data={trendData} options={lineOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Add more emissions to see trends
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {detailedBreakdown.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Category Breakdown
          </h3>
          <div className="space-y-6">
            {detailedBreakdown.map((category) => (
              <div key={category.category} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: getCategoryColor(category.category),
                      }}
                    ></div>
                    <span className="font-medium capitalize">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {category.total.toFixed(2)} kg CO₂
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.totalEmissions ? ((category.total / stats.totalEmissions) * 100).toFixed(1) : '0'}% of total
                    </p>
                  </div>
                </div>
                
                {/* Activity breakdown */}
                {category.activities && category.activities.length > 0 && (
                  <div className="ml-7 space-y-2">
                    {category.activities.map((activity, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {activity.activity.replace('_', ' ')}
                        </span>
                        <span className="font-medium">
                          {activity.totalCO2.toFixed(2)} kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get consistent colors
const getCategoryColor = (category) => {
  const colors = {
    transportation: '#3B82F6',
    energy: '#F59E0B',
    diet: '#10B981',
    shopping: '#8B5CF6',
    waste: '#EF4444',
  };
  return colors[category] || '#6B7280';
};

export default Analytics;