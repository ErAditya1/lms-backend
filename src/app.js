import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http"; // To create an HTTP server
import { Server }  from "socket.io"; // Add this



const app = express();
const httpServer = createServer(app);

global.onlineUsers = new Map();

const io = new Server(httpServer, {
  // pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN === "*"
    ? "*" 
    : process.env.CORS_ORIGIN?.split(","),
    
    credentials: true,
  },
});



app.set('io',io)



// global middlewares
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*" // This might give CORS error for some origins due to credentials set to true
        : process.env.CORS_ORIGIN?.split(","), // For multiple cors origin for production. Refer https://github.com/hiteshchoudhary/apihub/blob/a846abd7a0795054f48c7eb3e71f3af36478fa96/.env.sample#L12C1-L12C12
    credentials: true,
  })
);


app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());
 

// routes
 import userRouter from "./routes/user.routes.js";
 import postRouter from "./routes/post.routes.js";
 import likeRouter from "./routes/like.routes.js";
 import commentRouter from "./routes/comment.routes.js";
 import coursesRouter from "./routes/course.routes.js";
 import videoRouter from "./routes/video.routes.js"
 import paymentsRouter from "./routes/payment.routes.js";


import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import { initializeSocketIO } from "./socket/index.js";


//routes declaration



app.use("/api/v1/users",userRouter);
app.use("/api/v1/posts",postRouter)
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/courses", coursesRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/payment", paymentsRouter);

app.use("/api/v1/chat-app/chats", chatRouter);
app.use("/api/v1/chat-app/messages", messageRouter);

initializeSocketIO(io);

import { errorHandler } from "./middelwares/error.middelware.js";

app.use(errorHandler);


export { httpServer };
