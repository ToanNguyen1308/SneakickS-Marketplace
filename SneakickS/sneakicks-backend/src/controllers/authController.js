import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import * as userModel from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "sneakicks-dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

export const register = async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "username, email, password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "password must be at least 6 characters",
    });
  }

  if (await userModel.existsByEmail(email)) {
    return res
      .status(409)
      .json({ success: false, message: "Email already exists" });
  }

  if (await userModel.existsByUsername(username)) {
    return res
      .status(409)
      .json({ success: false, message: "Username already exists" });
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await userModel.create({ username, email, password_hash });
  const token = signToken(user);

  return res.status(201).json({
    success: true,
    message: "Register success",
    token,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "email and password are required",
    });
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  const token = signToken(user);

  return res.json({
    success: true,
    message: "Login success",
    token,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

export const me = async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found" });
  }
  return res.json({ success: true, data: user });
};
