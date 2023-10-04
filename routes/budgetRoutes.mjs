import express from "express";
import validatedToken from "../middleware/validateTokenHandler.mjs";
import {
  createBudget,
  deleteBudgetCategoryById,
  editBudget,
  getBudget,
  getBudgetPerCategory,
  updateBudgetCategory,
} from "../controllers/budgetController.mjs";

const router = express.Router();
router.get("/budget/:date", validatedToken, getBudget);
router.put("/budget/:date", validatedToken, editBudget);
router.get("/budget/:date/:categoryId", validatedToken, getBudgetPerCategory);
router.post("/new-budget", validatedToken, createBudget);
router.put("/budget-category/:date", validatedToken, updateBudgetCategory);
router.delete(
  "/budget-category/:budgetId",
  validatedToken,
  deleteBudgetCategoryById
);

export default router;
