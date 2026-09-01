import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { settingApi } from '../services/api';
import { SystemSettings } from '../types';

interface SettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  formatCurrency: (amount: number | null | undefined) => string;
}

const defaultSettings: SystemSettings = {
  instituteName: 'Apex Career Institute (JEE, NEET & Foundation Division)',
  currencySymbol: '₹',
  currencyCode: 'INR',
  contactPhone: '+91 (020) 2553-8900',
  contactEmail: 'admissions@apexcoaching.edu.in',
  address: 'Apex Knowledge Park, Road No. 1, Knowledge City, Kota, Rajasthan - 324005',
  academicYear: '2026-2027',
  website: 'https://apexcoaching.edu.in',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await settingApi.getSettings();
      if (res.data?.data) {
        setSettings((prev: SystemSettings) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.warn('Failed to load institute settings, using defaults', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const formatCurrency = (amount: number | null | undefined): string => {
    const num = Number(amount || 0);
    const sym = settings.currencySymbol || '₹';
    return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
