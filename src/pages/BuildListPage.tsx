import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import BuildCard from '../components/BuildCard'
import type { Build } from '../types'
import { getBuilds, deleteBuild, saveBuilds } from '../utils/storage'

export default function BuildListPage() {
  const [builds, setBuilds] = useState<Build[]>([])

  useEffect(() => {
    setBuilds(getBuilds())
  }, [])

  function handleDelete(id: string) {
    deleteBuild(id)
    setBuilds(getBuilds())
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(builds, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'builds.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string) as Build[]
        saveBuilds(imported)
        setBuilds(imported)
      } catch {
        alert('Invalid JSON')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={handleExport} className="px-2 py-1 bg-green-600 rounded">
          Export JSON
        </button>
        <label className="px-2 py-1 bg-gray-700 rounded cursor-pointer">
          Import JSON
          <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
        </label>
      </div>
      {builds.length === 0 && <p>No builds saved.</p>}
      <div className="space-y-2">
        {builds.map((b) => (
          <BuildCard key={b.id} build={b} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}
