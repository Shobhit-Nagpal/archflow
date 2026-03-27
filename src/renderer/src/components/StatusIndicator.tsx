import type { DictationState } from '../../../main/types/ipc'
import './StatusIndicator.css'

interface Props {
  status: DictationState
}

const STATUS_LABELS: Record<DictationState, string> = {
  idle: 'Ready',
  recording: 'Recording…',
  transcribing: 'Transcribing…',
  result: 'Done',
  error: 'Error'
}

export function StatusIndicator({ status }: Props): JSX.Element {
  return (
    <div className={`status-indicator status-${status}`}>
      <span className="status-dot" />
      <span className="status-label">{STATUS_LABELS[status]}</span>
    </div>
  )
}
