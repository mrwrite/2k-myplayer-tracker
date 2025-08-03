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
      <nav className="bg-gray-800/50 backdrop-blur p-4 shadow flex flex-wrap items-center gap-4">
        <Link to="/" className="font-bold text-xl">
          2K MyPLAYER Tracker
        </Link>
        <Link to="/new" className="hover:underline">
          New Build
        </Link>
        <Link to="/compare" className="hover:underline">
          Compare
        </Link>
        <Link to="/box-score" className="hover:underline">
          Box Score
        </Link>
        <button
          onClick={logout}
          className="ml-auto px-4 py-2 rounded font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          Sign Out
        </button>
      </nav>
      <div className="p-4 max-w-4xl mx-auto">
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
