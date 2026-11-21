import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from "@mui/material";

import api from "../../services/api";


function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });


  const handleChange = (event) => {

    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

  };


  const handleRegister = async (event) => {

    event.preventDefault();

    try {

      await api.post(
        "/users/register",
        {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: "student",
        }
      );

      alert("Registration successful. Please login.");

      navigate("/login");

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.detail ||
        "Registration failed."
      );

    }

  };


  return (

    <Container
      maxWidth="sm"
      sx={{ mt: 6 }}
    >

      <Paper sx={{ p: 4 }}>

        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 3 }}
        >
          Register
        </Typography>


        <Box
          component="form"
          onSubmit={handleRegister}
        >

          <TextField
            fullWidth
            label="Full Name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            margin="normal"
            required
          />


          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            margin="normal"
            required
          />


          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            margin="normal"
            required
          />


          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
          >
            Register
          </Button>


          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            onClick={() => navigate("/login")}
          >
            Already have an account? Login
          </Button>

        </Box>

      </Paper>

    </Container>

  );

}


export default Register;