import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { emissionsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = {
  transportation: ['car', 'bus', 'train', 'plane', 'motorcycle'],
  energy: ['electricity', 'natural_gas', 'heating_oil'],
  diet: ['beef', 'chicken', 'pork', 'vegetables', 'dairy'],
  shopping: ['electronics', 'clothing', 'furniture'],
  waste: ['plastic', 'paper', 'food']
};

const CATEGORY_UNITS = {
  transportation: 'km',
  energy: 'kWh',
  diet: 'kg',
  shopping: 'items',
  waste: 'kg'
};

const AddEmission = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const selectedCategory = watch('category');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('🟡 === FORM SUBMISSION START ===');
      console.log('🟡 Raw form data:', data);
      console.log('🟡 Amount value:', data.amount);
      console.log('🟡 Amount type:', typeof data.amount);
      
      // Validate and process amount
      let processedAmount;
      if (data.amount === '' || data.amount === null || data.amount === undefined) {
        throw new Error('Amount is required');
      }
      
      processedAmount = parseFloat(data.amount);
      console.log('🟡 Processed amount:', processedAmount);
      
      if (isNaN(processedAmount)) {
        throw new Error('Amount must be a valid number');
      }
      
      if (processedAmount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Prepare emission data
      const emissionData = {
        category: data.category,
        activity: data.activity,
        amount: processedAmount, // Use the validated number
        unit: CATEGORY_UNITS[data.category],
        notes: data.notes || '',
        date: data.date
      };

      console.log('🟡 Final emission data being sent:', emissionData);
      console.log('🟡 === FORM SUBMISSION END ===');

      const result = await emissionsAPI.create(emissionData);
      console.log('✅ API Response:', result);
      
      toast.success('Emission added successfully!');
      navigate('/emissions');
    } catch (error) {
      console.error('❌ === ERROR DETAILS ===');
      console.error('❌ Full error object:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error status:', error.status);
      console.error('❌ === END ERROR DETAILS ===');
      
      // Show specific error messages
      if (error.message?.includes('Amount must be a valid number')) {
        toast.error('Please enter a valid number for the amount');
      } else if (error.message?.includes('Amount must be greater than 0')) {
        toast.error('Amount must be greater than 0');
      } else if (error.message?.includes('Amount is required')) {
        toast.error('Please enter an amount');
      } else {
        toast.error(error.message || 'Failed to add emission. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Test with hardcoded data (for debugging)
  const testWithHardcodedData = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing with hardcoded data...');
      
      const testData = {
        category: 'transportation',
        activity: 'car',
        amount: 100, // Positive number
        unit: 'km',
        notes: 'Test emission from hardcoded data',
        date: new Date().toISOString().split('T')[0]
      };

      console.log('🧪 Hardcoded test data:', testData);
      
      const result = await emissionsAPI.create(testData);
      console.log('✅ Hardcoded test successful:', result);
      
      toast.success('Test emission added successfully!');
      navigate('/emissions');
    } catch (error) {
      console.error('❌ Hardcoded test failed:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Carbon Emission</h1>
      
      {/* Debug button - remove in production */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-sm text-yellow-800 mb-2">
          <strong>Debug:</strong> Having issues? Try the test button below.
        </p>
        <button
          type="button"
          onClick={testWithHardcodedData}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test with Sample Data'}
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...register('category', { 
              required: 'Category is required',
              validate: value => value !== '' || 'Please select a category'
            })}
            className="input-field"
          >
            <option value="">Select a category</option>
            {Object.keys(CATEGORIES).map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Activity */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity *
            </label>
            <select
              {...register('activity', { 
                required: 'Activity is required',
                validate: value => value !== '' || 'Please select an activity'
              })}
              className="input-field"
            >
              <option value="">Select an activity</option>
              {CATEGORIES[selectedCategory].map(activity => (
                <option key={activity} value={activity}>
                  {activity.replace('_', ' ').charAt(0).toUpperCase() + activity.replace('_', ' ').slice(1)}
                </option>
              ))}
            </select>
            {errors.activity && (
              <p className="text-red-600 text-sm mt-1">{errors.activity.message}</p>
            )}
          </div>
        )}

        {/* Amount */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount * (in {CATEGORY_UNITS[selectedCategory]})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              {...register('amount', { 
                required: 'Amount is required',
                min: { 
                  value: 0.01, 
                  message: 'Amount must be greater than 0' 
                },
                pattern: {
                  value: /^[0-9]*\.?[0-9]*$/,
                  message: 'Please enter a valid number'
                }
              })}
              className="input-field"
              placeholder={`Enter amount in ${CATEGORY_UNITS[selectedCategory]}`}
            />
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Unit: {CATEGORY_UNITS[selectedCategory]}
            </p>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            {...register('date', { 
              required: 'Date is required',
              validate: value => {
                const selectedDate = new Date(value);
                const today = new Date();
                return selectedDate <= today || 'Date cannot be in the future';
              }
            })}
            className="input-field"
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
          />
          {errors.date && (
            <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="input-field"
            placeholder="Add any additional notes..."
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1">
            Maximum 500 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/emissions')}
            className="btn-secondary flex-1 py-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Emission...
              </span>
            ) : (
              'Add Emission'
            )}
          </button>
        </div>
      </form>

      {/* Debug info - remove in production */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <div className="text-sm space-y-1">
          <p><strong>Selected Category:</strong> {selectedCategory || 'None'}</p>
          <p><strong>Available Activities:</strong> {selectedCategory ? CATEGORIES[selectedCategory]?.join(', ') : 'Select a category'}</p>
          <p><strong>Unit:</strong> {selectedCategory ? CATEGORY_UNITS[selectedCategory] : 'Select a category'}</p>
        </div>
      </div>
    </div>
  );
};

export default AddEmission;