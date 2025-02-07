"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase.js"

const Auth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    const session = await supabase.auth.getSession();
    setUser(session.data.session?.user ?? null);
    setLoading(false);
  };

  const createUserProfile = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      setLoading(false);

      // Si hay un usuario y acaba de iniciar sesión, crear/actualizar su perfil
      if (currentUser) {
        await createUserProfile(currentUser);
      }
    });

    return () => subscription.unsubscribe();
  }, [createUserProfile]); // Added createUserProfile to dependencies

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error("Error with Google login:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="auth-container">
      {!user ? (
        <button onClick={handleGoogleLogin} className="google-login-button">
          Iniciar sesión con Google
        </button>
      ) : (
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={handleSignOut} className="signout-button">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default Auth

