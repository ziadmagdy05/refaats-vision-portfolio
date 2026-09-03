import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        REFAAT'S<span></span>VISION
      </Link>

      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/portfolio">Work</NavLink>
        <NavLink to="/book">Book</NavLink>
      </nav>
    </header>
  );
}

export default Navbar;