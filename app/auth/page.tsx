"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";
import { FaGoogle } from "react-icons/fa";


export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // toggle Login / Signup
  const [name, setName] = useState(""); // pour Signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        console.log(`${isLogin ? "Login" : "Signup"} réussi`, data);
      } else {
        console.error("Erreur:", data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {

    console.log("Connexion avec Google...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-primary p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-unbounded font-bold mb-2 text-center text-primary">
          {isLogin ? "Connexion" : "Inscription"}
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          {isLogin
            ? "Connectez-vous pour accéder à votre compte."
            : "Créez un compte pour commencer à réserver et découvrir les événements."}
        </p>

        {/* Bouton Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center cursor-pointer text-black justify-center gap-2 w-full border border-gray-300 rounded-full py-3 mb-4 hover:bg-gray-100 transition"
        >
          <FaGoogle className="w-5 h-5 text-red-500" />
          {isLogin ? "Continuer avec Google" : "Continuer avec Google"}
        </button>

    
        <div className="flex items-center mb-5">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500 text-sm font-medium">Ou</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10 border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white placeholder-gray-400 w-full"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white placeholder-gray-400 w-full"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white placeholder-gray-400 w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white py-3 cursor-pointer rounded-full font-semibold hover:bg-purple-700 transition"
          >
            {loading
              ? isLogin
                ? "Connexion..."
                : "Inscription..."
              : isLogin
              ? "Se connecter"
              : "S'inscrire"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-black">
          {isLogin
            ? "Pas de compte ?"
            : "Vous avez déjà un compte ?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? "Inscription" : "Connexion"}
          </button>
        </p>
      </div>
    </div>
  );
}
