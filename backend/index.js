import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import connectDB from "./utils/db.js";
import userRoute from "./routes/user_route.js"
import postRoute from "./routes/post_route.js"
import messageRoute from "./routes/messages_route.js"
import { app, server } from "./utils/socket.js";
import callRoute from "./routes/call_route.js";
import notificationRoute from "./routes/notification_route.js";


dotenv.config({});

const PORT = process.env.PORT || 3000;

app.get("/", (req,res) =>{
  return res.status(200).json({
    message:"I m coming from browser",
    success:true
  })
})

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials:true
}
app.use(cors(corsOptions));


app.use("/api/v1/call", callRoute);
app.use("/api/v1/notification", notificationRoute);

// yaha apni api aayengi
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute)




const startServer = async () => {
  try {
    await connectDB(); // wait for DB connection

    server.listen(PORT, () => {
      console.log(`Server listening at port ${PORT}`);
    });

  } catch (error) {
    console.log("Failed to start server:", error);
  }
};

startServer();