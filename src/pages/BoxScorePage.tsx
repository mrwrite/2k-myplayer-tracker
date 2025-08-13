import { useEffect, useState } from 'react'
import type { ParsedBoxScore, PlayerGameStats } from '../types'
import { parseBoxScore } from '../utils/parseBoxScore'
import { savePlayerStats, fetchPlayerStats } from '../utils/statsService'

function BoxScorePage() {
  const [username, setUsername] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [stats, setStats] = useState<ParsedBoxScore | null>(null)
  const [dateInput, setDateInput] = useState('')
  const [history, setHistory] = useState<PlayerGameStats[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !username) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setLoading(true)
    setError(null)
    const result = await parseBoxScore(f, username)
    if ('error' in result) {
      setError(result.error)
      setStats(null)
    } else {
      setStats(result)
      if (result.date) setDateInput(result.date)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!stats || !file) return
    const data = { ...stats, date: stats.date || dateInput }
    const saved = await savePlayerStats(data, file)
    setHistory((h) => [...h, saved])
    setStats(null)
    setFile(null)
    setPreview(null)
  }

  useEffect(() => {
    if (username) {
      fetchPlayerStats(username).then(setHistory)
    } else {
      setHistory([])
    }
  }, [username])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Upload Final Box Score</h1>

      <div className="space-y-2 bg-gray-800 rounded shadow p-4 max-w-sm">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {loading && <p>Reading screenshot...</p>}
      {error && !loading && <p className="text-red-500">{error}</p>}

      {preview && (
        <img src={preview} alt="preview" className="max-w-xs border rounded" />
      )}

      {stats && !loading && (
        <div className="space-y-1 bg-gray-800 rounded shadow p-4 max-w-sm">
          <p>Points: {stats.points}</p>
          <p>Rebounds: {stats.rebounds}</p>
          <p>Assists: {stats.assists}</p>
          <p>Steals: {stats.steals}</p>
          <p>Blocks: {stats.blocks}</p>
          <p>
            FGM/FGA: {stats.fgm}/{stats.fga}
          </p>
          <p>
            3PM/3PA: {stats.tpm}/{stats.tpa}
          </p>
          <p>
            FTM/FTA: {stats.ftm}/{stats.fta}
          </p>
          <p>Grade: {stats.grade}</p>
          {!stats.date && (
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
            />
          )}
          <button
            className="px-4 py-2 rounded font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors mt-2"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8 bg-gray-800 rounded shadow p-4 max-w-sm">
          <h2 className="font-bold mb-2">History</h2>
          <ul className="space-y-1">
            {history.map((h) => (
              <li key={h.id}>
                {h.date}: {h.points} PTS, {h.rebounds} REB, {h.assists} AST
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default BoxScorePage
