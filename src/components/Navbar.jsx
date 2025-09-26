import React from 'react'
import './navbar.css'

const Navbar = () => {
  return (
    <header className="navbar">
      <h1>Consultation App</h1>
      <nav>
        <ul>
          <li>Home</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </nav>
    </header>
  )
}

export default Navbar
