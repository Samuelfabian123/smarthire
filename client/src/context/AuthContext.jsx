import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!stored || !token) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
      }

      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
      }

      return parsed;
    } catch {
      // Recover gracefully if browser storage contains invalid JSON.
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  function login(userData, token) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
