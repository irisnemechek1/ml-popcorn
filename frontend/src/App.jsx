import React, { useState } from 'react'

// ---- Mocked movie-level data for the dashboard ----
const MOVIE_SUMMARIES = [
  {
    id: 'movie_1',
    title: 'Space Adventure',
    overallScore: 0.82,
    dailyScores: [
      { label: 'Day 1', score: 0.75 },
      { label: 'Day 2', score: 0.8 },
      { label: 'Day 3', score: 0.85 },
      { label: 'Day 4', score: 0.9 },
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
      { label: 'Day 1', score: 0.6 },
      { label: 'Day 2', score: 0.45 },
      { label: 'Day 3', score: 0.3 },
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
  const height = 240
  const padding = 40

  if (!dailyScores || dailyScores.length === 0) {
    return <p>No sentiment data yet.</p>
  }

  // FIXED SCALE FOR 0–100
  const minY = 0
  const maxY = 100
  const range = 100

  // Convert your model scores (0–1) into percentages (0–100)
  const percentScores = dailyScores.map((d) => ({
    label: d.label,
    score: d.score * 100
  }))

  const points = percentScores.map((d, i) => {
    const x =
      padding +
      (percentScores.length === 1
        ? (width - 2 * padding) / 2
        : (i / (percentScores.length - 1)) * (width - 2 * padding))

    const normalized = (d.score - minY) / range
    const y = height - padding - normalized * (height - 2 * padding)

    return { x, y, label: d.label }
  })

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ")

  return (
    <svg
      width={width}
      height={height}
      style={{ border: "1px solid #ddd", borderRadius: "8px" }}
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

      {/* y-axis labels */}
      <text x={5} y={height - padding + 4} fontSize="10">
        0
      </text>
      <text x={5} y={padding + 4} fontSize="10">
        100
      </text>

      {/* line */}
      <polyline
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2"
        points={polylinePoints}
      />

      {/* points + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#1d4ed8" />
        </g>
      ))}

      {/* Review index labels on X axis */}
      {points.map((p, i) => (
        <text
          key={`xlabel-${i}`}
          x={p.x}
          y={height - padding + 14}
          fontSize="9"
          textAnchor="middle"
        >
          {i + 1}
        </text>
      ))}

      {/* X-axis main label */}
      <text
        x={width / 2}
        y={height - 5}
        fontSize="12"
        textAnchor="middle"
        fill="#444"
      >
        Number of Reviews
      </text>
    </svg>
  )
}

function App() {
  // which movie is selected on the dashboard
  const [selectedMovieId, setSelectedMovieId] = useState(MOVIE_SUMMARIES[0].id)
  const movie = MOVIE_SUMMARIES.find((m) => m.id === selectedMovieId)

  // 🔹 NEW: keep track of extra scores we get from the API per movie
  // shape: { [movieId]: number[] }
  const [movieExtraScores, setMovieExtraScores] = useState({})

  // "try your own review" panel
  const [freeText, setFreeText] = useState('')
  const [freeTextScore, setFreeTextScore] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 🔹 compute what to show as Overall sentiment score
  // If we have API scores for this movie, average those;
  // otherwise fall back to the static overallScore from MOVIE_SUMMARIES.
  const extraScoresForMovie = movieExtraScores[selectedMovieId] ?? []
  const overallScore =
    extraScoresForMovie.length > 0
      ? extraScoresForMovie.reduce((sum, s) => sum + s, 0) /
        extraScoresForMovie.length
      : movie.overallScore

  // 🔹 compute chart data:
  // - if we have live API scores for this movie, use them as "Review 1, 2, 3..."
  // - otherwise show the mock dailyScores.
  const chartData =
    extraScoresForMovie.length > 0
      ? extraScoresForMovie.map((score, idx) => ({
          label: `Review ${idx + 1}`,
          score,
        }))
      : movie.dailyScores

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

      // keep showing the raw score for this specific review
      setFreeTextScore(data.score)

      // 🔹 NEW: update the extra scores for the CURRENTLY SELECTED MOVIE
      setMovieExtraScores((prev) => {
        const existing = prev[selectedMovieId] ?? []
        const updated = [...existing, data.score]
        return {
          ...prev,
          [selectedMovieId]: updated,
        }
      })
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

      {/* Main dashboard */}
      <div className="app-layout">
        {/* LEFT: overall score + phrases */}
        <div className="text-panel">
          <h2>{movie.title}</h2>
          <p style={{ fontSize: '1.1rem' }}>
            Overall sentiment score:{' '}
            <strong>{overallScore.toFixed(2)}</strong>
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

        {/* RIGHT: chart + alerts */}
        <div className="chart-panel">
          <h2>Sentiment Over Time</h2>
          <SentimentChart dailyScores={chartData} />

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

      {/* "Try your own review" hooked to real API */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Try it on a new review</h2>
        <textarea
          rows="4"
          style={{ width: '100%', boxSizing: 'border-box' }}
          placeholder="Paste a review here (for the selected movie)..."
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
