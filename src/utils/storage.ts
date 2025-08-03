import type { Build } from '../types'
import { sampleBuilds } from '../data/sampleBuilds'

const STORAGE_KEY = 'builds'

export function getBuilds(): Build[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as Build[]
    } catch {
      // ignore
    }
  }
  saveBuilds(sampleBuilds)
  return sampleBuilds
}

export function saveBuilds(builds: Build[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds))
}

export function addBuild(build: Build): void {
  const builds = getBuilds()
  builds.push(build)
  saveBuilds(builds)
}

export function updateBuild(build: Build): void {
  const builds = getBuilds().map((b) => (b.id === build.id ? build : b))
  saveBuilds(builds)
}

export function deleteBuild(id: string): void {
  const builds = getBuilds().filter((b) => b.id !== id)
  saveBuilds(builds)
}
