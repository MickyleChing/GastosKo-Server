import asyncHandler from "express-async-handler";
import Expense from "../models/expensesModel.mjs";
import Category from "../models/categoryModel.mjs";
import constants from "../constants.mjs";
import Budget from "../models/budgetModel.mjs";

//@desc GET Budget for the Month
//@route GET /api/users/budget/:date
//@access Private
export const getBudget = asyncHandler(async (req, res, next) => {
  try {
    const date = req.params.date;
    const userId = req.user.id;
    const budget = await Budget.findOne({ date: date, userId });

    if (!budget) {
      return res
        .status(404)
        .json({ message: "No budget found for the specified date" });
    }

    // Calculate the remaining budget (savings)
    let totalBudget = 0;
    budget.budgetPerCategory.forEach((item) => {
      totalBudget += item.budgetAmount;
    });
    const savings = budget.budget - totalBudget;

    // Include the savings in the response
    res.status(200).json({ ...budget.toObject(), savings: savings });
  } catch (error) {
    next(error);
  }
});
//@desc GET Budget per Category using date
//@route GET api/users/budget/:date/:categoryName
//@access Private
export const getBudgetPerCategory = asyncHandler(async (req, res, next) => {
  try {
    const date = req.params.date;
    const userId = req.user.id;
    const categoryName = req.params.categoryName;

    // Check if a budget with the same user and month/year already exists
    const budget = await Budget.findOne({
      date: date,
      "budgetPerCategory.categoryName": categoryName,
      userId,
    });

    if (!budget) {
      return res.status(404).json({ message: "No budget found" });
    }
    if (!budget.budgetPerCategory) {
      return res.status(404).json({
        messeage: "No Category Found in this Budget and Month",
      });
    }

    const budgetPerCategoryItem = budget.budgetPerCategory.find(
      (item) => item.categoryName === categoryName
    );
    console.log("budgetPerCategoryItem:", budgetPerCategoryItem);

    if (!budgetPerCategoryItem) {
      return res.status(404).json({
        message: "no category found for the specified date and categoryName",
      });
    }

    res.status(200).json(budgetPerCategoryItem);
  } catch (error) {
    next(error);
  }
});

