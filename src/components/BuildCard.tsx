import { Link } from 'react-router-dom'
import type { Build } from '../types'

interface Props {
  build: Build
  onDelete: (id: string) => void
}

export default function BuildCard({ build, onDelete }: Props) {
  return (
    <div className="bg-gray-800 p-4 rounded flex justify-between items-center">
      <div>
        <h3 className="text-lg font-bold">{build.name}</h3>
        <p className="text-sm">
          {build.game} — {build.position}
        </p>
        <p className="text-sm">{build.archetype}</p>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/build/${build.id}`}
          className="px-2 py-1 bg-blue-600 rounded"
        >
          View
        </Link>
        <button
          onClick={() => onDelete(build.id)}
          className="px-2 py-1 bg-red-600 rounded"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
