import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", {
        email,
      });

      setMessage(res.data.message);
      setEmail("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Something went wrong. Please try again."
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
              🔐
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#16241E]">
              Forgot your password?
            </h1>

            <p className="text-sm text-[#737B76] mt-2 leading-relaxed">
              Enter the email address associated with your SmartHire
              account and we'll send you a password reset link.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            <label className="block text-sm font-medium text-[#35413A] mb-2">
              Email address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
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
              {loading ? "Sending..." : "Send reset link"}
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