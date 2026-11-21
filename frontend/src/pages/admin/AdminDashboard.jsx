import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import { logout } from "../../services/authService";
import { getDashboardStats, getRecentAttempts } from "../../services/dashboardService";
import { getAIStatus } from "../../services/aiStatusService";
import {
  connectWebSocket,
  disconnectWebSocket,
} from "../../services/websocketService";

import { getAnalytics } from "../../services/analyticsService";
import { getAdvancedAnalytics } from "../../services/advancedAnalyticsService";

import { downloadExamPDF } from "../../services/pdfReportService";
import { downloadAIEventPDF } from "../../services/aiEventReportService";

function AdminDashboard() {
  const navigate = useNavigate();

  const storedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );
  
  const email = storedUser.sub || "";
  const role = storedUser.role || "";

  const COLORS = [
    "#1976d2",
    "#2e7d32",
    "#ef5350",
    "#ff9800",
    "#8e24aa",
  ];

  // ---------------- Dashboard Stats ----------------

  const [stats, setStats] = useState({
    total_users: 0,
    total_students: 0,
    total_admins: 0,
    total_exams: 0,
    total_questions: 0,
    total_attempts: 0,
  });

  // ---------------- Live AI Status ----------------

  const [aiStatus, setAIStatus] = useState({
    face_count: 0,
    eye_status: "No Data",
    head_status: "No Data",
    phone_detected: false,
    suspicious_score: 0,
    latest_event: "No Events",
  });

  // ---------------- Analytics ----------------

  const [analytics, setAnalytics] = useState({
    total_events: 0,
    total_points: 0,
    risk_level: "Low",
    events: [],
  });

  // ---------------- Advanced Analytics ----------------

  const [advancedAnalytics, setAdvancedAnalytics] = useState([]);

  // ---------------- Recent Attempts ----------------

  const [recentAttempts, setRecentAttempts] = useState([]);

  // ---------------- Search & Filter ----------------

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  // ===================================================
  // API LOADERS
  // ===================================================

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAIStatus = async () => {
    try {
      const data = await getAIStatus();
      setAIStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdvancedAnalytics = async () => {
    try {
      const data = await getAdvancedAnalytics();
      setAdvancedAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRecentAttempts = async () => {
    try {
      const data = await getRecentAttempts();
      setRecentAttempts(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ===================================================
  // PDF DOWNLOADS
  // ===================================================

  const handleDownloadExamPDF = async (attemptId) => {
    try {
      await downloadExamPDF(attemptId);
    } catch (err) {
      console.error(err);
      alert("Unable to download Exam Report.");
    }
  };

  const handleDownloadAIEventPDF = async (attemptId) => {
    try {
      await downloadAIEventPDF(attemptId);
    } catch (err) {
      console.error(err);
  
      if (err.response?.status === 404) {
        alert("No AI events were recorded for this exam attempt.");
      } else {
        alert("Unable to download AI Report.");
      }
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadStats();
    loadAIStatus();
    loadAnalytics();
    loadAdvancedAnalytics();
    loadRecentAttempts();

    connectWebSocket((message) => {
      setAIStatus({
        face_count: message.face_count,
        eye_status: message.eye_status,
        head_status: message.head_status,
        phone_detected: message.phone_detected,
        suspicious_score: message.suspicious_score,
        latest_event: message.latest_event,
      });
    });

    return () => disconnectWebSocket();
  }, []);

  // ===================================================
  // CHART DATA
  // ===================================================

  const eventData = (analytics?.events || []).map((event) => ({
    name: event.event,
    count: event.count,
    points: event.points,
  }));

  const riskData = [
    {
      name: "Low",
      value: (advancedAnalytics || []).filter(
        (x) => x.risk_level === "Low"
      ).length,
    },
    {
      name: "Medium",
      value: (advancedAnalytics || []).filter(
        (x) => x.risk_level === "Medium"
      ).length,
    },
    {
      name: "High",
      value: (advancedAnalytics || []).filter(
        (x) => x.risk_level === "High"
      ).length,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
  
      {/* =========================
           HEADER
      ========================== */}
  
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            AI Exam Proctoring Admin Dashboard
          </Typography>
  
          <Typography color="text.secondary">
            Welcome, {email}
          </Typography>
  
          <Typography color="primary">
            Role : {role}
          </Typography>
        </Box>
      </Box>
  
      {/* =========================
          DASHBOARD STATISTICS
      ========================== */}
  
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mb: 2 }}
      >
        Dashboard Statistics
      </Typography>
  
      <Grid container spacing={3}>
  
        {[
          {
            title: "Total Users",
            value: stats.total_users,
          },
          {
            title: "Students",
            value: stats.total_students,
          },
          {
            title: "Administrators",
            value: stats.total_admins,
          },
          {
            title: "Total Exams",
            value: stats.total_exams,
          },
          {
            title: "Questions",
            value: stats.total_questions,
          },
          {
            title: "Exam Attempts",
            value: stats.total_attempts,
          },
        ].map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.title}>
            <Card elevation={5}>
              <CardContent>
  
                <Typography
                  variant="h3"
                  align="center"
                  fontWeight="bold"
                >
                  {card.value}
                </Typography>
  
                <Typography
                  variant="h6"
                  align="center"
                  mt={1}
                >
                  {card.title}
                </Typography>
  
              </CardContent>
            </Card>
          </Grid>
        ))}
  
      </Grid>
  
      {/* =========================
          LIVE AI MONITORING
      ========================== */}
  
      <Typography
        variant="h5"
        sx={{ mt: 6, mb: 2 }}
      >
        Live AI Monitoring
      </Typography>
  
      <Grid container spacing={3}>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor:
                aiStatus.face_count > 1
                  ? "#ffebee"
                  : "#e8f5e9",
            }}
          >
            <CardContent>
  
              <Typography variant="h6">
                Face Count
              </Typography>
  
              <Typography variant="h3">
                {aiStatus.face_count ?? 0}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor:
                aiStatus.eye_status === "Looking Away"
                  ? "#fff3e0"
                  : "#e8f5e9",
            }}
          >
            <CardContent>
  
              <Typography variant="h6">
                Eye Status
              </Typography>
  
              <Typography variant="h5">
                {aiStatus.eye_status || "No Data"}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor:
                aiStatus.head_status !== "Straight"
                  ? "#fff3e0"
                  : "#e8f5e9",
            }}
          >
            <CardContent>
  
              <Typography variant="h6">
                Head Status
              </Typography>
  
              <Typography variant="h5">
                {aiStatus.head_status || "No Data"}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor:
                aiStatus.phone_detected
                  ? "#ffebee"
                  : "#e8f5e9",
            }}
          >
            <CardContent>
  
              <Typography variant="h6">
                Phone Detected
              </Typography>
  
              <Typography variant="h4">
                {aiStatus.phone_detected ? "YES" : "NO"}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              bgcolor:
                aiStatus.suspicious_score >= 80
                  ? "#ffebee"
                  : aiStatus.suspicious_score >= 40
                  ? "#fff3e0"
                  : "#e8f5e9",
            }}
          >
            <CardContent>
  
              <Typography variant="h6">
                Suspicious Score
              </Typography>
  
              <Typography variant="h3">
                {aiStatus.suspicious_score ?? 0}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
  
              <Typography variant="h6">
                Latest Event
              </Typography>
  
              <Typography variant="body1">
                {aiStatus.latest_event || "No Events"}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>

        {analytics.events?.map((event) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 4 }}
            key={event.event}
          >
            <Card
              elevation={4}
              sx={{ height: "100%" }}
            >
              <CardContent>

                <Typography variant="h6">
                  {event.event}
                </Typography>

                <Typography
                  variant="h3"
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  {event.count}
                </Typography>

              </CardContent>
            </Card>
          </Grid>
        ))}
  
      </Grid>
  
      {/* =========================
          AI SUMMARY
      ========================== */}
  
      <Typography
        variant="h5"
        sx={{ mt: 6, mb: 2 }}
      >
        AI Analytics Summary
      </Typography>
  
      <Grid container spacing={3}>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={4}>
            <CardContent>
  
              <Typography variant="h6">
                Total AI Events
              </Typography>
  
              <Typography variant="h3">
                {analytics.total_events}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={4}>
            <CardContent>
  
              <Typography variant="h6">
                Suspicious Points
              </Typography>
  
              <Typography variant="h3">
                {analytics.total_points}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>
  
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={4}>
            <CardContent>
  
              <Typography variant="h6">
                Overall Risk
              </Typography>
  
              <Typography
                variant="h3"
                color={
                  analytics.risk_level === "High"
                    ? "error"
                    : analytics.risk_level === "Medium"
                    ? "warning.main"
                    : "success.main"
                }
              >
                {analytics.risk_level}
              </Typography>
  
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Event Analytics
              </Typography>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={eventData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />
                  <Legend />

                  <Bar
                    dataKey="points"
                    fill="#1976d2"
                    name="Suspicious Points"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
  
      </Grid>

      {/* =======================================================
          AI CHARTS
      ======================================================= */}

      <Typography
        variant="h5"
        sx={{ mt: 6, mb: 2 }}
      >
        AI Analytics Charts
      </Typography>

      <Grid container spacing={3}>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={4}>
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                AI Event Points
              </Typography>

              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <BarChart data={eventData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="points"
                    fill="#1976d2"
                  />

                </BarChart>
              </ResponsiveContainer>

            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={4}>
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                Risk Distribution
              </Typography>

              <ResponsiveContainer
                width="100%"
                height={320}
              >
                <PieChart>

                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {riskData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>
              </ResponsiveContainer>

            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* =======================================================
          RECENT AI EVENTS
      ======================================================= */}

      <Box sx={{ mt: 6 }}>

        <Typography
          variant="h5"
          gutterBottom
        >
          Recent AI Events
        </Typography>

        <TableContainer component={Paper}>

          <Table>

            <TableHead>

              <TableRow>

                <TableCell>
                  Attempt ID
                </TableCell>

                <TableCell>
                  Student ID
                </TableCell>

                <TableCell>
                  Exam ID
                </TableCell>

                <TableCell>
                  Score
                </TableCell>

                <TableCell>
                  Submitted
                </TableCell>

                <TableCell align="center">
                  AI Report
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {recentAttempts.map((attempt) => (

                <TableRow
                  key={attempt.attempt_id}
                >

                  <TableCell>
                    {attempt.attempt_id}
                  </TableCell>

                  <TableCell>
                    {attempt.student_id}
                  </TableCell>

                  <TableCell>
                    {attempt.exam_id}
                  </TableCell>

                  <TableCell>
                    {attempt.score}
                  </TableCell>

                  <TableCell>
                    {new Date(
                      attempt.submitted_at
                    ).toLocaleString()}
                  </TableCell>

                  <TableCell align="center">

                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() =>
                        handleDownloadAIEventPDF(
                          attempt.attempt_id
                        )
                      }
                    >
                      Download PDF
                    </Button>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </TableContainer>

      </Box>

      {/* =======================================================
          RECENT EXAM ATTEMPTS
      ======================================================= */}

      <Box sx={{ mt: 6 }}>

        <Typography
          variant="h5"
          gutterBottom
        >
          Recent Exam Attempts
        </Typography>

        <TableContainer component={Paper}>

          <Table>

            <TableHead>

              <TableRow>

                <TableCell>
                  Attempt ID
                </TableCell>

                <TableCell>
                  Student ID
                </TableCell>

                <TableCell>
                  Exam ID
                </TableCell>

                <TableCell>
                  Score
                </TableCell>

                <TableCell>
                  Submitted
                </TableCell>

                <TableCell align="center">
                  Exam Report
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {recentAttempts.map((attempt) => (

                <TableRow
                  key={attempt.attempt_id}
                >

                  <TableCell>
                    {attempt.attempt_id}
                  </TableCell>

                  <TableCell>
                    {attempt.student_id}
                  </TableCell>

                  <TableCell>
                    {attempt.exam_id}
                  </TableCell>

                  <TableCell>
                    {attempt.score}
                  </TableCell>

                  <TableCell>
                    {new Date(
                      attempt.submitted_at
                    ).toLocaleString()}
                  </TableCell>

                  <TableCell align="center">

                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() =>
                        handleDownloadExamPDF(
                          attempt.attempt_id
                        )
                      }
                    >
                      Download PDF
                    </Button>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </TableContainer>

      </Box>

      {/* ================= MANAGEMENT ================= */}

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" gutterBottom>
          Management
        </Typography>

        <Grid container spacing={3}>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={4} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6">
                  User Management
                </Typography>

                <Typography sx={{ mt: 1, mb: 2 }}>
                  Manage students and administrators.
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate("/admin/users")}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={4} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6">
                  Exam Management
                </Typography>

                <Typography sx={{ mt: 1, mb: 2 }}>
                  Create and manage examinations.
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate("/admin/exams")}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={4} sx={{ height: "100%" }}>
              <CardContent>

                <Typography variant="h6">
                  Question Management
                </Typography>

                <Typography sx={{ mt: 1, mb: 2 }}>
                  Add, edit and manage exam questions.
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate("/admin/questions")}
                >
                  Open
                </Button>

              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={4} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6">
                  AI Reports
                </Typography>

                <Typography sx={{ mt: 1, mb: 2 }}>
                  View AI monitoring reports and suspicious activities.
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate("/admin/reports")}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={4} sx={{ height: "100%" }}>
              <CardContent>

                <Typography variant="h6">
                  Student Performance
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  View student marks and performance analytics.
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() =>
                    navigate("/admin/student-performance")
                  }
                >
                  Open
                </Button>

              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={4} sx={{ height: "100%" }}>
              <CardContent>

                <Typography variant="h6">
                  Advanced Analytics
                </Typography>

                <Typography sx={{ mt: 1, mb: 2 }}>
                  View detailed AI analytics for all exam attempts.
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate("/admin/advanced-analytics")}
                >
                  Open
                </Button>

              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Box>

      {/* ================= LOGOUT ================= */}

      <Box
        sx={{
          mt: 6,
          mb: 5,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          color="error"
          size="large"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

    </Container>
  );
}

export default AdminDashboard;   