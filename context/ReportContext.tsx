import * as Location from 'expo-location';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ReportData {
  tipo: 'Bache' | 'Alcantarilla' | 'Poste' | null;
  ubicacion: Location.LocationObjectCoords | null; 
  descripcion: string;
  imagenUri: string | null;
}

interface ReportContextType {
  reportData: ReportData;
  setTipo: (tipo: 'Bache' | 'Alcantarilla' | 'Poste') => void;
  setUbicacion: (coords: Location.LocationObjectCoords) => void;
  setDescripcion: (desc: string) => void;
  setImagenUri: (uri: string | null) => void;
  limpiarReporte: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const initialState: ReportData = {
  tipo: null,
  ubicacion: null,
  descripcion: '',
  imagenUri: null,
};

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const [reportData, setReportData] = useState<ReportData>(initialState);

  const setTipo = (tipo: 'Bache' | 'Alcantarilla' | 'Poste') => {
    setReportData((prev) => ({ ...prev, tipo }));
  };

  const setUbicacion = (coords: Location.LocationObjectCoords) => {
    setReportData((prev) => ({ ...prev, ubicacion: coords }));
  };

  const setDescripcion = (desc: string) => {
    setReportData((prev) => ({ ...prev, descripcion: desc }));
  };

  const setImagenUri = (uri: string | null) => {
    setReportData((prev) => ({ ...prev, imagenUri: uri }));
  };

  const limpiarReporte = () => {
    setReportData(initialState);
  };

  return (
    <ReportContext.Provider
      value={{
        reportData,
        setTipo,
        setUbicacion,
        setDescripcion,
        setImagenUri,
        limpiarReporte,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport debe ser usado dentro de un ReportProvider');
  }
  return context;
};