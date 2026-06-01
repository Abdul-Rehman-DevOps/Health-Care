import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type HospitalBranding } from '../lib/api';

const DEFAULT_BRANDING: HospitalBranding = {
  hospitalName: 'Health Care',
  tagline: 'Hospital Management System',
};

const HospitalBrandingContext = createContext<HospitalBranding>(DEFAULT_BRANDING);

export function HospitalBrandingProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ['branding'],
    queryFn: api.branding.get,
    staleTime: 60_000,
  });

  const branding = data ?? DEFAULT_BRANDING;

  return (
    <HospitalBrandingContext.Provider value={branding}>
      {children}
    </HospitalBrandingContext.Provider>
  );
}

export function useHospitalBranding() {
  return useContext(HospitalBrandingContext);
}
