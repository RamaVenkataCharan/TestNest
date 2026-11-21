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


function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const handleLogin = async (event) => {

    event.preventDefault();

    try {

      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);


      const response = await api.post(
        "/users/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );


      const token =
        response.data.access_token;


      localStorage.setItem(
        "token",
        token
      );


      // Decode JWT payload
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );
      
      console.log("JWT PAYLOAD:", payload);
      
      localStorage.setItem(
        "user",
        JSON.stringify(payload)
      );
      
      if (payload.role?.toLowerCase() === "admin") {
        navigate("/admin/dashboard");
      } else if (payload.role?.toLowerCase() === "student") {
        navigate("/student/dashboard");
      } else {
        alert("Invalid user role: " + payload.role);
      }
    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.detail ||
        "Invalid email or password."
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
          Login
        </Typography>


        <Box
          component="form"
          onSubmit={handleLogin}
        >

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            margin="normal"
            required
          />


          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            margin="normal"
            required
          />


          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
          >
            Login
          </Button>


          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            onClick={() =>
              navigate("/register")
            }
          >
            Don't have an account? Register
          </Button>

        </Box>

      </Paper>

    </Container>

  );

}


export default Login;