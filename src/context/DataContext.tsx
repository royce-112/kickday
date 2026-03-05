import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface UserData {
  userId: string;
  name: string;
  email: string;
  tokens: number;
}

interface DataContextType {
  data: any[] | null;
  setData: (data: any[] | null) => void;

  fileId: string | null;
  setFileId: (fileId: string | null) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  user: UserData | null;
  setUser: (user: UserData | null) => void;

  tokens: number;
  setTokens: (tokens: number) => void;

  deductTokens: (amount: number) => void;
  addTokens: (amount: number) => void;
  resetTokens: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState<UserData | null>(null);
  const [tokens, setTokens] = useState<number>(0);

  // 🔄 Initialize user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('hmpi_user');

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setTokens(parsed.tokens || 0);

      // Optional backend sync
      if (parsed.userId) {
        axios
          .get(`http://127.0.0.1:5000/token/get-balance?user_id=${parsed.userId}`)
          .then((res) => {
            const backendTokens = res.data.balance || 0;
            setTokens(backendTokens);

            const updatedUser = { ...parsed, tokens: backendTokens };
            setUser(updatedUser);
            localStorage.setItem('hmpi_user', JSON.stringify(updatedUser));
          })
          .catch(() => {
            console.log("Token sync skipped");
          });
      }
    } else {
      // Create anonymous user session
      const anonymousUser: UserData = {
        userId: `anon_${Date.now()}`,
        name: 'Anonymous User',
        email: '',
        tokens: 0,
      };

      setUser(anonymousUser);
      setTokens(0);
      localStorage.setItem('hmpi_user', JSON.stringify(anonymousUser));
    }
  }, []);

  // ➖ Deduct tokens
  const deductTokens = (amount: number) => {
    const newBalance = Math.max(0, tokens - amount);
    setTokens(newBalance);

    if (user) {
      const updatedUser = { ...user, tokens: newBalance };
      setUser(updatedUser);
      localStorage.setItem('hmpi_user', JSON.stringify(updatedUser));

      axios
        .post('http://127.0.0.1:5000/token/sync', {
          user_id: user.userId,
          tokens: newBalance,
        })
        .catch((err) => console.error('Token sync error:', err));
    }
  };

  // ➕ Add tokens
  const addTokens = (amount: number) => {
    const newBalance = tokens + amount;
    setTokens(newBalance);

    if (user) {
      const updatedUser = { ...user, tokens: newBalance };
      setUser(updatedUser);
      localStorage.setItem('hmpi_user', JSON.stringify(updatedUser));

      axios
        .post('http://127.0.0.1:5000/token/sync', {
          user_id: user.userId,
          tokens: newBalance,
        })
        .catch((err) => console.error('Token sync error:', err));
    }
  };

  // 🔁 Reset session
  const resetTokens = () => {
    const newUser: UserData = {
      userId: `anon_${Date.now()}`,
      name: 'Anonymous User',
      email: '',
      tokens: 0,
    };

    setTokens(0);
    setUser(newUser);

    localStorage.clear();
    localStorage.setItem('hmpi_user', JSON.stringify(newUser));

    axios
      .post('http://127.0.0.1:5000/token/sync', {
        user_id: newUser.userId,
        tokens: 0,
      })
      .catch((err) => console.error('Token reset error:', err));
  };

  return (
    <DataContext.Provider
      value={{
        data,
        setData,

        fileId,
        setFileId,

        isLoading,
        setIsLoading,

        user,
        setUser,

        tokens,
        setTokens,

        deductTokens,
        addTokens,
        resetTokens,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};