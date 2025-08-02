import { useState } from 'react'
import type { BoxScoreStats } from '../types'
import { parseBoxScore } from '../utils/parseBoxScore'

function BoxScorePage() {
  const [stats, setStats] = useState<BoxScoreStats | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const result = await parseBoxScore(file)
    setStats(result)
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Upload Final Box Score</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {loading && <p className="mt-4">Reading screenshot...</p>}
      {stats && !loading && (
        <div className="mt-4 space-y-1">
          <p>Points: {stats.points}</p>
          <p>Rebounds: {stats.rebounds}</p>
          <p>Assists: {stats.assists}</p>
        </div>
      )}
    </div>
  )
}

export default BoxScorePage
