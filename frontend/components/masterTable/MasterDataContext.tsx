import React, { createContext, useContext, useEffect, useState } from "react";
import { MasterDataLoader } from "./MasterConfigs";

const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;

export type MasterData = Record<string, any[]>;
export type EmpData = {
  [key: string]: string | number;
}[];

interface MasterDataContextType {
  masterData: MasterData;
  empData: EmpData;
  isLoading: boolean;
  reload: () => void;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [masterData, setMasterData] = useState<MasterData>({});
  const [empData, setEmpData] = useState<EmpData>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const data = await MasterDataLoader();
    setMasterData(data);
    setIsLoading(false);
  };

  const empLoad = async () => {
    const res = await fetch(`${endpoint}/emps`);
    const json = await res.json();
    setEmpData(json);
  };

  useEffect(() => {
    load();
    empLoad();
  }, []);

  return (
    <MasterDataContext.Provider value={{ masterData, empData, isLoading, reload: load }}>
      {children}
    </MasterDataContext.Provider>
  );
};

// Hook to use the context
export const useMasterData = (): MasterDataContextType => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error("useMasterData must be used within a MasterDataProvider");
  }
  return context;
};
