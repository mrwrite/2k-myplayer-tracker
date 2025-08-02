import { Link, Route, Routes } from 'react-router-dom'
import BuildListPage from './pages/BuildListPage'
import BuildFormPage from './pages/BuildFormPage'
import ComparePage from './pages/ComparePage'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 p-4 flex gap-4">
        <Link to="/" className="font-bold">2K MyPLAYER Tracker</Link>
        <Link to="/new" className="hover:underline">New Build</Link>
        <Link to="/compare" className="hover:underline">Compare</Link>
      </nav>
      <div className="p-4">
        <Routes>
          <Route path="/" element={<BuildListPage />} />
          <Route path="/new" element={<BuildFormPage />} />
          <Route path="/build/:id" element={<BuildFormPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
