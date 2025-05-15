require("dotenv").config({ path: "./Config/config.env" });
const express = require("express");
const app = express();
const mongoose = require("mongoose");

// Import routes
const campaignRouter = require("./Routes/campaigns");
const authRouter = require("./Routes/auth");
const userRouter = require("./Routes/user");
const utilRouter = require("./Routes/util");
const donateRouter = require("./Routes/donate");
const transactionRouter = require("./Routes/transaction");
const reportRouter = require("./Routes/report");
const setupChangeStreams = require("./Services/changeStream");

const notificationRouter = require("./Routes/NotificationRoutes"); // New
const testimonialRouter = require("./Routes/testimonial");

const releaseRouter = require("./Routes/release");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("colors");

// Connect to MongoDB
const connectDB = require("./Config/db");
const morgan = require("morgan");
const errorHandler = require("./Middleware/error");

// Connect to DB and setup change streams
connectDB().then(() => {
  setupChangeStreams(mongoose.connection);
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
  })
);

// Routes
app.use("/api/campaigns", campaignRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/util", utilRouter);
app.use("/api/donate", donateRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/reports", reportRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/release", releaseRouter);
app.use("/api/testimonial", testimonialRouter);

app.use(errorHandler);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is live on port ${port}`.cyan);
});
