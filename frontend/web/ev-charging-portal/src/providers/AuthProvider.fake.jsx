import { useState, useEffect } from "react";
//import { AuthContext } from "@/contexts/AuthContext";

/**
 * AuthProvider (fake auth)
 * - login(email, password, remember) => Promise resolves when success
 * - logout()
 * - reads token from sessionStorage OR localStorage on start
 *
 * Fake rules:
 * - staff account: email === 'staff@example.com' && password === 'staffpass'
 * - admin account: email === 'admin@example.com' && password === 'adminpass'
 * - any other account with password === 'password' => role 'user'
 * - wrong credentials => reject
 *
 * Token is a base64-encoded JSON for demo only.
 */

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ token: null, role: null, email: null });
  const [isLoading, setIsLoading] = useState(true);

  // helper to create fake token
  const makeToken = (email, role) =>
    btoa(
      JSON.stringify({
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );

  // read token from localStorage OR sessionStorage
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token));
        setAuth({
          token,
          email: decoded.email,
          role: decoded.role,
        });
      } catch (e) {
        console.warn("Invalid token stored, clearing.", e);
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * login(email, password, remember)
   * returns a Promise that resolves with the auth object on success,
   * or rejects with an error message on failure.
   */
  const login = (email, password, remember = false) => {
    return new Promise((resolve, reject) => {
      // simulate minimal delay for realism (but still immediate)
      // Decide role based on fake rules:
      let role = null;

      if (email === "staff@example.com" && password === "staffpass") {
        role = "staff";
      } else if (email === "admin@example.com" && password === "adminpass") {
        role = "admin";
      } else if (password === "password") {
        role = "user";
      } else {
        // invalid credentials
        return reject(new Error("Invalid email or password (demo)."));
      }

      const token = makeToken(email, role);

      try {
        if (remember) {
          localStorage.setItem("token", token);
        } else {
          sessionStorage.setItem("token", token);
        }

        const newAuth = { token, email, role };
        setAuth(newAuth);

        resolve(newAuth);
      } catch (e) {
        reject(new Error("Failed to store token"));
      }
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setAuth({ token: null, role: null, email: null });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
