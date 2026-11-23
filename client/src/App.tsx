import Accounts from "./controller/Accounts";
import ProfileApprovals from "./controller/ProfileApprovals";
import Payslips from "./page/Payslips";
import LeaveRequests from "./controller/LeaveRequests";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./page/Login";
import Attendance from "./page/Attendance";
import Profile from "./page/Profile";
import { Toaster } from "react-hot-toast";

import Dashboard from "./controller/Dashboard";
import Employees from "./controller/Employees";
import EmployeesSearch from "./controller/EmployeesList";
import EditEmployee from "./controller/EditEmployees";
import Salary from "./controller/Salary";
import AttendancePage from "./controller/Attendance";
import Payroll from "./controller/Payroll";
import Configuration from "./controller/Configuration";
// =====================================
// PRIVATE ROUTE
// =====================================

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--color-brand-navy)",
            color: "#fff",
            borderRadius: "8px",
          },
        }}
      />
      <Routes>
        {/* ===================================== */}
        {/* LOGIN */}
        {/* ===================================== */}

        <Route path="/" element={<Login />} />

        {/* ===================================== */}
        {/* ADMIN */}
        {/* ===================================== */}

        {/* dashboard */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* add employee */}
        <Route
          path="/admin/employees/add"
          element={
            <PrivateRoute>
              <Employees />
            </PrivateRoute>
          }
        />

        {/* employee list */}
        <Route
          path="/admin/employees/list"
          element={
            <PrivateRoute>
              <EmployeesSearch />
            </PrivateRoute>
          }
        />

        {/* edit employee */}
        <Route
          path="/admin/employees/edit/:code"
          element={
            <PrivateRoute>
              <EditEmployee />
            </PrivateRoute>
          }
        />

        {/* attendance management */}
        <Route
          path="/admin/attendance"
          element={
            <PrivateRoute>
              <AttendancePage />
            </PrivateRoute>
          }
        />

        {/* salary */}
        <Route
          path="/admin/salary"
          element={
            <PrivateRoute>
              <Salary />
            </PrivateRoute>
          }
        />
        {/* payroll */}
        <Route path="/admin/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
        <Route path="/admin/profile-requests" element={<PrivateRoute><ProfileApprovals /></PrivateRoute>} />
        <Route path="/admin/leave" element={<PrivateRoute><LeaveRequests /></PrivateRoute>} />

        <Route
          path="/admin/configuration"
          element={<PrivateRoute><Configuration /></PrivateRoute>}
        />
        <Route
          path="/admin/payroll"
          element={
            <PrivateRoute>
              <Payroll />
            </PrivateRoute>
          }
        />

        {/* ===================================== */}
        {/* USER */}
        {/* ===================================== */}

        {/* attendance */}
        <Route
          path="/user"
          element={
            <PrivateRoute>
              <Attendance />
            </PrivateRoute>
          }
        />

        <Route path="/user/payslips" element={<PrivateRoute><Payslips /></PrivateRoute>} />

        {/* profile */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* ===================================== */}
        {/* 404 */}
        {/* ===================================== */}

        <Route
          path="*"
          element={
            <h1 className="text-3xl font-bold text-center mt-10">
              404 Not Found
            </h1>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
