import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
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
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Export JSON
        </button>
        <label
          className="px-4 py-2 rounded font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors cursor-pointer"
        >
          Import JSON
          <input
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>
      {builds.length === 0 && <p className="text-gray-400">No builds saved.</p>}
      {builds.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Game</th>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Archetype</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {builds.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2">{b.name}</td>
                  <td className="px-4 py-2">{b.game}</td>
                  <td className="px-4 py-2">{b.position}</td>
                  <td className="px-4 py-2">{b.archetype}</td>
                  <td className="px-4 py-2 space-x-2">
                    <Link
                      to={`/build/${b.id}`}
                      className="px-3 py-1 rounded font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="px-3 py-1 rounded font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
