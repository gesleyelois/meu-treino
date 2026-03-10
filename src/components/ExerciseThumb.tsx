"use client";

import React from "react";

interface ExerciseThumbProps {
  mediaUrl: string | null;
  name: string;
  size?: number;
}

function isImageUrl(url: string) {
  return /\.(gif|png|jpg|jpeg|webp|svg)(\?.*)?$/i.test(url);
}

export default function ExerciseThumb({ mediaUrl, name, size = 40 }: ExerciseThumbProps) {
  if (mediaUrl) {
    return (
      <span
        className="exercise-thumb shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-700/50 inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {isImageUrl(mediaUrl) ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mediaUrl}
            alt={name}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <video
            src={mediaUrl}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        )}
      </span>
    );
  }

  // Default fallback: dumbbell SVG icon with emerald accent
  return (
    <span
      className="exercise-thumb exercise-thumb--default shrink-0 overflow-hidden rounded-lg inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-400"
      >
        {/* Dumbbell icon */}
        <path d="M6.5 6.5h11M6.5 17.5h11" />
        <rect x="3" y="5" width="3.5" height="14" rx="1.2" />
        <rect x="17.5" y="5" width="3.5" height="14" rx="1.2" />
        <line x1="12" y1="6.5" x2="12" y2="17.5" />
      </svg>
    </span>
  );
}
