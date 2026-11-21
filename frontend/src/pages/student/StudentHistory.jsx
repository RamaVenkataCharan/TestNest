import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Button,
} from "@mui/material";

import { getStudentHistory } from "../../services/studentHistoryService";
import { useNavigate } from "react-router-dom";

function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getStudentHistory();
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  if (loading) {
    return (
      <Container sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        My Exam History
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Total Attempts: {history.length}
      </Typography>

      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Attempt ID</TableCell>
              <TableCell>Exam ID</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Submitted At</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {history.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell>{attempt.id}</TableCell>
                <TableCell>{attempt.exam_id}</TableCell>
                <TableCell>{attempt.score}</TableCell>
                <TableCell>
                  {new Date(attempt.submitted_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}

            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No exam history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => navigate("/student/dashboard")}
        >
          Back to Dashboard
        </Button>
    </Container>
  );
}

export default StudentHistory;