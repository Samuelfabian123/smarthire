const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const User = require("../models/User");

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    if (!["jobseeker", "employer"].includes(role)) {
      return res.status(400).json({
        error: "Role must be jobseeker or employer",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      companyName:
        role === "employer" ? companyName?.trim() : undefined,
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);

    return res.status(500).json({
      error: "Registration failed",
      details: err.message,
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      error: "Login failed",
      details: err.message,
    });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Do not reveal whether an email exists
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    }

    // Create secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token and make it expire in 1 hour
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await user.save();

    const clientUrl =
      process.env.CLIENT_URL || "http://localhost:5174";

    const resetLink =
      `${clientUrl}/reset-password/${resetToken}`;

    const { error } = await resend.emails.send({
      from:
        process.env.MAIL_FROM || "onboarding@resend.dev",
      to: [user.email],
      subject: "Reset your SmartHire password",
      html: `
        <div style="font-family: Arial, sans-serif; background:#F7F5EE; padding:40px 20px;">
          <div style="max-width:520px; margin:0 auto; background:#ffffff; padding:32px; border-radius:16px; border:1px solid #DCD8CC;">
            
            <h1 style="color:#16241E; margin-bottom:8px;">
              SmartHire
            </h1>

            <h2 style="color:#16241E;">
              Reset your password
            </h2>

            <p style="color:#59615C; line-height:1.6;">
              Hello ${user.name},
            </p>

            <p style="color:#59615C; line-height:1.6;">
              We received a request to reset your SmartHire password.
              Click the button below to create a new password.
            </p>

            <p style="margin:30px 0;">
              <a
                href="${resetLink}"
                style="
                  display:inline-block;
                  background:#2F6F4E;
                  color:#ffffff;
                  text-decoration:none;
                  padding:13px 22px;
                  border-radius:8px;
                  font-weight:600;
                "
              >
                Reset my password
              </a>
            </p>

            <p style="color:#737B76; font-size:13px; line-height:1.6;">
              This link will expire in 1 hour.
            </p>

            <p style="color:#737B76; font-size:13px; line-height:1.6;">
              If you did not request a password reset, you can safely ignore
              this email.
            </p>

            <hr style="border:none; border-top:1px solid #ECE9E1; margin:25px 0;" />

            <p style="color:#8A918D; font-size:12px;">
              SmartHire — AI-powered job matching for the Nigerian job market.
            </p>

          </div>
        </div>
      `,
    });

    if (error) {
      console.error("RESEND ERROR:", error);

      return res.status(500).json({
        error: "Could not send password reset email",
      });
    }

    return res.status(200).json({
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);

    return res.status(500).json({
      error: "Password reset request failed",
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired password reset link",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    // Clear reset token after successful password change
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);

    return res.status(500).json({
      error: "Password reset failed",
    });
  }
};