//@desc Create Budget for the Month
//@route POST /api/users/new-budget
//@access Private
export const createBudget = asyncHandler(async (req, res, next) => {
  try {
    const { budget, date } = req.body;
    const userId = req.user.id;

    // Get the month and year from the incoming date
    const incomingMonthYear = new Date(date).toISOString().substr(0, 7);

    // Check if a budget with the same user and month/year already exists
    const startOfMonth = new Date(incomingMonthYear); // Start of the month
    const endOfMonth = new Date(incomingMonthYear); // End of the month
    endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Set to next month
    endOfMonth.setDate(1); // Set to the 1st day of next month
    endOfMonth.setDate(endOfMonth.getDate() - 1); // Subtract 1 day to get the last day of the current month

    // Check if a budget with the same user and month/year already exists
    const existingBudget = await Budget.findOne({
      userId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    if (existingBudget) {
      res.status(403).json({
        message: "Budget for the same month/year already exists.",
      });
    } else {
      // Create a new budget with predefined categories and budget amounts set to 0
      const newBudget = new Budget({
        userId,
        date: new Date(date),
        budget,
        currentBalance: budget,
        budgetPerCategory: [], // Initialize with an empty array
      });

      // Retrieve all categories from the database and add them to the budget
      const allCategories = await Category.find({});
      allCategories.forEach((category) => {
        newBudget.budgetPerCategory.push({
          categoryId: category._id,
          categoryName: category.categoryName,
          budgetAmount: 0,
        });
      });

      const savedBudget = await newBudget.save();

      res.status(201).json(savedBudget);
      console.log("Budget created successfully:", savedBudget);
    }
  } catch (error) {
    next(error);
  }
});

//@desc Add Budget for Category
//@route PUT /api/users/budget-category/:date
//@access private
export const updateBudgetCategory = asyncHandler(async (req, res, next) => {
  const { categoryName, budgetAmount } = req.body;
  const date = req.params.date;
  const userId = req.user.id;

  // Calculate the start and end dates for the entire month based on the selected date
  const startDate = new Date(date);
  startDate.setDate(1); // Set to the 1st day of the month
  const endDate = new Date(date);
  endDate.setMonth(endDate.getMonth() + 1); // Set to the next month
  endDate.setDate(0); // Set to the last day of the current month

  // Find the Budget for the specified date and user
  try {
    // Find the budget document by _id and user ID
    const existingBudget = await Budget.findOne({
      date: date,
      userId: userId,
    });

    if (!existingBudget) {
      return res.status(404).json({ message: "Budget Not Found" });
    }

    // Find the category by categoryName
    const category = await Category.findOne({
      categoryName: categoryName,
    });

    if (!category) {
      res.status(constants.NOT_FOUND);
      throw new Error("Category Name not Found");
    }

    // Check if there's an existing budget for the category in the budget document
    const existingCategoryBudgetIndex =
      existingBudget.budgetPerCategory.findIndex((item) =>
        item.categoryId.equals(category._id)
      );

    if (existingCategoryBudgetIndex !== -1) {
      // Calculate the total budget across all categories
      let totalBudget = 0;
      existingBudget.budgetPerCategory.forEach((item) => {
        totalBudget += item.budgetAmount;
      });

      // Check if the updated budgetAmount exceeds the remaining budget
      const remainingBudget =
        existingBudget.budget -
        totalBudget +
        existingBudget.budgetPerCategory[existingCategoryBudgetIndex]
          .budgetAmount;

      if (budgetAmount > remainingBudget) {
        return res
          .status(400)
          .json({ message: "Budget exceeded for the month." });
      }

      // Update the budget for the category
      existingBudget.budgetPerCategory[
        existingCategoryBudgetIndex
      ].budgetAmount = budgetAmount;
    } else {
      // If the category doesn't exist in the budget, add it
      existingBudget.budgetPerCategory.push({
        categoryId: category._id,
        categoryName: category.categoryName,
        budgetAmount: budgetAmount,
      });
    }

    // Save the updated budget document
    const updatedBudget = await existingBudget.save();

    let totalBudget = 0;
    existingBudget.budgetPerCategory.forEach((item) => {
      totalBudget += item.budgetAmount;
    });

    const savings = existingBudget.budget - totalBudget;
    console.log("Savings:", savings);
    res.status(200).json({ updatedBudget, savings: savings });
  } catch (error) {
    next(error);
  }
});

//@desc Edit Budget for the Month and Update Current Balance
//@route PUT /api/users/budget/:date
//@access private
export const editBudget = asyncHandler(async (req, res, next) => {
  const { budget } = req.body;
  const date = req.params.date;
  const userId = req.user.id;

  try {
    // Find the budget document by date and user ID
    const existingBudget = await Budget.findOne({
      date: date,
      userId: userId,
    });

    if (!existingBudget) {
      return res.status(404).json({ message: "Budget Not Found" });
    }

    // Calculate the difference between the new budget and the previous budget
    const previousBudget = existingBudget.budget;
    const budgetDifference = budget - previousBudget;

    // Update the budget for the month
    existingBudget.budget = budget;

    // Update the currentBalance by adding the budgetDifference
    existingBudget.currentBalance += budgetDifference;

    // Save the updated budget document
    const updatedBudget = await existingBudget.save();

    res.status(200).json(updatedBudget);
  } catch (error) {
    next(error);
  }
});

//@desc Delete Budget per category
//@route DELETE /api/users/budget-category/:budgetId
//@access Private
export const deleteBudgetCategoryById = asyncHandler(async (req, res, next) => {
  const budgetId = req.params.budgetId;
  const userId = req.user.id;

  try {
    // Query to delete the budget category by _id and user ID
    const deletedBudget = await Budget.findOneAndUpdate(
      {
        userId: userId,
        "budgetPerCategory._id": budgetId,
      },
      {
        $pull: { budgetPerCategory: { _id: budgetId } },
      },
      { new: true }
    );

    if (!deletedBudget) {
      return res.status(404).json({
        message: "Budget category not found for the specified ID.",
      });
    }

    // Log and respond with success
    console.log("Deleted Budget Category:", deletedBudget);

    res.status(200).json({
      message: `Category with ID ${budgetId} successfully deleted`,
      deletedBudget,
    });
  } catch (error) {
    console.error("Error deleting budget category:", error);
    next(error);
  }
});
