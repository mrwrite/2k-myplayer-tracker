import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Build, Attributes } from '../types'

const attributeKeys: (keyof Attributes)[] = [
  'closeShot',
  'drivingLayup',
  'drivingDunk',
  'threePointShot',
  'midRangeShot',
  'freeThrow',
  'passAccuracy',
  'ballHandle',
  'speedWithBall',
  'interiorDefense',
  'perimeterDefense',
  'steal',
  'block',
  'offensiveRebound',
  'defensiveRebound',
  'speed',
  'acceleration',
  'strength',
  'vertical',
  'stamina',
]

const emptyAttributes = attributeKeys.reduce((acc, key) => {
  acc[key] = 50
  return acc
}, {} as Attributes)

const emptyBuild: Build = {
  id: '',
  name: '',
  game: '',
  position: '',
  height: 75,
  weight: 200,
  wingspan: 75,
  archetype: '',
  attributes: emptyAttributes,
}

interface Props {
  build?: Build
  onSave: (build: Build) => void
}

export default function BuildForm({ build, onSave }: Props) {
  const [form, setForm] = useState<Build>(build ?? emptyBuild)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name in form.attributes) {
      setForm({
        ...form,
        attributes: { ...form.attributes, [name]: Number(value) },
      })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const finalBuild: Build = {
      ...form,
      id: form.id || crypto.randomUUID(),
    }
    onSave(finalBuild)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-gray-800 rounded shadow p-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Name"
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="game"
          value={form.game}
          onChange={handleChange}
          required
          placeholder="Game"
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="position"
          value={form.position}
          onChange={handleChange}
          required
          placeholder="Position"
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          name="height"
          value={form.height}
          onChange={handleChange}
          required
          min={60}
          max={90}
          placeholder="Height (in)"
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          name="weight"
          value={form.weight}
          onChange={handleChange}
          required
          min={150}
          max={400}
          placeholder="Weight (lbs)"
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          name="wingspan"
          value={form.wingspan}
          onChange={handleChange}
          required
          min={70}
          max={90}
          placeholder="Wingspan (in)"
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="archetype"
          value={form.archetype}
          onChange={handleChange}
          required
          placeholder="Archetype"
          className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
        />
      </div>
      <h3 className="text-lg font-bold">Attributes</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {attributeKeys.map((attr) => (
          <div key={attr} className="flex flex-col">
            <label className="text-sm capitalize mb-1">
              {attr.replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              type="number"
              name={attr}
              value={form.attributes[attr]}
              onChange={handleChange}
              min={0}
              max={99}
              required
              className="bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="px-4 py-2 rounded font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Save Build
      </button>
    </form>
  )
}
