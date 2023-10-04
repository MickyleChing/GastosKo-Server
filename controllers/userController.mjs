import jwt from "jsonwebtoken";
import User from "../models/userModel.mjs";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";

//@desc register User
//@route POST /api/users/register
//@access public
export const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, firstName, lastName } = req.body;
  const requiredFields = ["email", "username", "password"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    res.status(400).json({
      message: `Please provide the required fields: ${missingFields.join(
        ", "
      )}`,
    });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userFields = {
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
    };

    const userAvailable = await User.findOne({ email });
    if (userAvailable) {
      res.status(400);
      throw new Error(
        "Email already registered. Try logging in or use a different Email."
      );
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400);
      throw new Error(
        "Username already taken. Please choose a different Username"
      );
    }

    const user = await User.create(userFields);
    if (user) {
      const responseData = {
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      res.status(201).json(responseData); // Send back the constructed response data
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Registration failed: ${error.message}` });
  }
});

//@desc login User
//@route POST /api/users/login
//@access public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new Error("Email and password are mandatory!");
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400);
      throw new Error("Incorrect email or password");
    }

    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "60m" }
    );
    res.status(200).json({
      accessToken,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Login failed: ${error.message}` });
  }
});

//@description Get Current User profile
//@route GET /api/users/currentUser
//@access private
export const currentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "-password -createdAt -updateAt"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const { firstName, lastName, email, username, _id } = user;

  res.json({
    firstName,
    lastName,
    email,
    username,
    userId: _id,
  });

});

//@description Update/Edit Profile
//@route PUT /api/users/edit-profile/
//@access Private
export const editProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, username } = req.body;
  const userId = req.user.id;

  try {
    const usernameExists = await User.findOne({ username });
    if (usernameExists && usernameExists._id.toString() !== userId) {
      res.status(400);
      throw new Error("Username is already taken.");
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { firstName, lastName, username } },
      { new: true }
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const responseData = {
      email: user.email,
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: `Profile update failed: ${error.message}` });
  }
});
