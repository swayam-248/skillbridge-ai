import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        background: "#1a1a1a",
        color: "white",
        alignItems: "center",
      }}
    >
      <h2 style={{ margin: 0 }}>SkillBridge AI</h2>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          Home
        </Link>

        {user ? (
          <>
            {/* This only shows if you are a recruiter! */}
            {user.role === "recruiter" && (
              <Link
                to="/profiles"
                style={{ color: "#00d4ff", fontWeight: "bold" }}
              >
                Talent Pool
              </Link>
            )}

            <span style={{ fontSize: "0.9rem", color: "#ccc" }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: "#ff4d4d",
                color: "white",
                border: "none",
                padding: "5px 15px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: "white", textDecoration: "none" }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
