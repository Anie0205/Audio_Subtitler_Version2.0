import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import OverlayPage from './pages/OverlayPage'
import TestOverlayPage from './pages/TestOverlayPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/overlay" element={<OverlayPage />} />
          <Route path="/test" element={<TestOverlayPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

