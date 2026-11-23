import express from "express";
import cors from "cors";
import initEmployeeRoutes from "./routers/employee.router.js";

const app = express();

const frontendOrigins = (process.env.ATTENDANCE_FRONTEND_ORIGINS ??
  "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174")
  .split(",").map(origin => origin.trim());
app.use(cors({ origin: frontendOrigins }));
app.use("/api/create-employee", express.json({ limit: "1500kb" }));
app.use("/api/update-employee", express.json({ limit: "1500kb" }));
app.use("/api/me/profile/requests", express.json({ limit: "720kb" }));
app.use(express.json());

// gọi trực tiếp
initEmployeeRoutes(app);

app.listen(5000, () => {
  console.log("Server chạy tại http://localhost:5000");
});
