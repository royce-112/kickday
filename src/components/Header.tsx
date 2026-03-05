import {
  Droplets,
  Beaker,
  Zap,
  RotateCcw,
  Mail,
  LogOut
} from "lucide-react";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { useDataset } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";

const Header = () => {
  const { user, setUser } = useAuth();
  const { tokens, resetTokens } = useDataset();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 🔐 Google Login
  const handleSuccess = async (credentialResponse: any) => {
    try {
      console.log("[FRONTEND] Login Success - sending credential to backend");

      const res = await axios.post(
        "http://127.0.0.1:5000/google-login",
        {
          token: credentialResponse.credential,
        }
      );

      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      console.log("[FRONTEND] User logged in:", res.data.user.email);
    } catch (err: any) {
      console.error(
        "[FRONTEND] Login failed:",
        err.response?.data || err.message
      );
      alert("Login failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // 🔁 Reset Tokens
  const handleReset = () => {
    if (
      window.confirm(
        "⚠️ Clear all tokens and start fresh? This will create a new session."
      )
    ) {
      resetTokens();
      alert("✅ Tokens reset to 0. You now have a fresh session.");
    }
  };

  return (
    <header className="relative z-10 flex items-center justify-between p-6">

      {/* LEFT: Logo + Branding */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Droplets className="w-8 h-8 text-water-primary animate-droplet" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-water-secondary rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            AquaScan
          </h1>
          <p className="text-sm text-muted-foreground">
            Heavy Metal Pollution Index Assessment
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* ⚡ TOKEN DISPLAY (Always Visible) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg border border-yellow-300 shadow-sm">
          <Zap className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-bold text-yellow-800">
            {tokens} Tokens
          </span>

          <button
            onClick={handleReset}
            className="ml-2 p-1 rounded hover:bg-yellow-200 transition-colors"
            title="Reset tokens and start fresh"
          >
            <RotateCcw className="w-3 h-3 text-yellow-600 opacity-60 hover:opacity-100" />
          </button>
        </div>

        {/* 🔐 AUTH SECTION */}
        {!user ? (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Login Failed")}
          />
        ) : (
          <div className="flex items-center gap-4">

            {/* 👤 USER INFO */}
            <div className="flex items-center gap-3 bg-water-primary/10 px-4 py-2 rounded-lg">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-water-primary flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </div>
              </div>
            </div>

            {/* 🚪 LOGOUT */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        )}

        {/* 🧪 VERSION BADGE */}
        <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-water rounded-full border border-border/50">
          <Beaker className="w-4 h-4 text-water-secondary" />
          <span className="text-sm font-medium text-foreground">
            v1.0
          </span>
        </div>

      </div>
    </header>
  );
};

export default Header;