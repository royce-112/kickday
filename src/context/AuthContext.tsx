import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface User {
  name: string;
  email: string;
  picture?: string;
  tokens?: number;
}

interface AuthType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios.get("http://127.0.0.1:5000/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setUser(res.data))
    .catch(() => localStorage.removeItem("token"));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};