import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  FormHelperText,
} from "@mui/material";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/users/create_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === "success") {
        navigate("/login");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error");
    }
  }

  const usernameMaxLength = 25;
  const remainingChars = usernameMaxLength - username.length;

  return (
    <Box
      maxWidth={400}
      mx="auto"
      mt={8}
      p={4}
      borderRadius={2}
      boxShadow={3}
      component="form"
      onSubmit={handleRegister}
    >
      <Stack spacing={2}>
        <Typography variant="h5" align="center">
          Create Account
        </Typography>

        <TextField
          label="Username"
          value={username}
          onChange={(e) => {
            if (e.target.value.length <= usernameMaxLength) {
              setUsername(e.target.value);
            }
          }}
          required
          inputProps={{ maxLength: usernameMaxLength }}
          helperText={`${remainingChars} characters remaining`}
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button variant="contained" type="submit" fullWidth>
          Create Account
        </Button>

        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Box>
  );
}
