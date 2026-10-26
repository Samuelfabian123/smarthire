
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT || 587),
  secure: Number(process.env.MAIL_PORT || 587) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendSmartHireEmail({ to, subject, html }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Gmail SMTP is not configured. Check MAIL_USER and MAIL_PASS.");
  }

  return mailer.sendMail({
    from: `SmartHire <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
}

const VERIFICATION_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    firstName: user.firstName || "",
    surname: user.surname || "",
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    companyName: user.companyName || "",
    isEmailVerified: user.isEmailVerified,
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return replacements[character];
  });
}

async function sendVerificationEmail(user, code) {
  await sendSmartHireEmail({
    to: user.email,
    subject: "Verify your SmartHire email",
    html: `
      <div style="font-family:Arial,sans-serif;background:#F7F5EE;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #DCD8CC;">
          <h1 style="color:#16241E;">SmartHire</h1>
          <h2 style="color:#16241E;">Verify your email address</h2>
          <p style="color:#59615C;line-height:1.6;">Hello ${escapeHtml(user.firstName || user.name)},</p>
          <p style="color:#59615C;line-height:1.6;">Enter this verification code in SmartHire to complete your registration:</p>
          <div style="background:#E7F0EA;padding:18px;text-align:center;border-radius:10px;font-size:30px;font-weight:bold;letter-spacing:8px;color:#234F38;">${code}</div>
          <p style="color:#737B76;line-height:1.6;">This code expires in 10 minutes. Do not share it with anyone.</p>
          <p style="color:#737B76;font-size:12px;">If you did not create a SmartHire account, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}

// REGISTER
exports.register = async (req, res) => {
  let createdUser;

  try {
    const {
      name,
      firstName,
      surname,
      email,
      password,
      role,
      companyName,
      companyAddress,
      phone,
    } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password || !role) {
      return res.status(400).json({
        error: "Email, password and account type are required.",
      });
    }

    if (!["jobseeker", "employer"].includes(role)) {
      return res.status(400).json({
        error: "Role must be jobseeker or employer.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    let cleanFirstName = String(firstName || "").trim();
    let cleanSurname = String(surname || "").trim();

    // Backward compatibility with the old registration form.
    if (role === "jobseeker" && (!cleanFirstName || !cleanSurname)) {
      const oldName = String(name || "").trim();
      const parts = oldName.split(/\s+/).filter(Boolean);

      if (!cleanFirstName && parts.length > 0) {
        cleanFirstName = parts[0];
      }

      if (!cleanSurname && parts.length > 1) {
        cleanSurname = parts.slice(1).join(" ");
      }
    }

    if (role === "jobseeker" && (!cleanFirstName || !cleanSurname)) {
      return res.status(400).json({
        error: "First name and surname are required.",
      });
    }

    const cleanCompanyName = String(companyName || "").trim();

    if (role === "employer" && !cleanCompanyName) {
      return res.status(400).json({
        error: "Company name is required for employer accounts.",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        return res.status(409).json({
          error: "This email already has a pending registration. Enter the verification code or request a new one.",
          requiresEmailVerification: true,
          email: normalizedEmail,
        });
      }

      return res.status(409).json({
        error: "Email already registered. Please log in or use another email.",
      });
    }

    const finalName =
      role === "jobseeker"
        ? `${cleanFirstName} ${cleanSurname}`.trim()
        : cleanCompanyName;

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationCode = crypto.randomInt(100000, 1000000).toString();

    createdUser = await User.create({
      name: finalName,
      firstName: role === "jobseeker" ? cleanFirstName : "",
      surname: role === "jobseeker" ? cleanSurname : "",
      email: normalizedEmail,
      phone: String(phone || "").trim(),
      password: hashedPassword,
      role,
      companyName: role === "employer" ? cleanCompanyName : "",
      companyAddress:
        role === "employer" ? String(companyAddress || "").trim() : "",
      isEmailVerified: false,
      emailVerificationCodeHash: crypto
        .createHash("sha256")
        .update(verificationCode)
        .digest("hex"),
      emailVerificationExpires: new Date(Date.now() + VERIFICATION_EXPIRY_MS),
      emailVerificationLastSentAt: new Date(),
    });

    try {
      await sendVerificationEmail(createdUser, verificationCode);
    } catch (emailError) {
      console.error("REGISTRATION VERIFICATION EMAIL ERROR:", emailError.message);
      await User.deleteOne({ _id: createdUser._id });
      createdUser = null;
      return res.status(503).json({
        error: "We could not send your verification email. Please check your email address and try again shortly.",
      });
    }

    return res.status(201).json({
      message: "We sent a six-digit verification code to your email.",
      email: normalizedEmail,
      requiresEmailVerification: true,
    });
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        error: "Email already registered.",
      });
    }

    return res.status(500).json({
      error: "Registration failed. Please try again.",
    });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();

    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: "Enter your email address and the 6-digit verification code.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        error: "Invalid email or verification code.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        message: "Email already verified. You can log in.",
        alreadyVerified: true,
      });
    }

    if (
      !user.emailVerificationCodeHash ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        error: "Verification code expired. Request a new code.",
        codeExpired: true,
      });
    }

    const submittedHash = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const expected = Buffer.from(user.emailVerificationCodeHash, "hex");
    const submitted = Buffer.from(submittedHash, "hex");

    if (
      expected.length !== submitted.length ||
      !crypto.timingSafeEqual(expected, submitted)
    ) {
      return res.status(400).json({
        error: "Invalid email or verification code.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCodeHash = null;
    user.emailVerificationExpires = null;
    user.emailVerificationLastSentAt = null;

    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      message: "Email verified successfully.",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("EMAIL VERIFICATION ERROR:", err);

    return res.status(500).json({
      error: "Email verification failed. Please try again.",
    });
  }
};

// RESEND VERIFICATION CODE
exports.resendVerification = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        error: "Email address is required.",
      });
    }

    const user = await User.findOne({ email });

    // Avoid disclosing account details.
    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        message:
          "If the account needs verification, a new code will be sent.",
      });
    }

    const lastSentAt = user.emailVerificationLastSentAt
      ? user.emailVerificationLastSentAt.getTime()
      : 0;

    const waitMs = RESEND_COOLDOWN_MS - (Date.now() - lastSentAt);

    if (waitMs > 0) {
      return res.status(429).json({
        error: `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code.`,
      });
    }

    const verificationCode = crypto
      .randomInt(100000, 1000000)
      .toString();

    user.emailVerificationCodeHash = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

    user.emailVerificationExpires = new Date(
      Date.now() + VERIFICATION_EXPIRY_MS
    );
    user.emailVerificationLastSentAt = new Date();

    await user.save();

    try {
      await sendVerificationEmail(user, verificationCode);
    } catch (emailError) {
      console.error("RESEND VERIFICATION EMAIL ERROR:", emailError.message);

      return res.status(503).json({
        error: "Could not send the verification email. Please try again shortly.",
      });
    }

    return res.status(200).json({
      message: "A new verification code has been sent if the account needs verification.",
    });
  } catch (err) {
    console.error("RESEND VERIFICATION ERROR:", err);

    return res.status(500).json({
      error: "Unable to resend verification code.",
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid credentials.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: "Please verify your email before signing in.",
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      error: "Login failed. Please try again.",
    });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    // Do not reveal whether an email exists.
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    const clientUrl =
      process.env.CLIENT_URL || "http://localhost:5174";

    const resetLink = `${clientUrl}/reset-password/${resetToken}`;

    await sendSmartHireEmail({
      to: user.email,
      subject: "Reset your SmartHire password",
      html: `
        <div style="font-family:Arial,sans-serif;background:#F7F5EE;padding:40px 20px;">
          <div style="max-width:520px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #DCD8CC;">
            <h1 style="color:#16241E;">SmartHire</h1>
            <h2 style="color:#16241E;">Reset your password</h2>
            <p style="color:#59615C;line-height:1.6;">
              Hello ${escapeHtml(user.name)},
            </p>
            <p style="color:#59615C;line-height:1.6;">
              We received a request to reset your SmartHire password.
              Click below to create a new password.
            </p>
            <p style="margin:30px 0;">
              <a href="${resetLink}" style="display:inline-block;background:#2F6F4E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:600;">
                Reset my password
              </a>
            </p>
            <p style="color:#737B76;font-size:13px;line-height:1.6;">
              This link expires in 1 hour. If you did not request a reset, ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #ECE9E1;margin:25px 0;" />
            <p style="color:#8A918D;font-size:12px;">
              SmartHire — AI-powered job matching for the Nigerian job market.
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);

    return res.status(500).json({
      error: "Password reset request failed.",
    });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "New password is required.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired password reset link.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
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
      error: "Password reset failed.",
    });
  }
};
