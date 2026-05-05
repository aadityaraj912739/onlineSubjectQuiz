import React, { createContext, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const UserTypeContext = createContext();

export const useUserType = () => {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error('useUserType must be used within a UserTypeProvider');
  }
  return context;
};

export const UserTypeProvider = ({ children }) => {
  // Fetch all user types
  const getAllUserTypes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-types`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching user types:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Fetch user type by ID
  const getUserTypeById = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-types/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching user type:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Fetch user type by name
  const getUserTypeByName = useCallback(async (name) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-types/name/${name}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching user type by name:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get menu items for a user type
  const getMenuItems = useCallback(async (userTypeName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-types/${userTypeName}/menu`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get permissions for a user type
  const getPermissions = useCallback(async (userTypeName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-types/${userTypeName}/permissions`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Check if user type has permission
  const hasPermission = useCallback(async (userTypeName, permission) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/user-types/${userTypeName}/has-permission/${permission}`
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error checking permission:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get features for a user type
  const getFeatures = useCallback(async (userTypeName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-types/${userTypeName}/features`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching features:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Check if feature is enabled
  const isFeatureEnabled = useCallback(async (userTypeName, featureName) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/user-types/${userTypeName}/is-feature-enabled/${featureName}`
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error checking feature status:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Context value with memoization
  const value = useMemo(
    () => ({
      getAllUserTypes,
      getUserTypeById,
      getUserTypeByName,
      getMenuItems,
      getPermissions,
      hasPermission,
      getFeatures,
      isFeatureEnabled
    }),
    [
      getAllUserTypes,
      getUserTypeById,
      getUserTypeByName,
      getMenuItems,
      getPermissions,
      hasPermission,
      getFeatures,
      isFeatureEnabled
    ]
  );

  return (
    <UserTypeContext.Provider value={value}>
      {children}
    </UserTypeContext.Provider>
  );
};

export default UserTypeContext;
