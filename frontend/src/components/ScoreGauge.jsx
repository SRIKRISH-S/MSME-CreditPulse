import { useEffect, useState } from 'react'
import { getRiskColor } from '../utils/helpers'

export default function ScoreGauge({ score, riskBand, size = 180 }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const color = getRiskColor(riskBand)
  const trackColor = '#e2e8f0'

  // Animate the score counting up
  useEffect(() => {
    setAnimatedScore(0)
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(current * 10) / 10)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score])

  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-circle"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-extrabold tracking-tight"
            style={{ color }}
          >
            {animatedScore.toFixed(0)}
          </span>
          <span className="text-xs font-medium text-navy-500 uppercase tracking-wider">
            out of 100
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-navy-700">Credit Health Score</p>
      </div>
    </div>
  )
}
