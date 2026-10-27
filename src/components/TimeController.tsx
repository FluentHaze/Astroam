import { useState } from 'react';
import { CalendarDays, CircleDot, Pause, Play, RotateCcw } from 'lucide-react';
import { DAY_MS, MAX_UTC_MS, MIN_UTC_MS } from '../domain/astronomy/engine';
import { useExplorer } from '../state/store';

const SPEEDS = [
  { value: (-DAY_MS * 30) / 1000, label: '倒放 · 30 天 / 秒' },
  { value: -DAY_MS / 1000, label: '倒放 · 1 天 / 秒' },
  { value: 1, label: '1 倍 · 真实速度' },
  { value: DAY_MS / 1000, label: '1 天 / 秒' },
  { value: (DAY_MS * 7) / 1000, label: '7 天 / 秒' },
  { value: (DAY_MS * 30) / 1000, label: '30 天 / 秒' },
];

function utcInputValue(utcMs: number) {
  return new Date(utcMs).toISOString().slice(0, 19);
}

export function TimeController() {
  const utcMs = useExplorer((state) => state.utcMs);
  const mode = useExplorer((state) => state.mode);
  const speed = useExplorer((state) => state.speed);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateText = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(utcMs);
  const timeText = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(utcMs);
  const modeText = { live: '实时', paused: '模拟暂停', playing: '模拟播放' }[
    mode
  ];
  const openEditor = () => {
    setDraft(utcInputValue(utcMs));
    setError('');
    setEditing(true);
    useExplorer.getState().setTime(utcMs);
  };
  const saveDate = (event: React.FormEvent) => {
    event.preventDefault();
    const value = new Date(`${draft}Z`).getTime();
    if (!Number.isFinite(value) || value < MIN_UTC_MS || value > MAX_UTC_MS) {
      setError('请输入 2000 至 2050 年之间的有效 UTC 日期');
      return;
    }
    useExplorer.getState().setTime(value);
    setEditing(false);
  };

  return (
    <footer
      className="time-controller panel"
      aria-label="时间控制"
    >
      <div className="time-main">
        <div className="time-readout">
          <span className="eyebrow">探索时刻</span>
          <button
            className="date-trigger"
            onClick={openEditor}
            aria-expanded={editing}
          >
            <CalendarDays size={17} />
            <strong>{dateText}</strong>
            <span>{timeText}</span>
          </button>
          <span className="timezone">{`设备时区 · ${timeZone}`}</span>
        </div>
        <div className="playback-controls">
          <button
            className="play-button"
            onClick={() => useExplorer.getState().togglePlaying()}
            aria-label={mode === 'paused' ? '播放模拟时间' : '暂停时间'}
          >
            {mode === 'paused' ? <Play size={19} /> : <Pause size={19} />}
          </button>
          <label className="speed-select">
            <span>时间速度</span>
            <select
              value={speed}
              onChange={(event) =>
                useExplorer.getState().setSpeed(Number(event.target.value))
              }
            >
              {SPEEDS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="time-actions">
          <span className={`time-status ${mode}`}>
            <CircleDot size={13} />
            <span>{modeText}</span>
          </span>
          <button
            className="now-button"
            onClick={() => {
              useExplorer.getState().now();
              setEditing(false);
            }}
          >
            <RotateCcw size={14} />
            <span>回到现在</span>
          </button>
        </div>
      </div>
      {editing && (
        <form
          className="date-editor"
          onSubmit={saveDate}
        >
          <label htmlFor="utc-date">日期与时间（UTC，2000—2050 年）</label>
          <input
            id="utc-date"
            type="datetime-local"
            min="2000-01-01T00:00"
            max="2050-12-31T23:59:59"
            step="1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            required
          />
          <button type="submit">应用</button>
          <button
            type="button"
            onClick={() => setEditing(false)}
          >
            取消
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
      <div
        className="timeline-strip"
        aria-label="时间步进"
      >
        <button
          onClick={() =>
            useExplorer.getState().setTime(Math.max(MIN_UTC_MS, utcMs - DAY_MS))
          }
          disabled={utcMs <= MIN_UTC_MS}
        >
          − 1 天
        </button>
        <span
          className="timeline-ruler"
          aria-hidden="true"
        />
        <span className="timeline-caption">沿着时间，重新发现太阳系</span>
        <span
          className="timeline-ruler"
          aria-hidden="true"
        />
        <button
          onClick={() =>
            useExplorer.getState().setTime(Math.min(MAX_UTC_MS, utcMs + DAY_MS))
          }
          disabled={utcMs >= MAX_UTC_MS}
        >
          + 1 天
        </button>
      </div>
    </footer>
  );
}
