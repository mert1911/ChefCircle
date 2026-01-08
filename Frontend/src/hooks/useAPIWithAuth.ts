import { useMemo } from 'react';
import axios from 'axios';
import { useAuth } from './use-auth';

export const useAPIWithAuth = (baseURL: string = "http://localhost:8080") => {
  const { getAccessToken } = useAuth();

  // Create axios instance with automatic token handling
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL,
      withCredentials: true,
    });

    // Add request interceptor to add token to requests
    instance.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, [baseURL, getAccessToken]);

  return api;
}; 