"use client";

import React from "react";

import { useState, useRef } from "react";
import { Music, Check, Play, Pause, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const musicOptions = [
  {
    id: "upbeat",
    name: "Upbeat & Modern",
    description: "Energetic and contemporary feel",
    audioUrl: "https://cdn.pixabay.com/audio/2024/11/04/audio_ae21c79c5e.mp3",
  },
  {
    id: "elegant",
    name: "Elegant & Sophisticated",
    description: "Classic and refined atmosphere",
    audioUrl: "https://cdn.pixabay.com/audio/2024/09/19/audio_0f3f3a1e70.mp3",
  },
  {
    id: "calm",
    name: "Calm & Relaxing",
    description: "Peaceful and serene mood",
    audioUrl: "https://cdn.pixabay.com/audio/2024/08/12/audio_bc0e740592.mp3",
  },
  {
    id: "cinematic",
    name: "Cinematic & Epic",
    description: "Dramatic and impactful",
    audioUrl: "https://cdn.pixabay.com/audio/2024/10/08/audio_39e7d15e88.mp3",
  },
  {
    id: "inspiring",
    name: "Inspiring & Motivational",
    description: "Uplifting and positive energy",
    audioUrl: "https://cdn.pixabay.com/audio/2024/07/19/audio_e8359fba30.mp3",
  },
  {
    id: "custom",
    name: "Custom / No Music",
    description: "Upload your own or no music",
    audioUrl: null,
  },
];

interface MusicSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  customAudioFile?: File | null;
  onCustomAudioChange?: (file: File | null) => void;
}

export function MusicSelector({
  selected,
  onSelect,
  customAudioFile,
  onCustomAudioChange,
}: MusicSelectorProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (
    e: React.MouseEvent,
    optionId: string,
    audioUrl: string | null
  ) => {
    e.stopPropagation();

    if (!audioUrl) return;

    if (playingId === optionId) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(optionId);
    }
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCustomAudioChange) {
      onCustomAudioChange(file);
    }
  };

  const handleRemoveCustomAudio = () => {
    if (onCustomAudioChange) {
      onCustomAudioChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            Select Background Music
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose the mood for your video
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {musicOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              selected === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {selected === option.id && (
              <div className="absolute top-3 right-3">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex items-start gap-3">
              {option.audioUrl ? (
                <button
                  type="button"
                  onClick={(e) =>
                    handlePlayPause(e, option.id, option.audioUrl)
                  }
                  className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                  aria-label={playingId === option.id ? "Pause" : "Play"}
                >
                  {playingId === option.id ? (
                    <Pause className="h-4 w-4 text-primary" />
                  ) : (
                    <Play className="h-4 w-4 text-primary ml-0.5" />
                  )}
                </button>
              ) : (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Music className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground pr-6">
                  {option.name}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Audio Upload */}
      {selected === "custom" && (
        <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-border">
          <p className="text-sm font-medium text-foreground mb-3">
            Upload your own audio file (optional)
          </p>
          {customAudioFile ? (
            <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Music className="h-5 w-5 text-primary" />
                <span className="text-sm text-foreground truncate max-w-[200px]">
                  {customAudioFile.name}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveCustomAudio}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id="custom-audio-upload"
                accept="audio/*"
                onChange={handleCustomAudioUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("custom-audio-upload")?.click()
                }
                className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Audio File
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supports MP3, WAV, M4A (max 10MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
