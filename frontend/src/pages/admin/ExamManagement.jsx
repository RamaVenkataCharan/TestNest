import { useEffect, useState } from "react";

import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";

import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
} from "../../services/examService";


function ExamManagement() {

  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    duration: "",
    total_marks: "",
  });


  const loadExams = async () => {

    try {

      const data = await getExams();

      setExams(data);

    } catch (error) {

      console.error(error);

      alert("Failed to load exams.");

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    loadExams();

  }, []);


  const handleChange = (event) => {

    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

  };


  const clearForm = () => {

    setForm({
      title: "",
      subject: "",
      description: "",
      duration: "",
      total_marks: "",
    });

    setEditingId(null);

  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      const examData = {
        title: form.title,
        subject: form.subject,
        description: form.description,
        duration: Number(form.duration),
        total_marks: Number(form.total_marks),
      };


      if (editingId) {

        await updateExam(
          editingId,
          examData
        );

        alert("Exam updated successfully.");

      } else {

        await createExam(examData);

        alert("Exam created successfully.");

      }


      clearForm();

      loadExams();

    } catch (error) {

      console.error(error);

      alert("Failed to save exam.");

    }

  };


  const handleEdit = (exam) => {

    setEditingId(exam.id);

    setForm({
      title: exam.title || "",
      subject: exam.subject || "",
      description: exam.description || "",
      duration: exam.duration || "",
      total_marks: exam.total_marks || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this exam?"
    );

    if (!confirmDelete) return;


    try {

      await deleteExam(id);

      alert("Exam deleted successfully.");

      loadExams();

    } catch (error) {

      console.error(error);

      alert("Failed to delete exam.");

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


  return (

    <Container sx={{ mt: 4, mb: 5 }}>

      <Typography
        variant="h4"
        sx={{ mb: 3 }}
      >
        Exam Management
      </Typography>


      {/* Exam Form */}

      <Paper sx={{ p: 3, mb: 4 }}>

        <Typography
          variant="h6"
          sx={{ mb: 2 }}
        >
          {editingId
            ? "Edit Exam"
            : "Create New Exam"}
        </Typography>


        <Box
          component="form"
          onSubmit={handleSubmit}
        >

          <TextField
            fullWidth
            label="Exam Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            margin="normal"
            required
          />


          <TextField
            fullWidth
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            margin="normal"
            required
          />


          <TextField
            fullWidth
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />


          <TextField
            fullWidth
            label="Duration (minutes)"
            name="duration"
            type="number"
            value={form.duration}
            onChange={handleChange}
            margin="normal"
            required
          />


          <TextField
            fullWidth
            label="Total Marks"
            name="total_marks"
            type="number"
            value={form.total_marks}
            onChange={handleChange}
            margin="normal"
            required
          />


          <Box sx={{ mt: 2 }}>

            <Button
              type="submit"
              variant="contained"
            >
              {editingId
                ? "Update Exam"
                : "Create Exam"}
            </Button>


            {editingId && (

              <Button
                sx={{ ml: 2 }}
                variant="outlined"
                onClick={clearForm}
              >
                Cancel
              </Button>

            )}

          </Box>

        </Box>

      </Paper>


      {/* Exam List */}

      <Typography
        variant="h5"
        sx={{ mb: 2 }}
      >
        Existing Exams
      </Typography>


      {exams.length === 0 ? (

        <Paper sx={{ p: 3 }}>

          <Typography>
            No exams found.
          </Typography>

        </Paper>

      ) : (

        exams.map((exam) => (

          <Paper
            key={exam.id}
            sx={{
              p: 3,
              mb: 2,
            }}
          >

            <Typography variant="h6">
              {exam.title}
            </Typography>

            <Typography>
              Subject: {exam.subject}
            </Typography>

            <Typography>
              Description: {exam.description}
            </Typography>

            <Typography>
              Duration: {exam.duration} minutes
            </Typography>

            <Typography>
              Total Marks: {exam.total_marks}
            </Typography>


            <Box sx={{ mt: 2 }}>

              <Button
                variant="contained"
                onClick={() =>
                  handleEdit(exam)
                }
              >
                Edit
              </Button>


              <Button
                sx={{ ml: 2 }}
                variant="contained"
                color="error"
                onClick={() =>
                  handleDelete(exam.id)
                }
              >
                Delete
              </Button>

            </Box>

          </Paper>

        ))

      )}

    </Container>

  );

}


export default ExamManagement;