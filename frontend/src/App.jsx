import React, { useState } from 'react'

function App() {
  const [text, setText] = useState('')
  const [score, setScore] = useState(null)

  const analyzeSentiment = async () => {
    try {
      const response = await fetch('http://localhost:5100/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await response.json()
      setScore(data.score)
    } catch (err) {
      console.error(err)
      alert('Error calling backend')
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Sentiment Analyzer</h1>
      <textarea
        rows="4"
        cols="50"
        placeholder="Type a sentence..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <br />
      <button onClick={analyzeSentiment} style={{ marginTop: '1rem' }}>Analyze</button>
      {score !== null && (
        <p>Sentiment Score: {score.toFixed(2)}</p>
      )}
    </div>
  )
}

export default App
