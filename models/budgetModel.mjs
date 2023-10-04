import mongoose from "mongoose";

const { Schema } = mongoose;

const budgetSchema = new Schema(
  {
    budget: {
      type: Number,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date,
    },
    budgetPerCategory: [
      {
        categoryId: {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
        categoryName: {
          type: String,
        },
        budgetAmount: {
          type: Number,
        },
      },
    ],
    currentBalance: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);
const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
