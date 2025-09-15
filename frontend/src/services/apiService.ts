import axios from 'axios';
import { ApiDataItem, GroupedData, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api-project-04vm.onrender.com'  // Gerçek Render URL'i
    : 'http://localhost:3001');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Get all data
  getAllData: async (): Promise<ApiDataItem[]> => {
    try {
      const response = await api.get<ApiResponse<ApiDataItem[]>>('/api/data');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },

  // Get grouped data
  getGroupedData: async (): Promise<GroupedData> => {
    try {
      const response = await api.get<ApiResponse<GroupedData>>('/api/data/grouped');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching grouped data:', error);
      throw error;
    }
  },

  // Manual sync
  syncData: async (): Promise<void> => {
    try {
      await api.post('/api/data/sync');
    } catch (error) {
      console.error('Error syncing data:', error);
      throw error;
    }
  },
};