import React, { useState } from 'react'

// ---- Mocked movie-level data for the dashboard ----
// Later you can replace this with a real API like GET /api/movies/:id/summary
const MOVIE_SUMMARIES = [
  {
    id: 'movie_1',
    title: 'Space Adventure',
    overallScore: 0.82,
    dailyScores: [
      { label: 'Day 1', score: 0.75 },
      { label: 'Day 2', score: 0.80 },
      { label: 'Day 3', score: 0.85 },
      { label: 'Day 4', score: 0.90 },
    ],
    topPositivePhrases: ['great acting', 'amazing visuals', 'loved the soundtrack'],
    topNegativePhrases: ['slow beginning', 'a bit predictable'],
    alerts: [
      {
        type: 'spike',
        date: 'Day 4',
        message: 'Sentiment spiked after positive social media buzz.',
      },
    ],
  },
  {
    id: 'movie_2',
    title: 'Mystery Drama',
    overallScore: 0.36,
    dailyScores: [
      { label: 'Day 1', score: 0.60 },
      { label: 'Day 2', score: 0.45 },
      { label: 'Day 3', score: 0.30 },
      { label: 'Day 4', score: 0.35 },
    ],
    topPositivePhrases: ['strong performances'],
    topNegativePhrases: ['confusing plot', 'bad pacing', 'weak ending'],
    alerts: [
      {
        type: 'drop',
        date: 'Day 3',
        message:
          'Sentiment dropped sharply after audiences reacted badly to the twist ending.',
      },
    ],
  },
]

// ---- Simple SVG chart for "sentiment over time" ----
function SentimentChart({ dailyScores }) {
  const width = 380
  const height = 220
  const padding = 40

  if (!dailyScores || dailyScores.length === 0) {
    return <p>No sentiment data yet.</p>
  }

  const scores = dailyScores.map((d) => d.score)
  const minY = Math.min(...scores)
  const maxY = Math.max(...scores)
  const range = maxY - minY || 1

  const points = dailyScores.map((d, i) => {
    const x =
      padding +
      (dailyScores.length === 1
        ? (width - 2 * padding) / 2
        : (i / (dailyScores.length - 1)) * (width - 2 * padding))

    const normalized = (d.score - minY) / range
    const y = height - padding - normalized * (height - 2 * padding)

    return { x, y, label: d.label }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      width={width}
      height={height}
      style={{ border: '1px solid #ddd', borderRadius: '8px' }}
    >
      {/* axes */}
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#444"
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#444"
      />

      {/* y labels */}
      <text x={8} y={height - padding + 4} fontSize="10">
        {minY.toFixed(2)}
      </text>
      <text x={8} y={padding + 4} fontSize="10">
        {maxY.toFixed(2)}
      </text>

      {/* line */}
      <polyline
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2"
        points={polylinePoints}
      />

      {/* points + x labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#1d4ed8" />
          <text
            x={p.x}
            y={height - padding + 14}
            fontSize="9"
            textAnchor="middle"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function App() {
  // which movie is selected on the dashboard
  const [selectedMovieId, setSelectedMovieId] = useState(MOVIE_SUMMARIES[0].id)
  const movie = MOVIE_SUMMARIES.find((m) => m.id === selectedMovieId)

  // "try your own review" panel hooked up to your real backend
  const [freeText, setFreeText] = useState('')
  const [freeTextScore, setFreeTextScore] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const analyzeFreeText = async () => {
    if (!freeText.trim()) return
    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('http://localhost:5100/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: freeText }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Backend error')
      }

      const data = await res.json()
      setFreeTextScore(data.score)
    } catch (err) {
      console.error(err)
      setErrorMsg('Error calling backend')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="app-title">Audience Pulse Dashboard</h1>

      {/* Movie selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="movie-select" style={{ marginRight: '0.5rem' }}>
          Select a movie:
        </label>
        <select
          id="movie-select"
          value={selectedMovieId}
          onChange={(e) => setSelectedMovieId(e.target.value)}
        >
          {MOVIE_SUMMARIES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {/* Main dashboard: left = score + phrases, right = chart + alerts */}
      <div className="app-layout">
        <div className="text-panel">
          <h2>{movie.title}</h2>
          <p style={{ fontSize: '1.1rem' }}>
            Overall sentiment score:{' '}
            <strong>{movie.overallScore.toFixed(2)}</strong>
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h3>Top Positive Phrases</h3>
              <ul>
                {movie.topPositivePhrases.map((p, i) => (
                  <li key={i}>“{p}”</li>
                ))}
              </ul>
            </div>

            <div style={{ flex: 1 }}>
              <h3>Top Negative Phrases</h3>
              <ul>
                {movie.topNegativePhrases.map((p, i) => (
                  <li key={i}>“{p}”</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="chart-panel">
          <h2>Sentiment Over Time</h2>
          <SentimentChart dailyScores={movie.dailyScores} />

          <h3 style={{ marginTop: '1.5rem' }}>Alerts</h3>
          {movie.alerts.length === 0 ? (
            <p>No major sentiment spikes or drops detected.</p>
          ) : (
            <ul>
              {movie.alerts.map((a, i) => (
                <li key={i}>
                  <strong>{a.type === 'spike' ? 'Spike' : 'Drop'}</strong> on{' '}
                  {a.date}: {a.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Optional: "try your own review" using the real backend */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Try it on a new review</h2>
        <textarea
          rows="4"
          style={{ width: '100%', boxSizing: 'border-box' }}
          placeholder="Paste a review here..."
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
        />
        <br />
        <button
          onClick={analyzeFreeText}
          style={{ marginTop: '0.75rem' }}
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        {typeof freeTextScore === 'number' && (
          <p style={{ marginTop: '0.5rem' }}>
            Sentiment score for this review:{' '}
            <strong>{freeTextScore.toFixed(2)}</strong>
          </p>
        )}
      </div>
    </div>
  )
}

export default App
