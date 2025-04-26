import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';

import {
  loadEnvironmentConfig,
  EnvironmentConfig,
} from '../config/configLoader';

interface ConfigContextType {
  config: EnvironmentConfig;
  loading: boolean;
  error: Error | null;
  reloadConfig: () => Promise<void>;
}

// Create the configuration context
const ConfigContext = createContext<ConfigContextType | undefined>(
  undefined
);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
}) => {
  const [config, setConfig] = useState<EnvironmentConfig>({
    apiUrl: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedConfig = await loadEnvironmentConfig();
      setConfig(loadedConfig);
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to load config')
      );
      setLoading(false);
    }
  };

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const reloadConfig = async () => {
    await loadConfig();
  };

  const value = {
    config,
    loading,
    error,
    reloadConfig,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = (): ConfigContextType => {
  const context = useContext(ConfigContext);

  if (context === undefined) {
    throw new Error(
      'useConfigContext must be used within a ConfigProvider'
    );
  }

  return context;
};
