import asyncHandler from "express-async-handler";
import Expense from "../models/expensesModel.mjs";
import constants from "../constants.mjs";
import SubCategory from "../models/subCategoryModel.mjs";
import Budget from "../models/budgetModel.mjs";
import mongoose from "mongoose";

//@desc Create Expenses
//route POST /api/users/expenses
//@access Private
export const createExpense = asyncHandler(async (req, res, next) => {
  try {
    const { user, date, expenses } = req.body;
    const userId = req.user.id;

    // Calculate the start and end dates for the entire month based on the selected date
    const startDate = new Date(date);
    startDate.setDate(1); // Set to the 1st day of the month
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 1); // Set to the next month
    endDate.setDate(0); // Set to the last day of the current month

    const existingDate = await Expense.findOne({
      date,
      userId: user,
    });

    if (existingDate) {
      res.status(constants.BAD_REQUEST);
      throw new Error("Expenses with the same user and date already Exists.");
    }
    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      res.status(constants.VALIDATION_ERROR);
      throw new Error("Expenses array is required.");
    }

    // Create an array to store the created expense items
    const createdExpenseItems = [];

    // Loop through the expenses array to create individual expense items
    for (const expenseItem of expenses) {
      const expenseId = new mongoose.Types.ObjectId();
      const { subCategoryName, title, quantity, amount, description } =
        expenseItem;

      const subCategory = await SubCategory.findOne({
        subCategoryName,
        userId,
      }).populate("categoryId");

      if (!subCategory) {
        res.status(constants.NOT_FOUND);
        throw new Error("Subcategory not found.");
      }
      const categoryName = subCategory.categoryId.categoryName;
      const category = subCategory.categoryId;
      const newExpenseItem = {
        _id: expenseId,
        category: category._id,
        categoryName,
        subCategory: subCategory._id,
        subCategoryName,
        date,
        title,
        quantity,
        amount,
        description,
      };

      createdExpenseItems.push(newExpenseItem);
    }

    const newExpense = new Expense({
      user: userId,
      date,
      expenses: createdExpenseItems,
    });
    // Calculate totalAmountInArray for each expense item and the total amount for the entire array
    let totalAmountInArray = 0;
    for (const newExpenseItem of createdExpenseItems) {
      newExpenseItem.totalAmountInArray =
        newExpenseItem.quantity * newExpenseItem.amount;
      totalAmountInArray += newExpenseItem.totalAmountInArray;
    }

    // Update the newExpense object with the totalAmountInArray
    newExpense.totalAmountInArray = totalAmountInArray;

    await newExpense.save();

    console.log("New Expenses Created");
    res.status(201).json(newExpense);

    await updateBudget(userId, startDate, endDate, totalAmountInArray);
  } catch (error) {
    next(error);
  }
});

//@desc Add Expense Index to an Existing Date
//route POST /api/users/expenses/:date/add
//@access Private
export const addExpenseIndex = asyncHandler(async (req, res, next) => {
  try {
    const date = req.params.date;
    const userId = req.user.id;

    // Calculate the start and end dates for the entire month based on the selected date
    const startDate = new Date(date);
    startDate.setDate(1); // Set to the 1st day of the month
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 1); // Set to the next month
    endDate.setDate(0); // Set to the last day of the current month
    // Find the expense for the specified date and user
    const existingExpense = await Expense.findOne({ date });

    if (!existingExpense) {
      res.status(constants.NOT_FOUND);
      throw new Error("No expenses found for the specified date and user.");
    }
    const expenseId = new mongoose.Types.ObjectId();
    const { subCategoryName, title, quantity, amount, currency, description } =
      req.body;

    const subCategory = await SubCategory.findOne({
      subCategoryName,
      userId,
    }).populate("categoryId");

    if (!subCategory) {
      res.status(constants.NOT_FOUND);
      throw new Error("Subcategory not found.");
    }
    const categoryName = subCategory.categoryId.categoryName;
    const category = subCategory.categoryId;

    const newExpenseItem = {
      _id: expenseId,
      category: category,
      categoryName: categoryName,
      subCategory: subCategory._id,
      subCategoryName,
      date,
      title,
      quantity,
      amount,
      currency,
      description,
    };

    existingExpense.expenses.push(newExpenseItem);

    // Recalculate totalAmountInArray for the entire expenses array
    let totalAmountInArray = 0;
    for (const expenseItem of existingExpense.expenses) {
      expenseItem.totalAmountInArray =
        expenseItem.quantity * expenseItem.amount;
      totalAmountInArray += expenseItem.totalAmountInArray;
    }

    // Update the existingExpense object with the updated totalAmountInArray
    existingExpense.totalAmountInArray = totalAmountInArray;

    await existingExpense.save();
    console.log("New Expense Index Added");

    await updateBudget(userId, startDate, endDate, totalAmountInArray);

    res.status(201).json(existingExpense);
  } catch (error) {
    next(error);
  }
});

