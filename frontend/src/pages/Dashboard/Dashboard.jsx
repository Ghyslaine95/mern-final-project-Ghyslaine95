import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Target, Leaf } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carbon Dashboard</h1>
          <p className="text-gray-600 mt-2">Track and reduce your carbon footprint</p>
        </div>
        <Link
          to="/add-emission"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Emission</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">24.5 kg</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">↓ 12% from last week</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Goal</p>
              <p className="text-2xl font-bold text-gray-900">50 kg</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">49% of goal achieved</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900">156 kg</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Leaf className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-emerald-600 mt-2">Equivalent to 8 trees</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">7 days</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-2">Keep it up! 🔥</p>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">Car commute</p>
                <p className="text-sm text-gray-600">Transportation • 15 km</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">3.15 kg CO₂</p>
              <p className="text-sm text-gray-600">Today</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Electricity usage</p>
                <p className="text-sm text-gray-600">Energy • 25 kWh</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">12.5 kg CO₂</p>
              <p className="text-sm text-gray-600">Yesterday</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/add-emission"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 transition-colors"
          >
            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700">Add Emission</p>
          </Link>
          
          <Link
            to="/emissions"
            className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-sm font-bold">📊</span>
            </div>
            <p className="font-medium text-blue-700">View History</p>
          </Link>
          
          <Link
            to="/analytics"
            className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
          >
            <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-sm font-bold">📈</span>
            </div>
            <p className="font-medium text-purple-700">Analytics</p>
          </Link>
          
          <Link
            to="/profile"
            className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 transition-colors"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-sm font-bold">⚙️</span>
            </div>
            <p className="font-medium text-orange-700">Settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;