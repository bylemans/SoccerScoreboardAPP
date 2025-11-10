import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import soccerBall from "@/assets/soccer-ball.png";

interface QuarterScore {
  home: number;
  away: number;
}

const Index = () => {
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
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
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playAlarm();
            toast.error("Time's up!", {
              description: `Quarter ${currentQuarter} has ended`,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, currentQuarter]);

  const playAlarm = () => {
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

  const addScore = (team: "home" | "away") => {
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
    if (currentQuarter < 4) {
      setCurrentQuarter((prev) => prev + 1);
      setTimeLeft(15 * 60);
      setIsRunning(false);
      toast.success(`Moving to Quarter ${currentQuarter + 1}`);
    } else {
      toast.info("Game complete! Reset to start a new game.");
    }
  };

  const resetGame = () => {
    setCurrentQuarter(1);
    setTimeLeft(15 * 60);
    setIsRunning(false);
    setQuarterScores([
      { home: 0, away: 0 },
      { home: 0, away: 0 },
      { home: 0, away: 0 },
      { home: 0, away: 0 },
    ]);
    toast.success("Game reset!");
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="min-h-screen bg-background dark p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {/* Title */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={soccerBall} alt="Soccer ball" className="h-8 w-8" />
          <h1 className="text-3xl font-bold text-foreground">Scoreboard</h1>
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              size="lg"
              onClick={nextQuarter}
              disabled={currentQuarter >= 4}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <SkipForward className="h-5 w-5" />
              <span>Next</span>
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={resetGame}
              className="gap-2"
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
                className={`p-2 rounded-md text-center ${
                  index + 1 === currentQuarter ? "bg-primary text-primary-foreground" : "bg-muted"
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
