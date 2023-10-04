import express from "express";
import validatedToken from "../middleware/validateTokenHandler.mjs";
import {
  addExpenseIndex,
  createExpense,
  deleteExpensePerDay,
  deleteExpensePerDayPerId,
  editExpensesPerDayPerId,
  getExpensesForCurrentMonth,
  getExpensesForCurrentWeek,
  getExpensesPerDay,
  getExpensesPerDayPerId,
  getExpensesPerUser,
} from "../controllers/expensesController.mjs";

const router = express.Router();

router.post("/expenses", validatedToken, createExpense); //create expenses
router.get("/expenses/:date", validatedToken, getExpensesPerDay); //get expenses per day
router.delete("/expenses/:date", validatedToken, deleteExpensePerDay); //delete expenses by day
router.get("/user-expenses", validatedToken, getExpensesPerUser); //get all expenses per user
router.put("/expense/:expenseId", validatedToken, editExpensesPerDayPerId); //edit expenses inside the expense array using expenseId
router.get("/expense/:expenseId", validatedToken, getExpensesPerDayPerId); // get expenses inside the expense array using expenseId
router.delete("/expense/:expenseId", validatedToken, deleteExpensePerDayPerId); //delete expenses inside the expense array using expenseId
router.post("/expenses/:date/add", validatedToken, addExpenseIndex); //create new expense index/item inside the expense array in the day
router.get(
  "/user-expenses/current",
  validatedToken,
  getExpensesForCurrentMonth
);
router.get(
  "/user-expenses/current-week",
  validatedToken,
  getExpensesForCurrentWeek
);
export default router;
