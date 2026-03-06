"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface RestTimerProps {
    seconds: number;
    onComplete?: () => void;
    autoStart?: boolean;
}

export default function RestTimer({
    seconds,
    onComplete,
    autoStart = false,
}: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isRunning, setIsRunning] = useState(autoStart);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearTimer();
                        setIsRunning(false);
                        // Vibrate on completion
                        if (typeof navigator !== "undefined" && navigator.vibrate) {
                            navigator.vibrate([200, 100, 200]);
                        }
                        onComplete?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return clearTimer;
    }, [isRunning, timeLeft, clearTimer, onComplete]);

    const start = () => {
        if (timeLeft === 0) setTimeLeft(seconds);
        setIsRunning(true);
    };

    const pause = () => {
        setIsRunning(false);
        clearTimer();
    };

    const reset = () => {
        setIsRunning(false);
        clearTimer();
        setTimeLeft(seconds);
    };

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const progress = seconds > 0 ? ((seconds - timeLeft) / seconds) * 100 : 0;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Circular progress */}
            <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="6"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        stroke={timeLeft === 0 ? "#059669" : "#f59e0b"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                        className="transition-all duration-1000 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums text-amber-500">
                        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
                {!isRunning ? (
                    <button
                        onClick={start}
                        className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium 
                       transition-colors active:scale-95"
                    >
                        {timeLeft === 0 ? "Reiniciar" : timeLeft === seconds ? "Iniciar" : "Continuar"}
                    </button>
                ) : (
                    <button
                        onClick={pause}
                        className="h-10 px-5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium 
                       transition-colors active:scale-95"
                    >
                        Pausar
                    </button>
                )}
                {timeLeft !== seconds && (
                    <button
                        onClick={reset}
                        className="h-10 px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium 
                       transition-colors active:scale-95"
                    >
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
}
