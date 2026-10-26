import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      login(user, token);

      if (user.role === "employer") {
        navigate("/dashboard/employer");
      } else {
        navigate("/dashboard/jobseeker");
      }
    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);

      const responseData = err.response?.data;

      if (responseData?.requiresEmailVerification) {
        setVerificationEmail(responseData.email || email.trim().toLowerCase());
        setNeedsVerification(true);
        setError(
          responseData.error ||
            "Please verify your email before signing in."
        );
      } else {
        setError(
          responseData?.error ||
            responseData?.message ||
            "Invalid email or password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setError("");
    setVerificationMessage("");

    if (!/^\\d{6}$/.test(verificationCode)) {
      setError("Enter the six-digit code sent to your email.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/verify-email", {
        email: verificationEmail,
        code: verificationCode,
      });

      if (!response.data?.token || !response.data?.user) {
        setVerificationMessage(response.data?.message || "Email already verified. Please sign in.");
        setNeedsVerification(false);
        return;
      }

      login(response.data.user, response.data.token);
      navigate(
        response.data.user.role === "employer"
          ? "/dashboard/employer"
          : "/dashboard/jobseeker",
        { replace: true }
      );
    } catch (err) {
      setError(err.response?.data?.error || "Could not verify your email. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setVerificationMessage("");

    try {
      setLoading(true);
      const response = await api.post("/auth/resend-verification", {
        email: verificationEmail,
      });
      setVerificationMessage(response.data?.message || "If verification is needed, a new code will be sent.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not resend the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        backgroundColor: "#F7F5EE",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      <div
        className="login-card"
        style={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "white",
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 15px 50px rgba(0,0,0,0.12)",
        }}
      >
        {/* GREEN WELCOME SIDE */}

        <div
          className="login-welcome-panel"
          style={{
            width: "45%",
            backgroundColor: "#14231C",
            color: "white",
            padding: "50px 40px",
          }}
        >
          <Link
            to="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "25px",
              fontWeight: "bold",
            }}
          >
            SmartHire
          </Link>

          <div style={{ marginTop: "100px" }}>
            <p
              style={{
                color: "#8FC7A6",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}
            >
              AI-POWERED JOB MATCHING
            </p>

            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "48px",
                lineHeight: "1.1",
                fontWeight: "normal",
                margin: "15px 0",
              }}
            >
              Welcome
              <br />
              back.
            </h1>

            <p
              style={{
                color: "#C8D0CB",
                fontSize: "15px",
                lineHeight: "1.7",
                maxWidth: "300px",
              }}
            >
              Continue your journey with SmartHire and discover
              opportunities that fit your skills.
            </p>
          </div>

          <p
            style={{
              marginTop: "100px",
              color: "#9CAAA1",
              fontSize: "13px",
            }}
          >
            Built for the Nigerian job market
          </p>
        </div>

        {/* LOGIN SIDE */}

        <div
          className="login-form-panel"
          style={{
            width: "55%",
            padding: "55px 50px",
          }}
        >
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "34px",
              color: "#16241E",
              marginBottom: "8px",
            }}
          >
            Sign in
          </h2>

          <p
            style={{
              color: "#68736C",
              fontSize: "14px",
              marginBottom: "30px",
            }}
          >
            Enter your details to access your SmartHire account.
          </p>

          {error && (
            <div
              style={{
                backgroundColor: "#FDECEC",
                color: "#B42318",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {needsVerification && (
            <section className="mb-6 rounded-xl border border-[#DCD8CC] bg-[#F7F5EE] p-4 sm:p-5">
              <h3 className="font-semibold text-[#16241E]">Verify your email</h3>
              <p className="mt-2 text-sm leading-6 text-[#68736C]">
                Enter the six-digit code sent to <strong className="break-all">{verificationEmail}</strong>.
              </p>
              {verificationMessage && (
                <p role="status" className="mt-3 rounded-lg bg-[#E7F0EA] px-3 py-2 text-sm text-[#234F38]">{verificationMessage}</p>
              )}
              <form onSubmit={handleVerifyEmail} className="mt-4 space-y-3">
                <label htmlFor="login-verification-code" className="block text-sm font-semibold text-[#16241E]">Verification code</label>
                <input
                  id="login-verification-code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  required
                  className="w-full rounded-lg border border-[#DCD8CC] bg-white px-4 py-3 text-center text-xl tracking-[0.35em]"
                />
                <button type="submit" disabled={loading || verificationCode.length !== 6} className="w-full rounded-lg bg-[#2F6F4E] py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {loading ? "Verifying…" : "Verify email"}
                </button>
              </form>
              <button type="button" onClick={handleResendVerification} disabled={loading} className="mt-3 w-full text-sm font-semibold text-[#2F6F4E] hover:underline disabled:opacity-60">
                Resend verification code
              </button>
            </section>
          )}

          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#16241E",
                marginBottom: "8px",
              }}
            >
              Email address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                border: "1px solid #DCD8CC",
                borderRadius: "8px",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#16241E",
                }}
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                style={{
                  color: "#2F6F4E",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* PASSWORD FIELD */}

            <div
              style={{
                position: "relative",
                marginBottom: "25px",
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px 65px 14px 14px",
                  border: "1px solid #DCD8CC",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#2F6F4E",
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                backgroundColor: "#2F6F4E",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "30px",
              paddingTop: "25px",
              borderTop: "1px solid #ECE9E0",
            }}
          >
            <span style={{ color: "#68736C", fontSize: "14px" }}>
              Don't have an account?{" "}
            </span>

            <Link
              to="/register"
              style={{
                color: "#2F6F4E",
                fontWeight: "bold",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Create an account
            </Link>
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            <Link
              to="/"
              style={{
                color: "#68736C",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;