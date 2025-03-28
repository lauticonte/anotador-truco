import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Revisar si hay una sesión activa
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error al obtener la sesión:", error.message);
        return;
      }
      if (data?.session) {
        setUser(data.session.user);
      }
    };
    getSession();

    // Escuchar cambios en la autenticación
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
