export interface Attributes {
  closeShot: number
  drivingLayup: number
  drivingDunk: number
  threePointShot: number
  midRangeShot: number
  freeThrow: number
  passAccuracy: number
  ballHandle: number
  speedWithBall: number
  interiorDefense: number
  perimeterDefense: number
  steal: number
  block: number
  offensiveRebound: number
  defensiveRebound: number
  speed: number
  acceleration: number
  strength: number
  vertical: number
  stamina: number
}

export interface Build {
  id: string
  name: string
  game: string
  position: string
  height: number
  weight: number
  wingspan: number
  archetype: string
  attributes: Attributes
  badges?: string[]
}

export interface PlayerGameStats {
  id?: string
  username: string
  date: string
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  fgm: number
  fga: number
  tpm: number
  tpa: number
  ftm: number
  fta: number
  grade: string
  screenshotUrl: string
}

export type ParsedBoxScore = Omit<PlayerGameStats, 'id' | 'screenshotUrl'>
