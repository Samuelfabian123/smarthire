import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post(`/auth/reset-password/${token}`, {
        password,
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EE] flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="font-serif text-3xl text-[#16241E]"
          >
            SmartHire
          </Link>

          <p className="text-sm text-[#737B76] mt-2">
            AI-powered job matching for the Nigerian job market
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#DCD8CC] rounded-2xl p-6 sm:p-8 shadow-sm">

          <div className="mb-6">

            <div className="w-12 h-12 rounded-xl bg-[#E7F0EA] flex items-center justify-center text-[#2F6F4E] text-xl mb-4">
              🔑
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#16241E]">
              Create a new password
            </h1>

            <p className="text-sm text-[#737B76] mt-2 leading-relaxed">
              Choose a new password for your SmartHire account.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            <label className="block text-sm font-medium text-[#35413A] mb-2">
              New password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              minLength={6}
              className="w-full border border-[#DCD8CC] rounded-lg px-4 py-3 text-sm text-[#16241E] bg-white focus:outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#E7F0EA]"
            />

            <label className="block text-sm font-medium text-[#35413A] mt-5 mb-2">
              Confirm new password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              required
              minLength={6}
              className="w-full border border-[#DCD8CC] rounded-lg px-4 py-3 text-sm text-[#16241E] bg-white focus:outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#E7F0EA]"
            />

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-lg bg-[#E7F0EA] border border-[#C9DACF] px-4 py-3 text-sm text-[#2F6F4E]">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 bg-[#2F6F4E] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#234F38] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Updating password..." : "Update password"}
            </button>

          </form>

          <div className="text-center mt-6 pt-5 border-t border-[#ECE9E1]">

            <Link
              to="/login"
              className="text-sm font-medium text-[#2F6F4E] hover:text-[#234F38]"
            >
              ← Back to login
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}