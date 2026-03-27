import { useDictation } from './hooks/useDictation'
import { StatusIndicator } from './components/StatusIndicator'
import { Waveform } from './components/Waveform'
import './App.css'

function App(): JSX.Element {
  const { status, error, analyserRef, cancelRecording, dismiss } = useDictation()

  return (
    <div className="app">
      <div className="header">
        <span className="app-name">archflow</span>
        <StatusIndicator status={status} />
      </div>

      <div className="visualiser">
        {status === 'recording' && <Waveform analyserRef={analyserRef} />}
        {status === 'transcribing' && <TranscribingPulse />}
      </div>

      {status === 'error' && error && (
        <div className="error-box">
          <p>{error}</p>
          <button className="btn-dismiss" onClick={dismiss}>Dismiss</button>
        </div>
      )}

      {status === 'recording' && (
        <button className="btn-cancel" onClick={cancelRecording}>
          Cancel
        </button>
      )}
    </div>
  )
}

function TranscribingPulse(): JSX.Element {
  return (
    <div className="transcribing-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="pulse-bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

export default App
