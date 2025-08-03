import { useState } from 'react'
import type { Build, Attributes } from '../types'
import { getBuilds } from '../utils/storage'
import CompareChart from '../components/CompareChart'

export default function ComparePage() {
  const builds: Build[] = getBuilds()
  const [firstId, setFirstId] = useState<string>(builds[0]?.id ?? '')
  const [secondId, setSecondId] = useState<string>(builds[1]?.id ?? '')

  const first = builds.find((b) => b.id === firstId)
  const second = builds.find((b) => b.id === secondId)

  const attributeKeys = first
    ? (Object.keys(first.attributes) as (keyof Attributes)[])
    : []

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={firstId}
          onChange={(e) => setFirstId(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {builds.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={secondId}
          onChange={(e) => setSecondId(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {builds.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      {first && second && (
        <>
          <div className="overflow-auto bg-gray-800 rounded shadow p-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Attribute</th>
                  <th className="p-2 text-left">{first.name}</th>
                  <th className="p-2 text-left">{second.name}</th>
                </tr>
              </thead>
              <tbody>
                {attributeKeys.map((key) => (
                  <tr key={key}>
                    <td className="p-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </td>
                    <td className="p-2">{first.attributes[key]}</td>
                    <td className="p-2">{second.attributes[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CompareChart builds={[first, second]} />
        </>
      )}
    </div>
  )
}
