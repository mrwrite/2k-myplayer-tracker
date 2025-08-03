import { useNavigate, useParams } from 'react-router-dom'
import BuildForm from '../components/BuildForm'
import { getBuilds, addBuild, updateBuild } from '../utils/storage'
import type { Build } from '../types'

export default function BuildFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const build = id ? getBuilds().find((b) => b.id === id) : undefined

  function handleSave(b: Build) {
    if (id) {
      updateBuild(b)
    } else {
      addBuild(b)
    }
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BuildForm build={build} onSave={handleSave} />
    </div>
  )
}
