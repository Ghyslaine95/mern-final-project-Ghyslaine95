import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { emissionsAPI } from '../../services/api';
import { Trash2, Edit, Calendar, Filter, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const EmissionsList = () => {
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: ''
  });

  const { data: emissionsData, isLoading, error, refetch } = useQuery(
    ['emissions', filters],
    () => emissionsAPI.getAll(filters),
    {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );

  // Handle errors gracefully
  useEffect(() => {
    if (error) {
      console.error('❌ Error loading emissions:', error);
      toast.error('Failed to load emissions');
    }
  }, [error]);

  const emissions = emissionsData?.data?.emissions || [];

  const handleDelete = async (emissionId) => {
    if (window.confirm('Are you sure you want to delete this emission?')) {
      try {
        await emissionsAPI.delete(emissionId);
        toast.success('Emission deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete emission');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      startDate: '',
      endDate: ''
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      transportation: 'bg-blue-100 text-blue-800',
      energy: 'bg-orange-100 text-orange-800',
      diet: 'bg-green-100 text-green-800',
      shopping: 'bg-purple-100 text-purple-800',
      waste: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Emissions</h1>
            <p className="text-gray-600 mt-2">Track and manage your carbon emissions history</p>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Emissions</h3>
              <p className="text-red-700 mt-1">{error?.message || 'Failed to load emissions data'}</p>
              <button
                onClick={() => refetch()}
                className="btn-primary mt-4 bg-red-600 hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Emissions</h1>
          <p className="text-gray-600 mt-2">Track and manage your carbon emissions history</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              <option value="transportation">Transportation</option>
              <option value="energy">Energy</option>
              <option value="diet">Diet</option>
              <option value="shopping">Shopping</option>
              <option value="waste">Waste</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input-field"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <p className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : `${emissions.length} emissions found`}
            </p>
          </div>
        </div>
      </div>

      {/* Emissions List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading emissions...</p>
          </div>
        ) : emissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No emissions found.</p>
            <p className="text-gray-500 text-sm mt-1">
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters' 
                : 'Start by adding your first emission'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {emissions.map((emission) => (
              <div
                key={emission._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Category Badge */}
                  <span className={`badge ${getCategoryColor(emission.category)}`}>
                    {emission.category}
                  </span>

                  {/* Activity Details */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {emission.activity.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {emission.amount} {emission.unit}
                    </p>
                    {emission.notes && (
                      <p className="text-sm text-gray-500 mt-1">{emission.notes}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(emission.date).toLocaleDateString()}
                  </div>

                  {/* CO2 Impact */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {emission.co2e?.toFixed(2) || '0'} kg CO₂
                    </p>
                    <p className="text-xs text-gray-500">Carbon equivalent</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDelete(emission._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete emission"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmissionsList;