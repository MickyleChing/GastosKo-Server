import express from "express";
import {
  registerUser,
  loginUser,
  currentUser,
  editProfile,
  googleLogin,
} from "../controllers/userController.mjs";
import validatedToken from "../middleware/validateTokenHandler.mjs";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/googlelogin", googleLogin);
router.get("/currentUser", validatedToken, currentUser);
router.put("/edit-profile", validatedToken, editProfile);

export default router;
