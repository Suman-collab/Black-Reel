import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings,
  SkipForward, SkipBack, PictureInPicture2, FastForward,
} from 'lucide-react';
import './VideoPlayer.css';

const formatTime = (seconds) => {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const QUALITY_OPTIONS = ['Auto', '240p', '360p', '480p', '720p', '1080p', '4K'];
const HIDE_TIMEOUT = 3000;

const VideoPlayer = ({
  videoUrl,
  title,
  trailerUrl,
  videoQualities = {},
  availableQualities = [],
  onNextEpisode,
  showNextEpisode = false,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(''); // 'speed' | 'quality'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [error, setError] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(videoUrl || '');

  // ── Sync source when props change ───────────────────
  useEffect(() => {
    setCurrentSrc(videoUrl || '');
    setError(null);
  }, [videoUrl]);

  // ── Hide controls timer ─────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), HIDE_TIMEOUT);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      clearTimeout(hideTimerRef.current);
    } else {
      resetHideTimer();
    }
    return () => clearTimeout(hideTimerRef.current);
  }, [isPlaying, resetHideTimer]);

  // ── Skip Intro detection (5s–30s) ───────────────────
  useEffect(() => {
    setShowSkipIntro(currentTime >= 5 && currentTime <= 30);
  }, [currentTime]);

  // ── Video event listeners ───────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => setCurrentTime(vid.currentTime);
    const onLoadedMeta = () => setDuration(vid.duration);
    const onProgress = () => {
      if (vid.buffered.length > 0) {
        setBuffered(vid.buffered.end(vid.buffered.length - 1));
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setError('Video could not be loaded.');

    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('loadedmetadata', onLoadedMeta);
    vid.addEventListener('progress', onProgress);
    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('error', onError);

    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('loadedmetadata', onLoadedMeta);
      vid.removeEventListener('progress', onProgress);
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('error', onError);
    };
  }, [currentSrc]);

  // ── Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      const vid = videoRef.current;
      if (!vid) return;

      switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.preventDefault(); seek(10); break;
        case 'ArrowLeft': e.preventDefault(); seek(-10); break;
        case 'ArrowUp': e.preventDefault(); adjustVolume(0.1); break;
        case 'ArrowDown': e.preventDefault(); adjustVolume(-0.1); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Player actions ──────────────────────────────────
  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => null);
    } else {
      vid.pause();
    }
  };

  const seek = (delta) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + delta));
  };

  const seekTo = (fraction) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = fraction * vid.duration;
  };

  const adjustVolume = (delta) => {
    const vid = videoRef.current;
    if (!vid) return;
    const newVol = Math.max(0, Math.min(1, vid.volume + delta));
    vid.volume = newVol;
    setVolume(newVol);
    if (newVol > 0) { vid.muted = false; setIsMuted(false); }
  };

  const setVolumeValue = (val) => {
    const vid = videoRef.current;
    if (!vid) return;
    const numVal = parseFloat(val);
    vid.volume = numVal;
    setVolume(numVal);
    if (numVal > 0 && vid.muted) { vid.muted = false; setIsMuted(false); }
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => null);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => null);
      setIsFullscreen(false);
    }
  };

  const changeSpeed = (speed) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
    setSettingsTab('');
  };

  const changeQuality = (quality) => {
    const qualityMap = {
      '240p': videoQualities?.p240,
      '360p': videoQualities?.p360,
      '480p': videoQualities?.p480,
      '720p': videoQualities?.p720,
      '1080p': videoQualities?.p1080,
      '4K': videoQualities?.p2160,
    };

    const newSrc = quality === 'Auto' ? videoUrl : (qualityMap[quality] || videoUrl);
    const wasPlaying = !videoRef.current?.paused;
    const time = videoRef.current?.currentTime || 0;

    setSelectedQuality(quality);
    setCurrentSrc(newSrc);

    setTimeout(() => {
      const vid = videoRef.current;
      if (vid) {
        vid.currentTime = time;
        if (wasPlaying) vid.play().catch(() => null);
      }
    }, 100);

    setShowSettings(false);
    setSettingsTab('');
  };

  const togglePiP = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await vid.requestPictureInPicture();
      }
    } catch {
      // PiP not supported
    }
  };

  const skipIntro = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 30;
    setShowSkipIntro(false);
  };

  // ── Placeholder when no video ───────────────────────
  if (!currentSrc) {
    return (
      <div className="nfx-placeholder">
        <span style={{ fontSize: '48px' }}>🎬</span>
        <p style={{ margin: 0, fontWeight: '600' }}>Video coming soon</p>
        <p style={{ margin: 0, fontSize: '13px', color: '#606068' }}>
          This title is currently not available for streaming.
        </p>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="nfx-player"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={currentSrc}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        playsInline
      />

      {/* Error overlay */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#111', color: '#A0A0A8', flexDirection: 'column', gap: '8px', zIndex: 50,
        }}>
          <span style={{ fontSize: '32px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`nfx-controls-overlay ${!showControls && isPlaying ? 'hidden' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) togglePlay(); }}
      >
        {/* Top bar */}
        <div className="nfx-top-bar">
          <span className="nfx-title">{title}</span>
        </div>

        {/* Center play button (when paused) */}
        {!isPlaying && !error && (
          <button className="nfx-center-play" onClick={togglePlay}>
            <Play size={32} fill="#fff" />
          </button>
        )}

        {/* Skip Intro */}
        {showSkipIntro && (
          <button className="nfx-skip-intro" onClick={skipIntro}>
            Skip Intro →
          </button>
        )}

        {/* Bottom controls */}
        <div className="nfx-controls-bar">
          {/* Progress bar */}
          <div
            className="nfx-progress-container"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo((e.clientX - rect.left) / rect.width);
            }}
          >
            <div className="nfx-buffered" style={{ width: `${bufferedPercent}%` }} />
            <div className="nfx-progress-filled" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Controls row */}
          <div className="nfx-controls-row">
            <div className="nfx-controls-left">
              <button className="nfx-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={22} /> : <Play size={22} fill="#fff" />}
              </button>

              <button className="nfx-btn" onClick={() => seek(-10)} title="Rewind 10s">
                <SkipBack size={20} />
              </button>

              <button className="nfx-btn" onClick={() => seek(10)} title="Forward 10s">
                <SkipForward size={20} />
              </button>

              <div className="nfx-volume-group">
                <button className="nfx-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolumeValue(e.target.value)}
                  className="nfx-volume-slider"
                />
              </div>

              <span className="nfx-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="nfx-controls-right">
              {showNextEpisode && onNextEpisode && (
                <button className="nfx-btn" onClick={onNextEpisode} title="Next Episode">
                  <FastForward size={20} />
                </button>
              )}

              <button className="nfx-btn" onClick={togglePiP} title="Picture in Picture">
                <PictureInPicture2 size={18} />
              </button>

              <button
                className="nfx-btn"
                onClick={() => { setShowSettings(!showSettings); setSettingsTab(''); }}
                title="Settings"
              >
                <Settings size={18} />
              </button>

              <button className="nfx-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings popup */}
        {showSettings && (
          <div className="nfx-settings-popup" onClick={(e) => e.stopPropagation()}>
            {!settingsTab && (
              <>
                <button className="nfx-settings-item" onClick={() => setSettingsTab('speed')}>
                  <span>Playback Speed</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{playbackSpeed}×</span>
                </button>
                <button className="nfx-settings-item" onClick={() => setSettingsTab('quality')}>
                  <span>Quality</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>{selectedQuality}</span>
                </button>
              </>
            )}

            {settingsTab === 'speed' && (
              <>
                <h4>Playback Speed</h4>
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    className={`nfx-settings-item ${playbackSpeed === speed ? 'active' : ''}`}
                    onClick={() => changeSpeed(speed)}
                  >
                    <span>{speed === 1 ? 'Normal' : `${speed}×`}</span>
                    {playbackSpeed === speed && <span className="check">✓</span>}
                  </button>
                ))}
              </>
            )}

            {settingsTab === 'quality' && (
              <>
                <h4>Video Quality</h4>
                {QUALITY_OPTIONS.map((q) => {
                  const qualityKey = q === '4K' ? 'p2160' : q === 'Auto' ? null : `p${q.replace('p', '')}`;
                  const isAvailable = q === 'Auto' || (availableQualities.length === 0) || availableQualities.includes(qualityKey);
                  const hasUrl = q === 'Auto' || (videoQualities && videoQualities[qualityKey]);

                  return (
                    <button
                      key={q}
                      className={`nfx-settings-item ${selectedQuality === q ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                      onClick={() => isAvailable && changeQuality(q)}
                      disabled={!isAvailable}
                    >
                      <span>
                        {q}
                        {!isAvailable && <span style={{ marginLeft: '6px', fontSize: '10px' }}>🔒</span>}
                        {q === 'Auto' && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#666' }}>Recommended</span>}
                      </span>
                      {selectedQuality === q && <span className="check">✓</span>}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
