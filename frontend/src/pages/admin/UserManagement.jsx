import { useEffect, useState } from "react";

import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  Alert,
} from "@mui/material";

import {
  getUsers,
  deleteUser,
  createAdmin,
} from "../../services/userService";


function UserManagement() {
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");


  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };


  useEffect(() => {
    loadUsers();
  }, []);


  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };


  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    try {
      await createAdmin({
        full_name: form.full_name,
        email: form.email,
        password: form.password,

        // UserCreate may still expect role,
        // but backend forces admin.
        role: "admin",
      });

      setMessage(
        "Admin account created successfully."
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
      });

      await loadUsers();

    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.detail ||
        "Failed to create admin."
      );
    }
  };


  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    try {
      await deleteUser(id);

      await loadUsers();

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
        "Failed to delete user."
      );
    }
  };


  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 6,
      }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ mb: 3 }}
      >
        User Management
      </Typography>


      {/* CREATE ADMIN */}

      <Card
        elevation={3}
        sx={{ mb: 4 }}
      >
        <CardContent>

          <Typography
            variant="h5"
            sx={{ mb: 2 }}
          >
            Create New Admin
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Only an existing administrator can create
            another administrator account.
          </Typography>


          {message && (
            <Alert
              severity={
                message.includes("successfully")
                  ? "success"
                  : "error"
              }
              sx={{ mb: 2 }}
            >
              {message}
            </Alert>
          )}


          <Box
            component="form"
            onSubmit={handleCreateAdmin}
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
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Create Admin
            </Button>
          </Box>

        </CardContent>
      </Card>


      {/* USERS TABLE */}

      <Card elevation={3}>
        <CardContent>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">
              Registered Users
            </Typography>

            <Typography color="text.secondary">
              Total Users: {users.length}
            </Typography>
          </Box>


          <TableContainer component={Paper} variant="outlined">

            <Table>

              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>ID</b>
                  </TableCell>

                  <TableCell>
                    <b>Name</b>
                  </TableCell>

                  <TableCell>
                    <b>Email</b>
                  </TableCell>

                  <TableCell>
                    <b>Role</b>
                  </TableCell>

                  <TableCell align="center">
                    <b>Action</b>
                  </TableCell>
                </TableRow>
              </TableHead>


              <TableBody>

                {users.map((user) => (

                  <TableRow
                    key={user.id}
                    hover
                  >
                    <TableCell>
                      {user.id}
                    </TableCell>

                    <TableCell>
                      {user.full_name}
                    </TableCell>

                    <TableCell>
                      {user.email}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.role}
                        color={
                          user.role === "admin"
                            ? "secondary"
                            : "primary"
                        }
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() =>
                          handleDelete(user.id)
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>

                ))}


                {users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}

              </TableBody>

            </Table>

          </TableContainer>

        </CardContent>
      </Card>

    </Container>
  );
}


export default UserManagement;