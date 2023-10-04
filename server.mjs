import express from "express";
import cors from "cors";
import "./loadEnvironment.mjs";
import connectDb from "./db/dbConnection.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import categoryRoutes from "./routes/categoryRoutes.mjs";
import expensesRoutes from "./routes/expensesRoutes.mjs";
import budgetRoutes from "./routes/budgetRoutes.mjs";
const PORT = process.env.PORT || 5050;
const app = express();

connectDb();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes, categoryRoutes, expensesRoutes, budgetRoutes);
// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
