import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
      required: true,
    },
    totalAmountInArray: {
      type: Number,
      default: 0,
    },
    expenses: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
        },
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        categoryName: {
          type: String,
        },
        subCategory: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubCategory",
        },
        subCategoryName: {
          type: String,
        },
        quantity: Number,
        title: {
          type: String,
        },
        description: String,
        amount: Number,
        currency: String,
        totalAmountInArray: Number, // Total amount inside the array
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Calculate and update the totalAmount and totalAmountInArray fields before saving an expense entry
expenseSchema.pre("save", function (next) {
  this.expenses.forEach((expense) => {
    expense.totalAmountInArray = expense.quantity * expense.amount;
  });

  // Calculate the totalAmountInArray for this date
  this.totalAmountInArray = this.expenses.reduce(
    (total, expense) => total + expense.totalAmountInArray,
    0
  );

  // Calculate the totalAmount for this date (sum of totalAmountInArray)
  this.totalAmount = this.totalAmountInArray;

  next();
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
