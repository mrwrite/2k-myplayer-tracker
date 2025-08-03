import { Link, Route, Routes } from 'react-router-dom'
import BuildListPage from './pages/BuildListPage'
import BuildFormPage from './pages/BuildFormPage'
import ComparePage from './pages/ComparePage'
import BoxScorePage from './pages/BoxScorePage'
import { useAuth } from './AuthProvider'

function App() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 p-4 flex gap-4">
        <Link to="/" className="font-bold">2K MyPLAYER Tracker</Link>
        <Link to="/new" className="hover:underline">New Build</Link>
        <Link to="/compare" className="hover:underline">Compare</Link>
        <Link to="/box-score" className="hover:underline">Box Score</Link>
        <button onClick={logout} className="ml-auto hover:underline">
          Sign Out
        </button>
      </nav>
      <div className="p-4">
        <Routes>
          <Route path="/" element={<BuildListPage />} />
          <Route path="/new" element={<BuildFormPage />} />
          <Route path="/build/:id" element={<BuildFormPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/box-score" element={<BoxScorePage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
