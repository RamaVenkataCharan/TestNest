import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box
} from "@mui/material";

import { logout } from "../../services/authService";

function StudentDashboard() {
  const navigate = useNavigate();

  const storedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );
  
  const email = storedUser.sub || "";
  const role = storedUser.role || "";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>

      <Typography color="text.secondary">
        Welcome, {email}
      </Typography>

      <Typography color="primary" gutterBottom>
        Role: {role}
      </Typography>

      <Card sx={{ mt: 4 }}>
        <CardContent>

          <Typography variant="h6">
            Online Examination
          </Typography>

          <Typography sx={{ mt: 1 }}>
            Click below to start your examination.
          </Typography>

          <Box
        sx={{
          display: "flex",
          gap: 2,
          mt: 3,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          sx={{
            width: 200,
            height: 48,
          }}
          onClick={() => navigate("/student/exam")}
        >
          Start Exam
        </Button>

        <Button
          variant="contained"
          color="secondary"
          sx={{
            width: 200,
            height: 48,
          }}
          onClick={() => navigate("/student/history")}
        >
          My Exam History
        </Button>
      </Box>

        </CardContent>
      </Card>

      <Box sx={{ mt: 5 }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
}

export default StudentDashboard;