import express from "express";
import {
  createCategory,
  deleteSubcategory,
  editSubCategory,
  getUserSubcategories,
  // getCategory,
  newSubCategory,
} from "../controllers/categoryController.mjs";
import validatedToken from "../middleware/validateTokenHandler.mjs";

const router = express.Router();

//router.post("/category/:id", getCategory);
router.post("/category/subcategory", validatedToken, newSubCategory);
router.post("/category", createCategory);
router.get("/category/categories", validatedToken, getUserSubcategories); //get all categories per user
router.put("/category/subcategory/:id", validatedToken, editSubCategory);
router.delete("/category/subcategory/:id", validatedToken, deleteSubcategory);
export default router;
