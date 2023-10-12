import express from "express";
import {
  createCategory,
  deleteSubcategory,
  editSubCategory,
  getUserSubcategories,
  getCategory,
  newSubCategory,
} from "../controllers/categoryController.mjs";
import validatedToken from "../middleware/validateTokenHandler.mjs";

const router = express.Router();

router.get("/category", getCategory);
router.post("/category/subcategory", validatedToken, newSubCategory);
router.post("/category", createCategory);
router.get("/category/categories", validatedToken, getUserSubcategories); //get all categories and subCategories per user
router.put("/category/subcategory/:id", validatedToken, editSubCategory);
router.delete("/category/subcategory/:id", validatedToken, deleteSubcategory);
export default router;
