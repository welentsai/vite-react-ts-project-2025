// src/config/configLoader.ts
import axios from 'axios';

export interface EnvironmentConfig {
  apiUrl: string;
  // Add other environment properties as needed
}

// Function to load the environment config
export const loadEnvironmentConfig = async () => {
  try {
    // Use axios to fetch the configuration file
    const response = await axios.get<EnvironmentConfig>(
      '/configs/environment.json'
    );
    return response.data;
  } catch (error) {
    console.error('Failed to load environment config:', error);
    throw error;
  }
};

// Creating a singleton configuration instance
let configInstance: EnvironmentConfig | null = null;

export const getConfig = async (): Promise<EnvironmentConfig> => {
  if (!configInstance) {
    configInstance = await loadEnvironmentConfig();
  }
  return configInstance;
};
