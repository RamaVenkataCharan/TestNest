import { useEffect, useState } from "react";

import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  MenuItem,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";

import { getExams } from "../../services/examService";

import {
  getAdminQuestionsByExam,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../services/questionService";


function QuestionManagement() {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [selectedExam, setSelectedExam] = useState("");

  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "",
  });


  // Load Exams
  const loadExams = async () => {
    try {
      const data = await getExams();
      setExams(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load exams.");
    }
  };


  useEffect(() => {
    loadExams();
  }, []);


  // Load questions for selected exam
  const loadQuestions = async (examId) => {
    if (!examId) {
      setQuestions([]);
      return;
    }

    try {
      setLoading(true);

      const data = await getAdminQuestionsByExam(examId);

      setQuestions(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };


  const handleExamChange = (event) => {
    const examId = event.target.value;

    setSelectedExam(examId);

    clearForm();

    loadQuestions(examId);
  };


  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };


  const clearForm = () => {
    setForm({
      question: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "",
    });

    setEditingId(null);
  };


  // Create / Update Question
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedExam) {
      alert("Please select an exam.");
      return;
    }

    try {
      if (editingId) {
        const updateData = {
          question: form.question,
          option_a: form.option_a,
          option_b: form.option_b,
          option_c: form.option_c,
          option_d: form.option_d,
          correct_answer: form.correct_answer,
        };

        await updateQuestion(
          editingId,
          updateData
        );

        alert("Question updated successfully.");
      } else {
        const questionData = {
          exam_id: Number(selectedExam),
          question: form.question,
          option_a: form.option_a,
          option_b: form.option_b,
          option_c: form.option_c,
          option_d: form.option_d,
          correct_answer: form.correct_answer,
        };

        await createQuestion(questionData);

        alert("Question added successfully.");
      }

      clearForm();

      await loadQuestions(selectedExam);

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
        "Failed to save question."
      );
    }
  };


  // Edit
  const handleEdit = (question) => {
    setEditingId(question.id);

    setForm({
      question: question.question || "",
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
      correct_answer:
        question.correct_answer || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // Delete
  const handleDelete = async (questionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteQuestion(questionId);

      alert("Question deleted successfully.");

      await loadQuestions(selectedExam);

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
        "Failed to delete question."
      );
    }
  };


  return (
    <Container sx={{ mt: 4, mb: 5 }}>

      <Typography
        variant="h4"
        sx={{ mb: 3 }}
      >
        Question Management
      </Typography>


      {/* Select Exam */}

      <Paper sx={{ p: 3, mb: 3 }}>

        <Typography
          variant="h6"
          sx={{ mb: 2 }}
        >
          Select Exam
        </Typography>

        <TextField
          select
          fullWidth
          label="Exam"
          value={selectedExam}
          onChange={handleExamChange}
        >
          {exams.map((exam) => (
            <MenuItem
              key={exam.id}
              value={exam.id}
            >
              {exam.title} - {exam.subject}
            </MenuItem>
          ))}
        </TextField>

      </Paper>


      {/* Question Form */}

      {selectedExam && (
        <Paper sx={{ p: 3, mb: 4 }}>

          <Typography
            variant="h6"
            sx={{ mb: 2 }}
          >
            {editingId
              ? "Edit Question"
              : "Add New Question"}
          </Typography>


          <Box
            component="form"
            onSubmit={handleSubmit}
          >

            <TextField
              fullWidth
              label="Question"
              name="question"
              value={form.question}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={2}
              required
            />


            <TextField
              fullWidth
              label="Option A"
              name="option_a"
              value={form.option_a}
              onChange={handleChange}
              margin="normal"
              required
            />


            <TextField
              fullWidth
              label="Option B"
              name="option_b"
              value={form.option_b}
              onChange={handleChange}
              margin="normal"
              required
            />


            <TextField
              fullWidth
              label="Option C"
              name="option_c"
              value={form.option_c}
              onChange={handleChange}
              margin="normal"
              required
            />


            <TextField
              fullWidth
              label="Option D"
              name="option_d"
              value={form.option_d}
              onChange={handleChange}
              margin="normal"
              required
            />


            <TextField
              select
              fullWidth
              label="Correct Answer"
              name="correct_answer"
              value={form.correct_answer}
              onChange={handleChange}
              margin="normal"
              required
            >
              <MenuItem value="A">
                A
              </MenuItem>

              <MenuItem value="B">
                B
              </MenuItem>

              <MenuItem value="C">
                C
              </MenuItem>

              <MenuItem value="D">
                D
              </MenuItem>
            </TextField>


            <Box sx={{ mt: 2 }}>

              <Button
                type="submit"
                variant="contained"
              >
                {editingId
                  ? "Update Question"
                  : "Add Question"}
              </Button>


              {editingId && (
                <Button
                  variant="outlined"
                  sx={{ ml: 2 }}
                  onClick={clearForm}
                >
                  Cancel
                </Button>
              )}

            </Box>

          </Box>

        </Paper>
      )}


      {/* Question List */}

      {selectedExam && (
        <>
          <Typography
            variant="h5"
            sx={{ mb: 2 }}
          >
            Questions ({questions.length})
          </Typography>


          {loading ? (
            <Box
              sx={{
                textAlign: "center",
                mt: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : questions.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>
                No questions added for this exam.
              </Typography>
            </Paper>
          ) : (
            questions.map((q, index) => (

              <Paper
                key={q.id}
                sx={{
                  p: 3,
                  mb: 2,
                }}
              >

                <Typography
                  variant="h6"
                  sx={{ mb: 2 }}
                >
                  {index + 1}. {q.question}
                </Typography>


                <Typography sx={{ mb: 1 }}>
                  A. {q.option_a}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  B. {q.option_b}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  C. {q.option_c}
                </Typography>

                <Typography sx={{ mb: 1 }}>
                  D. {q.option_d}
                </Typography>


                <Divider sx={{ my: 2 }} />


                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >

                  <Typography>
                    Correct Answer:
                  </Typography>

                  <Chip
                    label={q.correct_answer}
                    color="success"
                  />

                </Box>


                <Box sx={{ mt: 2 }}>

                  <Button
                    variant="contained"
                    onClick={() =>
                      handleEdit(q)
                    }
                  >
                    Edit
                  </Button>


                  <Button
                    variant="contained"
                    color="error"
                    sx={{ ml: 2 }}
                    onClick={() =>
                      handleDelete(q.id)
                    }
                  >
                    Delete
                  </Button>

                </Box>

              </Paper>

            ))
          )}

        </>
      )}

    </Container>
  );
}


export default QuestionManagement;