//UPDATE BUDGET
// Function to update the budget model
async function updateBudget(userId, startDate, endDate) {
  try {
    // Find the budget for the specified user and date range (for the entire month)
    const budget = await Budget.findOne({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    if (!budget) {
      console.log("No budget found for this date range.");
      return;
    }

    // Calculate the new current balance for the specified date range
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });

    let totalExpenseAmount = 0;

    for (const expense of expenses) {
      totalExpenseAmount += expense.totalAmountInArray;
    }

    // Update the current balance by subtracting the total expense amount
    budget.currentBalance = budget.budget - totalExpenseAmount;

    // Save the updated budget
    await budget.save();
    console.log("Budget updated: ", budget.currentBalance);
  } catch (error) {
    console.error("Error updating budget:", error);
  }
}

//@desc GET expenses per day
//route GET /api/users/expenses/:date
//@access Private
export const getExpensesPerDay = asyncHandler(async (req, res, next) => {
  try {
    const date = req.params.date;
    const user = req.user.id;

    const userExpensesPerDay = await Expense.find({ date, user });

    if (userExpensesPerDay.length === 0) {
      return res
        .status(404)
        .json({ message: "No expenses found for the specified date." });
    }
    console.log();
    res.status(200).json(userExpensesPerDay);
  } catch (error) {
    next(error);
  }
});

//@desc GET expense by _id for a specific date getExpensesPerDayPerId
//route GET /api/users/expense/:expenseId
//@access Private
export const getExpensesPerDayPerId = asyncHandler(async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.id;
    console.log("userId", userId);
    console.log("expenseId", expenseId);
    if (!mongoose.isValidObjectId(expenseId)) {
      return res.status(400).json({
        message: "Invalid expenseId format.",
      });
    }

    const expense = await Expense.findOne({
      user: userId,
      expenses: {
        $elemMatch: { _id: expenseId },
      },
    });
    if (!expense) {
      return res.status(404).json({
        message: "No expense found for the specified ID and user.",
      });
    }

    // Check if the found expense has an 'expenses' property
    if (!expense.expenses) {
      return res.status(404).json({
        message: "Expense document does not contain 'expenses' property.",
      });
    }
    const expenseItem = expense.expenses.find(
      (item) => item._id?.toString() === expenseId
    );
    console.log("expenseItem:", expenseItem);

    if (!expenseItem) {
      return res.status(404).json({
        message: "No expense item found for the specified ID.",
      });
    }

    res.status(200).json(expenseItem);
  } catch (error) {
    next(error);
  }
});

//@desc GET all expenses per User
//route GET /api/users/user-expenses
//@access Private
export const getExpensesPerUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userExpenses = await Expense.find({ user: userId });

    if (userExpenses.length === 0) {
      return res
        .status(400)
        .json({ message: "No Expenses found for the specified User." });
    }
    res.status(200).json(userExpenses);
  } catch (error) {
    next(error);
  }
});

// @desc get expenses for the current month and year
// route GET /api/users/user-expenses/current
// @access Private
export const getExpensesForCurrentMonth = asyncHandler(
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get the current date and extract the current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // Months are zero-based, so add 1
      const currentYear = currentDate.getFullYear();

      // Calculate the start and end dates for the current month
      const startDate = new Date(`${currentYear}-${currentMonth}-01`);
      const endDate = new Date(`${currentYear}-${currentMonth + 1}-01`);

      // Find expenses for the specified user within the current month and year
      const userExpenses = await Expense.find({
        user: userId,
        date: { $gte: startDate, $lt: endDate },
      });

      if (userExpenses.length === 0) {
        return res.status(404).json({
          message: "No expenses found for the current month and year.",
        });
      }

      res.status(200).json(userExpenses);
    } catch (error) {
      next(error);
    }
  }
);

// @desc get expenses for the current week and month
// route GET /api/users/user-expenses/current-week
// @access Private
export const getExpensesForCurrentWeek = asyncHandler(
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get the current date
      const currentDate = new Date();

      // Calculate the start of the current week (Sunday)
      const startOfWeek = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - currentDate.getDay()
      );

      // Calculate the end of the current week (Saturday)
      const endOfWeek = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + (6 - currentDate.getDay())
      );

      // Find expenses for the specified user within the current week and month
      const userExpenses = await Expense.find({
        user: userId,
        date: { $gte: startOfWeek, $lte: endOfWeek },
      });

      if (userExpenses.length === 0) {
        return res.status(404).json({
          message: "No expenses found for the current week and month.",
        });
      }

      res.status(200).json(userExpenses);
    } catch (error) {
      next(error);
    }
  }
);

