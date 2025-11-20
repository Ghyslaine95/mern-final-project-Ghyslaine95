import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, authAPI } from '../../services/api';
import { User, Mail, MapPin, Target, Bell, Save, Edit, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL
  const { 
    data: userData, 
    isLoading, 
    error,
    isError 
  } = useQuery(
    ['user-profile'],
    usersAPI.getProfile,
    {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }
  );

  // Mutations must be declared unconditionally
  const updateProfileMutation = useMutation(
    (data) => usersAPI.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user-profile']);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update profile');
      },
    }
  );

  const updatePreferencesMutation = useMutation(
    (data) => usersAPI.updatePreferences(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user-profile']);
        toast.success('Preferences updated successfully!');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update preferences');
      },
    }
  );

  const updatePasswordMutation = useMutation(
    (data) => authAPI.updatePassword(data),
    {
      onSuccess: () => {
        toast.success('Password updated successfully!');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update password');
      },
    }
  );

  // Form hooks must be declared unconditionally
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm();

  const {
    register: registerPreferences,
    handleSubmit: handleSubmitPreferences,
    formState: { errors: preferencesErrors },
    watch: watchPreferences,
    reset: resetPreferences  // ADD THIS MISSING LINE
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm();

  // Set form defaults when user data loads
  React.useEffect(() => {
    if (userData?.data?.user) {
      const user = userData.data.user;
      const preferences = user?.preferences || {};
      
      resetProfile({
        username: user.username,
        email: user.email,
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          location: {
            country: user.profile?.location?.country || '',
            city: user.profile?.location?.city || ''
          }
        }
      });

      resetPreferences({
        units: preferences.units || 'metric',
        weeklyGoal: preferences.weeklyGoal || 50,
        notifications: {
          email: preferences.notifications?.email !== false,
          weeklyReport: preferences.notifications?.weeklyReport !== false,
          goalReminders: preferences.notifications?.goalReminders !== false
        }
      });
    }
  }, [userData, resetProfile, resetPreferences]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Profile</h3>
              <p className="text-red-700 mt-1">{error?.message || 'Failed to load profile data'}</p>
              <button
                onClick={() => window.location.reload()}
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

  const user = userData?.data?.user;

  // If no user data
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No Profile Data</h3>
          <p className="text-gray-600 mt-1">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  const preferences = user?.preferences || {};
  const weeklyGoal = watchPreferences('weeklyGoal');

  // Form submission handlers
  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const onPreferencesSubmit = (data) => {
    updatePreferencesMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    updatePasswordMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </h2>
              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitProfile(onProfileSubmit)}
                    disabled={updateProfileMutation.isLoading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>
                      {updateProfileMutation.isLoading ? 'Saving...' : 'Save'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    {...registerProfile('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters'
                      }
                    })}
                    type="text"
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                    defaultValue={user.username}
                  />
                  {profileErrors.username && (
                    <p className="text-red-600 text-sm mt-1">
                      {profileErrors.username.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed pl-10"
                      defaultValue={user.email}
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...registerProfile('profile.firstName')}
                    type="text"
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Your first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...registerProfile('profile.lastName')}
                    type="text"
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...registerProfile('profile.location.country')}
                      type="text"
                      disabled={!isEditing}
                      className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed pl-10"
                      placeholder="Your country"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...registerProfile('profile.location.city')}
                    type="text"
                    disabled={!isEditing}
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Your city"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Change Password
            </h2>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required'
                  })}
                  type="password"
                  className="input-field"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-600 text-sm mt-1">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  type="password"
                  className="input-field"
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-600 text-sm mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={updatePasswordMutation.isLoading}
                className="btn-primary"
              >
                {updatePasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Preferences & Info */}
        <div className="space-y-6">
          {/* Account Info Card */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Username</span>
                <span className="font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member since</span>
                <span className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Preferences
            </h2>
            <form onSubmit={handleSubmitPreferences(onPreferencesSubmit)} className="space-y-6">
              {/* Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Measurement Units
                </label>
                <select
                  {...registerPreferences('units')}
                  className="input-field"
                >
                  <option value="metric">Metric (kg, km)</option>
                  <option value="imperial">Imperial (lbs, miles)</option>
                </select>
              </div>

              {/* Weekly Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Carbon Goal
                </label>
                <input
                  {...registerPreferences('weeklyGoal', {
                    min: { value: 0, message: 'Goal must be positive' }
                  })}
                  type="number"
                  className="input-field"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Target: {weeklyGoal || 50} kg CO₂ per week
                </p>
              </div>

              <button
                type="submit"
                disabled={updatePreferencesMutation.isLoading}
                className="btn-primary w-full"
              >
                {updatePreferencesMutation.isLoading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>

          {/* Account Stats */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Statistics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total CO₂ Saved</span>
                <span className="font-medium text-green-600">
                  {user?.stats?.totalCO2Saved?.toFixed(2) || '0'} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Streak</span>
                <span className="font-medium">
                  {user?.stats?.streak || '0'} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;