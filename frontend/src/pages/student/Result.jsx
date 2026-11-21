import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Box,
  Chip,
  Divider,
} from "@mui/material";

import {
  getResult,
  getReview,
} from "../../services/examAttemptService";

function Result() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [review, setReview] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      const resultData = await getResult(attemptId);
      setResult(resultData);
  
      const reviewData = await getReview(attemptId);
      setReview(reviewData);
  
    } catch (error) {
      console.error(error);
      alert("Failed to load result.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container
        sx={{
          mt: 5,
          textAlign: "center",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (!result) {
    return (
      <Container sx={{ mt: 5 }}>
        <Typography variant="h6">
          Result not found.
        </Typography>
      </Container>
    );
  }

  const totalQuestions = review.length;

  const percentage =
    totalQuestions > 0
      ? ((result.score / totalQuestions) * 100).toFixed(0)
      : 0;

  const passed = percentage >= 40;

  return (
    <Container
      maxWidth="md"
      sx={{ mt: 5, mb: 5 }}
    >
      <Paper
        elevation={4}
        sx={{ p: 4 }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
        >
          Exam Result
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6">
          Attempt ID: {result.id}
        </Typography>

        <Typography variant="h6">
          Exam ID: {result.exam_id}
        </Typography>

        <Typography variant="h6">
          Score: {result.score} / {totalQuestions}
        </Typography>

        <Typography
          variant="h6"
          sx={{ mt: 2 }}
        >
          Percentage: {percentage}%
        </Typography>

        <Box
          sx={{
            mt: 3,
            mb: 3,
            textAlign: "center",
          }}
        >
          <Chip
            label={passed ? "PASS" : "FAIL"}
            color={passed ? "success" : "error"}
            sx={{
              fontSize: 18,
              p: 2,
            }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography
          variant="h5"
          gutterBottom
        >
          Answer Review
        </Typography>

        {review.length === 0 ? (
          <Typography>
            No answers available.
          </Typography>
        ) : (
          review.map((item, index) => (
            <Paper
              key={index}
              elevation={2}
              sx={{
                p: 2,
                mb: 2,
              }}
            >
              <Typography
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                Q{index + 1}. {item.question}
              </Typography>

              <Typography>
                <strong>Your Answer:</strong>{" "}
                {item.selected_answer}
              </Typography>

              <Typography>
                <strong>Correct Answer:</strong>{" "}
                {item.correct_answer}
              </Typography>

              <Chip
                sx={{ mt: 2 }}
                label={
                  item.is_correct
                    ? "Correct"
                    : "Incorrect"
                }
                color={
                  item.is_correct
                    ? "success"
                    : "error"
                }
              />
            </Paper>
          ))
        )}

        <Box
          sx={{
            mt: 4,
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() =>
              navigate("/student/dashboard")
            }
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Result;