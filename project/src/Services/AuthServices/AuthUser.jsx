// import { createContext, useState, useContext } from "react";

// // Create AuthContext
// export const AuthContext = createContext();

// // AuthProvider Component
// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState("Sekhar");

//   return (
//     <AuthContext.Provider value={{ user, setUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom Hook to use AuthContext
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

// AuthContext.js
import { createContext, useContext, useState, useEffect, useMemo } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refresh_token");

    if (storedToken) setToken(storedToken);
    if (storedRefreshToken) setRefreshToken(storedRefreshToken);
  }, []);

  // Sync localStorage when tokens change
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    else localStorage.removeItem("refresh_token");
  }, [token, refreshToken]);

  // Memoize context value to avoid re-renders
  const value = useMemo(() => ({
    token,
    setToken,
    refreshToken,
    setRefreshToken
  }), [token, refreshToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