//@desc Edit expenses per Day per Id
//route PUT api/users/expense/:expenseId
//@access Private
export const editExpensesPerDayPerId = asyncHandler(async (req, res, next) => {
  try {
    const { subCategoryName, quantity, title, description, amount, currency } =
      req.body;
    const expenseId = req.params.expenseId;
    const userId = req.user.id;

    const expense = await Expense.findOne({
      "expenses._id": expenseId,
      user: userId,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    // Find the index of the expense within the expenses array
    const expenseIndex = expense.expenses.findIndex(
      (expenseItem) => String(expenseItem._id) === expenseId
    );

    if (expenseIndex === -1) {
      return res.status(404).json({ message: "Expense not found." });
    }

    const validSubCategory = await SubCategory.findOne({
      subCategoryName,
    }).populate("categoryId");

    if (!validSubCategory) {
      return res.status(400).json({ message: "Invalid subcategory." });
    }

    const categoryName = validSubCategory.categoryId.categoryName;
    const date = expense.date;

    // Update the expense object with the new values
    expense.expenses[expenseIndex].subCategory = validSubCategory._id;
    expense.expenses[expenseIndex].categoryName = categoryName;
    expense.expenses[expenseIndex].subCategoryName = subCategoryName;
    expense.expenses[expenseIndex].quantity = quantity;
    expense.expenses[expenseIndex].title = title;
    expense.expenses[expenseIndex].description = description;
    expense.expenses[expenseIndex].amount = amount;
    expense.expenses[expenseIndex].currency = currency;

    // Save the updated expense
    await expense.save();

    // Calculate the start and end dates for the entire month based on the selected date
    const startDate = new Date(date);
    startDate.setDate(1); // Set to the 1st day of the month
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 1); // Set to the next month
    endDate.setDate(0); // Set to the last day of the current month
    // Find the expense for the specified date and user
    // Fetch the expense with the specified expenseId and user
    const totalAmountInArray = expense.expenses.reduce(
      (total, item) => total + item.quantity * item.amount,
      0
    );

    // Call the updateBudget function with the calculated start and end dates and the totalAmountInArray
    await updateBudget(userId, startDate, endDate, totalAmountInArray);
    res.status(200).json(expense);
  } catch (error) {
    next(error);
  }
});

//NO update for budget yet
//@desc Delete an expense item in the expense Array
//@route DELETE api/users/expense/:expenseId
//@access Private
export const deleteExpensePerDayPerId = asyncHandler(async (req, res, next) => {
  const expenseId = req.params.expenseId;
  const userId = req.user.id;

  try {
    // Use findOneAndUpdate to remove the expense from the expenses array
    const deletedExpense = await Expense.findOneAndUpdate(
      {
        user: userId,
        "expenses._id": expenseId,
      },
      {
        $pull: { expenses: { _id: expenseId } },
      },
      { new: true }
    );

    if (!deletedExpense) {
      return res.status(404).json({
        message: "Expense not found for the specified ID.",
      });
    }

    // Recalculate the totalAmountInArray
    const totalAmountInArray = deletedExpense.expenses.reduce(
      (total, expense) => total + expense.totalAmountInArray,
      0
    );

    // Update the totalAmountInArray field in the Expense document
    deletedExpense.totalAmountInArray = totalAmountInArray;

    // Save the updated document
    await deletedExpense.save();

    // Calculate the start and end dates for the entire month based on the selected date
    const startDate = new Date(deletedExpense.date);
    startDate.setDate(1); // Set to the 1st day of the month
    const endDate = new Date(deletedExpense.date);
    endDate.setMonth(endDate.getMonth() + 1); // Set to the next month
    endDate.setDate(0); // Set to the last day of the current month

    // Calculate the total amount of expenses for the current month
    const expensesForCurrentMonth = await Expense.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const totalAmountForCurrentMonth = expensesForCurrentMonth.reduce(
      (total, expense) => total + expense.totalAmountInArray,
      0
    );

    // Call the updateBudget function with the calculated start and end dates and the totalAmountForCurrentMonth
    await updateBudget(userId, startDate, endDate, totalAmountForCurrentMonth);

    res.status(200).json({
      message: `Expense with ID ${expenseId} successfully deleted`,
      deletedExpense,
    });
  } catch (error) {
    next(error);
  }
});

//@desc Delete an expense per day
//@route DELETE api/users/expense/:expenseId
//@access Private
export const deleteExpensePerDay = asyncHandler(async (req, res, next) => {
  try {
    const date = req.params.date;
    const userId = req.user.id;
    const deletedExpenses = await Expense.findOneAndDelete({ date, userId });

    if (!deletedExpenses) {
      return res
        .status(404)
        .json({ message: "No expenses found for the specified date." });
    }

    res.status(200).json(deletedExpenses);
    console.log(`Expense with date ${date} successfully deleted`);
  } catch (error) {
    next(error);
  }
});
