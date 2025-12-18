import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface QuarterScore {
  home: number;
  away: number;
}

const Index = () => {
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null); // Timestamp when timer should end
  const [homeName, setHomeName] = useState("HOME");
  const [awayName, setAwayName] = useState("AWAY");
  const [quarterScores, setQuarterScores] = useState<QuarterScore[]>([
    { home: 0, away: 0 },
    { home: 0, away: 0 },
    { home: 0, away: 0 },
    { home: 0, away: 0 },
  ]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio context for alarm
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioRef.current = new Audio();
    }
  }, []);

  // Timer effect using timestamps for background accuracy
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && endTime) {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        
        if (remaining <= 0) {
          setTimeLeft(0);
          setIsRunning(false);
          setEndTime(null);
          playAlarm();
          toast.error("Time's up!", {
            description: `Quarter ${currentQuarter} has ended`,
          });
        } else {
          setTimeLeft(remaining);
        }
      };
      
      updateTimer(); // Update immediately
      interval = setInterval(updateTimer, 100); // Check more frequently for accuracy
    }

    return () => clearInterval(interval);
  }, [isRunning, endTime, currentQuarter]);

  // Handle visibility change to update timer when app comes back to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && endTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        
        if (remaining <= 0) {
          setTimeLeft(0);
          setIsRunning(false);
          setEndTime(null);
          playAlarm();
          toast.error("Time's up!", {
            description: `Quarter ${currentQuarter} has ended`,
          });
        } else {
          setTimeLeft(remaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, endTime, currentQuarter]);

  const playAlarm = () => {
    // Very strong vibration when timer ends
    vibrate([200, 100, 200, 100, 200, 100, 200]);
    
    // Play a beep sound using Web Audio API
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Strong vibration function
  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const addScore = (team: "home" | "away") => {
    vibrate([100, 50, 100]); // Strong double pulse
    setQuarterScores((prev) => {
      const newScores = [...prev];
      newScores[currentQuarter - 1] = {
        ...newScores[currentQuarter - 1],
        [team]: newScores[currentQuarter - 1][team] + 1,
      };
      return newScores;
    });
  };

  const removeScore = (team: "home" | "away") => {
    vibrate(50); // Short pulse
    setQuarterScores((prev) => {
      const newScores = [...prev];
      const currentScore = newScores[currentQuarter - 1][team];
      if (currentScore > 0) {
        newScores[currentQuarter - 1] = {
          ...newScores[currentQuarter - 1],
          [team]: currentScore - 1,
        };
      }
      return newScores;
    });
  };

  const getTotalScore = (team: "home" | "away") => {
    return quarterScores.reduce((total, quarter) => total + quarter[team], 0);
  };

  const nextQuarter = () => {
    vibrate([100, 50, 100, 50, 100]); // Triple pulse
    if (currentQuarter < 4) {
      setCurrentQuarter((prev) => prev + 1);
      setTimeLeft(15 * 60);
      setIsRunning(false);
      setEndTime(null);
      toast.success(`Moving to Quarter ${currentQuarter + 1}`);
    } else {
      toast.info("Game complete! Reset to start a new game.");
    }
  };

  const resetGame = () => {
    vibrate([200, 100, 200]); // Strong double pulse
    setCurrentQuarter(1);
    setTimeLeft(15 * 60);
    setIsRunning(false);
    setEndTime(null);
    setQuarterScores([
      { home: 0, away: 0 },
      { home: 0, away: 0 },
      { home: 0, away: 0 },
      { home: 0, away: 0 },
    ]);
    toast.success("Game reset!");
  };

  const toggleTimer = () => {
    vibrate(75); // Medium pulse
    if (!isRunning) {
      // Starting timer - calculate end timestamp
      setEndTime(Date.now() + timeLeft * 1000);
    } else {
      // Pausing timer - clear end timestamp
      setEndTime(null);
    }
    setIsRunning(!isRunning);
  };

  return (
    <div className="min-h-screen bg-background dark p-4 flex items-center justify-center overflow-hidden touch-none fixed inset-0">
      <div className="w-full max-w-md space-y-4">
        {/* Title */}
        <div className="flex items-center justify-center gap-3 mb-2 bg-timer-bg rounded-md py-4 px-2">
          <img
            src={`${import.meta.env.BASE_URL}soccer-ball-icon.png`}
            alt="Soccer ball"
            className="h-8 w-8 brightness-0 invert"
          />
          <h1 className="text-3xl font-bold text-foreground">Scoreboard APP</h1>
        </div>
        
        {/* Timer */}
        <Card className="bg-timer-bg text-primary-foreground p-6 text-center">
          <div className="text-sm font-medium mb-2 opacity-90">Quarter {currentQuarter} / 4</div>
          <div className="text-6xl font-bold font-mono tracking-wider mb-4">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              size="lg"
              onClick={toggleTimer}
              className="w-24 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span>{isRunning ? "Pause" : "Play"}</span>
            </Button>
            <Button
              size="lg"
              onClick={nextQuarter}
              disabled={currentQuarter >= 4}
              className="w-24 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <SkipForward className="h-5 w-5" />
              <span>Next</span>
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={resetGame}
              className="w-24 gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Reset</span>
            </Button>
          </div>
        </Card>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Home Team */}
          <Card className="p-4 border-score-home border-2 bg-timer-bg">
            <div className="text-center space-y-3">
              <input
                type="text"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value.slice(0, 20).toUpperCase())}
                className="text-sm font-semibold text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-score-home rounded px-2 py-1 w-full text-muted-foreground"
                placeholder="HOME TEAM"
              />
              <div className="text-6xl font-bold text-score-home">
                {getTotalScore("home")}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeScore("home")}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => addScore("home")}
                  className="flex-1 bg-score-home hover:bg-score-home/90 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Away Team */}
          <Card className="p-4 border-score-away border-2 bg-timer-bg">
            <div className="text-center space-y-3">
              <input
                type="text"
                value={awayName}
                onChange={(e) => setAwayName(e.target.value.slice(0, 20).toUpperCase())}
                className="text-sm font-semibold text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-score-away rounded px-2 py-1 w-full text-muted-foreground"
                placeholder="AWAY TEAM"
              />
              <div className="text-6xl font-bold text-score-away">
                {getTotalScore("away")}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeScore("away")}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => addScore("away")}
                  className="flex-1 bg-score-away hover:bg-score-away/90 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quarter Breakdown */}
        <Card className="p-4 bg-timer-bg">
          <h3 className="text-sm font-semibold mb-3 text-center">Quarter Breakdown</h3>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {quarterScores.map((quarter, index) => (
              <div
                key={index}
                className={`p-2 rounded-md text-center bg-muted ${
                  index + 1 === currentQuarter ? "border-2 border-primary" : ""
                }`}
              >
                <div className="font-semibold mb-1">Q{index + 1}</div>
                <div className="text-score-home font-bold">{quarter.home}</div>
                <div className="text-score-away font-bold">{quarter.away}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
