import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import type { Build, Attributes } from '../types'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface Props {
  builds: [Build, Build]
}

export default function CompareChart({ builds }: Props) {
  const labels = Object.keys(builds[0].attributes) as (keyof Attributes)[]
  const data = {
    labels: labels.map((l) => l.replace(/([A-Z])/g, ' $1')),
    datasets: builds.map((b, idx) => ({
      label: b.name,
      data: labels.map((l) => b.attributes[l]),
      borderColor: idx === 0 ? 'rgb(239,68,68)' : 'rgb(59,130,246)',
      backgroundColor: idx === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
    })),
  }
  return <Radar data={data} />
}
