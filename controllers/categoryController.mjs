import asyncHandler from "express-async-handler";
import Category from "../models/categoryModel.mjs";
import constants from "../constants.mjs";
import SubCategory from "../models/subCategoryModel.mjs";
import Expense from "../models/expensesModel.mjs";

//@desc Get all categories
//route GET /api/users/category
//@access Private
export const getCategory = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

//@desc Create Category
//route POST /api/users/category
//@access Private

export const createCategory = asyncHandler(async (req, res, next) => {
  try {
    const { categoryName } = req.body;
    if (!categoryName) {
      res.status(constants.VALIDATION_ERROR);
      throw new Error("Enter a Category Name");
    }
    const existingCategory = await Category.findOne({
      categoryName,
    });
    if (existingCategory) {
      res.status(constants.BAD_REQUEST);
      throw new Error("Category Name already Exist.");
    }
    const category = await Category.create({
      categoryName,
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

//@desc POST new SubCategory
//route POST /api/users/category/subcategory
//@access Private
export const newSubCategory = asyncHandler(async (req, res, next) => {
  try {
    const { subCategoryName, categoryName } = req.body;
    if (!subCategoryName || !categoryName) {
      res.status(constants.VALIDATION_ERROR);
      throw new Error("Subcategory name and category name are required.");
    }

    const category = await Category.findOne({ categoryName });
    if (!category) {
      res.status(constants.NOT_FOUND);
      throw new Error("Category not found.");
    }

    const userId = req.user.id;
    const username = req.user.username;

    const existingSubcategory = await SubCategory.findOne({
      subCategoryName,
      userId,
    });

    if (existingSubcategory) {
      res.status(constants.BAD_REQUEST);
      throw new Error("Subcategory with the same name already exists.");
    }

    const subCategory = await SubCategory.create({
      subCategoryName,
      categoryId: category._id,
      userId,
      categoryName,
      username,
    });

    res.status(201).json(subCategory);
    console.log(
      `New SubCategory added: ${subCategoryName} in ${categoryName} Category`
    );
  } catch (error) {
    next(error);
  }
});

//@desc GET all subCategories per user
//route GET /api/users/category/subcategory/:id
//@access Private
export const getUserSubcategories = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userSubcategories = await SubCategory.find({ userId });

    res.status(200).json(userSubcategories);
  } catch (error) {
    next(error);
  }
});

//@desc Edit Subcategory
//route PUT /api/users/category/subcategory/:id
//@access Private
export const editSubCategory = asyncHandler(async (req, res, next) => {
  const { subCategoryName } = req.body;
  const subCategoryId = req.params.id;

  try {
    // Find the subcategory that is being edited
    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      subCategoryId,
      { subCategoryName },
      { new: true }
    );

    if (!updatedSubCategory) {
      res.status(404);
      throw new Error("Subcategory not found");
    }

    const existingSubcategory = await SubCategory.findOne({
      subCategoryName,
      _id: { $ne: subCategoryId }, // Exclude the current subcategory
    });

    if (existingSubcategory) {
      res.status(constants.BAD_REQUEST);
      throw new Error("Subcategory with the same name already exists.");
    }

    // Find all expenses associated with the edited subcategory
    const expensesToUpdate = await Expense.find({
      "expenses.subCategory": subCategoryId,
    });

    // Update the subCategoryName in each expense item
    for (const expense of expensesToUpdate) {
      for (const expenseItem of expense.expenses) {
        if (expenseItem.subCategory.toString() === subCategoryId) {
          expenseItem.subCategoryName = subCategoryName;
        }
      }
      // Save the updated expense
      await expense.save();
    }

    res.status(200).json(updatedSubCategory);
    console.log(`Subcategory with ID ${subCategoryId} successfully updated`);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: `Subcategory update failed: ${error.message}` });
  }
});

//@desc Delete Subcategory
//@route DELETE api/users/category/subcategory
//@access Private
export const deleteSubcategory = asyncHandler(async (req, res, next) => {
  const { subCategoryName } = req.body;
  const subCategoryId = req.params.id;
  try {
    const subCategory = await SubCategory.findByIdAndDelete(
      subCategoryId,
      { subCategoryName },
      { new: true }
    );
    if (!subCategory) {
      res.status(constants.NOT_FOUND);
      throw new Error("Subcategory not found.");
    }
    res.status(200).json(subCategory);
    console.log(`Subcategory with ID ${subCategoryId} successfully deleted`);
  } catch (error) {
    next(error);
  }
});
