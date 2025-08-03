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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !username) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setLoading(true)
    const result = await parseBoxScore(f, username)
    setStats(result)
    if (result.date) setDateInput(result.date)
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
    <div>
      <h1 className="text-xl font-bold mb-4">Upload Final Box Score</h1>

      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-black p-1"
        />
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {loading && <p className="mt-4">Reading screenshot...</p>}

      {preview && (
        <img src={preview} alt="preview" className="mt-4 max-w-xs border" />
      )}

      {stats && !loading && (
        <div className="mt-4 space-y-1">
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
              className="text-black mt-2 p-1"
            />
          )}
          <button
            className="mt-2 px-2 py-1 bg-blue-600 rounded"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
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
