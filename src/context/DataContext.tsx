import React, { createContext, useContext, useState } from 'react';

interface DataContextType {
  data: any[] | null;
  setData: (data: any[] | null) => void;
  fileId: string | null;
  setFileId: (fileId: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <DataContext.Provider value={{ 
      data, 
      setData, 
      fileId, 
      setFileId, 
      isLoading, 
      setIsLoading 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};