import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { Link } from "react-router-dom";

export default function NavigationBar() {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Button component={Link} to="/home" color="inherit" sx={{ fontWeight: "bold" }}>
          Home
        </Button>
        <Button component={Link} to="/projects" color="inherit">
          Projects
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button component={Link} to="/login" color="inherit">
          Login
        </Button>
        <Button component={Link} to="/register" color="inherit">
          Register
        </Button>
      </Toolbar>
    </AppBar>
  );
}