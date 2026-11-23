import { listAccounts, setAccountPassword, resetAccountPassword } from "../controllers/accounts.controller.js";
import { login, logout, requireRole } from "../controllers/session.controller.js";
import { myIdentity, myProfile, submitProfileRequest, withdrawProfileRequest, listProfileRequests, decideProfileRequest } from "../controllers/employeePortal.controller.js";
import { myPayslips, sendPayroll } from "../controllers/payrollDelivery.controller.js";
import express from "express";
import editController from "../controllers/edit.controller.js";

import employeeController from "../controllers/employee.controller.js";
import { getEmployeeCatalog, updateEmployeeCatalog } from "../controllers/employeeCatalog.controller.js";
import listController from "../controllers/list.controller.js";
import {
  generatePayroll,
  getPayrolls,
} from "../controllers/payroll.controller.js";
import { getDashboard } from "../controllers/Dashboard.controller.js";

import {
  getAttendances,
  getMyAttendance,
  getAttendanceByDate,
  getLeaveRequests,
  requestLeave,
  checkIn,
  checkOut,
  approveLeave,
  rejectLeave,
} from "../controllers/attendance.controller.js";

const router = express.Router();

const initEmployeeRoutes = (app) => {
  const employee = requireRole("user");
  const admin = requireRole("admin");
  const ownAttendance = (req, res, next) => {
    const id = req.params.employee_id ?? req.body?.employee_id;
    if (String(id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Chỉ được truy cập chấm công của mình." });
    }
    return next();
  };

  // =====================================
  // EMPLOYEE
  // =====================================

  router.post("/api/create-employee", admin, employeeController.createEmployee);
  router.get("/api/employees/next-code", admin, employeeController.getNextEmployeeCode);
  router.get("/api/employee-catalog", admin, getEmployeeCatalog);
  router.post("/api/employee-catalog/:kind", admin, updateEmployeeCatalog);
  router.put("/api/employee-catalog/:kind/:id", admin, updateEmployeeCatalog);
  router.delete("/api/employee-catalog/:kind/:id", admin, updateEmployeeCatalog);

  router.get("/api/admin/accounts", admin, listAccounts);
  router.put("/api/admin/accounts/:code/password", admin, setAccountPassword);
  router.get("/api/get-employees", admin, listController.getEmployees);
  /// update employee
  router.get(
    "/api/get-employee-by-code/:code",
    admin, editController.getEmployeeByCode,
  );

  router.put("/api/update-employee/:code", admin, editController.updateEmployee);

  router.put("/api/reset-password/:code", admin, resetAccountPassword);
  router.delete("/api/delete-employee/:id", admin, editController.deleteEmployee);

  // =====================================
  // DASHBOARD
  // =====================================

  router.get("/api/dashboard", admin, getDashboard);

  // =====================================
  // ATTENDANCE
  // =====================================

  // get all attendance
  router.get("/api/attendance", admin, getAttendances);
  // get my attendance today
  router.get("/api/attendance/my/:employee_id", employee, ownAttendance, getMyAttendance);

  router.get("/api/attendance/history/:employee_id", employee, ownAttendance, getAttendanceByDate);
  router.get("/api/attendance/leave", admin, getLeaveRequests);
  router.get("/api/attendance/leave/my/:employee_id", employee, ownAttendance, getLeaveRequests);
  router.post("/api/attendance/leave", employee, ownAttendance, requestLeave);

  // check in
  router.post("/api/attendance/checkin", employee, ownAttendance, checkIn);

  // check out
  router.post("/api/attendance/checkout", employee, ownAttendance, checkOut);
  // approve leave
  router.put("/api/attendance/approve/:id", admin, approveLeave);

  // reject leave
  router.put("/api/attendance/reject/:id", admin, rejectLeave);
  router.post("/api/session", login);
  router.delete("/api/session", logout);
  router.get("/api/me/identity", employee, myIdentity);
  router.get("/api/me/profile", employee, myProfile);
  router.post("/api/me/profile/requests", employee, submitProfileRequest);
  router.put("/api/me/profile/requests/:id/withdraw", employee, withdrawProfileRequest);
  router.get("/api/me/payslips", employee, myPayslips);
  router.get("/api/admin/profile-requests", admin, listProfileRequests);
  router.put("/api/admin/profile-requests/:id", admin, decideProfileRequest);
  /// payroll
  router.post("/api/payroll/generate", admin, generatePayroll);
  router.get("/api/payrolls", admin, getPayrolls);
  router.post("/api/payrolls/:id/send", admin, sendPayroll);
  return app.use("/", router);
};

export default initEmployeeRoutes;
