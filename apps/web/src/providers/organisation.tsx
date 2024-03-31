'use client';

import { createContext, useContext } from 'react';
import React from 'react';

import type { Organisation } from '@documenso/prisma/client';

interface OrganisationProviderProps {
  children: React.ReactNode;
  organisation: Organisation;
}

const OrganisationContext = createContext<Organisation | null>(null);

export const useCurrentOrganisation = () => {
  const context = useContext(OrganisationContext);

  if (!context) {
    throw new Error('useCurrentOrganisation must be used within a OrganisationProvider');
  }

  return context;
};

export const useOptionalCurrentOrganisation = () => {
  return useContext(OrganisationContext);
};

export const OrganisationProvider = ({ children, organisation }: OrganisationProviderProps) => {
  return (
    <OrganisationContext.Provider value={organisation}>{children}</OrganisationContext.Provider>
  );
};
