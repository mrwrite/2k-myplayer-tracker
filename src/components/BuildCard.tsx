import { Link } from 'react-router-dom'
import type { Build } from '../types'

interface Props {
  build: Build
  onDelete: (id: string) => void
}

export default function BuildCard({ build, onDelete }: Props) {
  return (
    <div className="bg-gray-800 p-4 rounded shadow flex justify-between items-center">
      <div>
        <h3 className="text-lg font-bold">{build.name}</h3>
        <p className="text-sm text-gray-400">
          {build.game} — {build.position}
        </p>
        <p className="text-sm text-gray-400">{build.archetype}</p>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/build/${build.id}`}
          className="px-4 py-2 rounded font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          View
        </Link>
        <button
          onClick={() => onDelete(build.id)}
          className="px-4 py-2 rounded font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
