"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Music, Loader2, ThumbsUp, ThumbsDown, Check, Sparkles } from "lucide-react";

const CURATED_TRACKS = [
  { id: "island", name: "Island", vibe: "Chill Tropical" },
  { id: "swing", name: "Swing", vibe: "Funky Groove" },
  { id: "afternoon", name: "Afternoon", vibe: "Warm Acoustic" },
  { id: "tamarindo", name: "Tamarindo", vibe: "Chill Tropical" },
  { id: "sunshine", name: "Sunshine", vibe: "Upbeat Modern" },
  { id: "star-night", name: "Star Night", vibe: "Elegant Classical" },
  { id: "energetic", name: "Energetic", vibe: "Energetic Pop" },
];

const VIBE_PRESETS = [
  { key: "upbeat_modern", label: "Upbeat Modern", emoji: "🎵" },
  { key: "chill_tropical", label: "Chill Tropical", emoji: "🌴" },
  { key: "energetic_pop", label: "Energetic Pop", emoji: "⚡" },
  { key: "elegant_classical", label: "Elegant Classical", emoji: "🎹" },
  { key: "warm_acoustic", label: "Warm Acoustic", emoji: "🎸" },
  { key: "bold_cinematic", label: "Bold Cinematic", emoji: "🎬" },
  { key: "funky_groove", label: "Funky Groove", emoji: "🎷" },
  { key: "smooth_jazz", label: "Smooth Jazz", emoji: "🎺" },
];

const CURATED_AUDIO_BASE = "/music";

interface MusicSelectorProps {
  selected: string;
  onSelect: (selection: string) => void;
  customAudioFile: File | null;
  onCustomAudioChange: (file: File | null) => void;
  photoCount?: number;
}

interface GeneratedTrack {
  id: string;
  audioUrl: string;
  streamUrl?: string;
  title: string;
  duration?: number;
  vote?: "up" | "down" | null;
}

export function MusicSelector({
  selected,
  onSelect,
  customAudioFile,
  onCustomAudioChange,
  photoCount = 10,
}: MusicSelectorProps) {
  const [tab, setTab] = useState<"browse" | "generate">("browse");
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioPermission, setAudioPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayTrack = (trackId: string, audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingTrackId === trackId) {
      setPlayingTrackId(null);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.play();
    audio.onended = () => setPlayingTrackId(null);
    audioRef.current = audio;
    setPlayingTrackId(trackId);
  };

  const handlePlayCurated = (trackId: string) => {
    const url = `${CURATED_AUDIO_BASE}/${trackId}.mp3`;
    handlePlayTrack(`curated-${trackId}`, url);
  };

  const handleGenerate = async () => {
    if (!selectedVibe) return;
    setIsGenerating(true);
    setGenerationStatus("Starting generation...");
    setGeneratedTracks([]);

    try {
      const resp = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vibe: selectedVibe, photoCount }),
      });
      const data = await resp.json();

      if (!data.success || !data.taskIds?.length) {
        throw new Error(data.error || "Generation failed");
      }

      const taskIds = data.taskIds;
      setGenerationStatus("AI is composing your tracks...");

      for (let attempt = 0; attempt < 24; attempt++) {
        await new Promise((r) => setTimeout(r, 10000));

        const pollResp = await fetch(
          `/api/generate-music?taskIds=${taskIds.join(",")}`
        );
        const pollData = await pollResp.json();

        if (pollData.tracks?.length > 0) {
          setGenerationStatus(
            `${pollData.tracks.length} track${pollData.tracks.length > 1 ? "s" : ""} ready...`
          );
        }

        if (pollData.complete) {
          if (pollData.tracks.length > 0) {
            setGeneratedTracks(
              pollData.tracks.map((t: any) => ({ ...t, vote: null }))
            );
            setGenerationCount((prev) => prev + 1);
            setGenerationStatus("");
          } else {
            setGenerationStatus("Generation failed — try again or pick a curated track.");
          }
          break;
        }

        const elapsed = (attempt + 1) * 10;
        if (elapsed < 60) {
          setGenerationStatus(`AI is composing your tracks... (${elapsed}s)`);
        } else if (elapsed < 180) {
          setGenerationStatus(`Almost done... (${elapsed}s)`);
        } else {
          // Timed out after 3 minutes
          setGenerationStatus("");
          setGenerationCount(0);
          setIsGenerating(false);
          return;
        }
      }

      // If loop completed without SUCCESS
      if (generatedTracks.length === 0 && !generationStatus.includes("failed")) {
        setGenerationStatus("");
        setGenerationCount(0);
      }
    } catch (error) {
      console.error("Music generation error:", error);
      setGenerationStatus("");
      setGenerationCount(0);
    }

    setIsGenerating(false);
  };

  const handleVoteTrack = (trackId: string, vote: "up" | "down") => {
    setGeneratedTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, vote: t.vote === vote ? null : vote } : t
      )
    );
  };

  const handleSelectGenerated = (track: GeneratedTrack) => {
    onSelect(`generated:${track.id}:${track.audioUrl}`);
    setGeneratedTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, vote: "up" } : t))
    );
  };

  const isSelectedGenerated = (trackId: string) => {
    return selected.startsWith(`generated:${trackId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-bold">Music</h3>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setTab("browse")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            tab === "browse"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          📁 Browse Library
        </button>
        <button
          type="button"
          onClick={() => setTab("generate")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            tab === "generate"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Generate Custom
          </span>
        </button>
      </div>

      {/* Browse Library Tab */}
      {tab === "browse" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Select a curated track for your video:
          </p>
          {CURATED_TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelect(track.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                selected === track.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayCurated(track.id);
                  }}
                  className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  {playingTrackId === `curated-${track.id}` ? (
                    <span className="text-primary text-xs font-bold">■</span>
                  ) : (
                    <span className="text-primary text-xs font-bold ml-0.5">▶</span>
                  )}
                </button>
                <div>
                  <span className="font-medium text-sm">{track.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {track.vibe}
                  </span>
                </div>
              </div>
              {selected === track.id && (
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </button>
          ))}

          {/* Custom audio upload */}
          <div className="pt-3 border-t border-border mt-3">
            <p className="text-xs text-muted-foreground mb-2">
              Or upload your own audio:
            </p>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onCustomAudioChange(file);
                if (file) {
                  onSelect("custom");
                  setAudioPermission(false);
                }
              }}
              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {customAudioFile && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-green-600">
                  ✓ {customAudioFile.name}
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioPermission}
                    onChange={(e) => {
                      setAudioPermission(e.target.checked);
                      if (!e.target.checked) {
                        onCustomAudioChange(null);
                        onSelect("");
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    I have permission to use this audio track.
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Custom Tab */}
      {tab === "generate" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a vibe and our AI will compose 4 custom tracks for your
            video:
          </p>

          {/* Vibe picker */}
          <div className="grid grid-cols-2 gap-2">
            {VIBE_PRESETS.map((vibe) => (
              <button
                key={vibe.key}
                type="button"
                onClick={() => setSelectedVibe(vibe.key)}
                className={`p-3 rounded-xl border text-left text-sm transition-all ${
                  selectedVibe === vibe.key
                    ? "border-primary bg-primary/5 ring-1 ring-primary font-semibold"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="mr-1.5">{vibe.emoji}</span>
                {vibe.label}
              </button>
            ))}
          </div>

          {/* Generate button — free first time, login required after */}
          {generationCount === 0 ? (
            <div>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedVibe || isGenerating}
                className="w-full py-5 text-base"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {generationStatus || "Generating..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate 4 Custom Tracks — FREE
                  </span>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                AI-generated music · ~2 minutes · No account needed
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="w-full py-5 text-base"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Login to Generate More Custom AI Music
                </span>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Free account required · 2 generations per day · 4 tracks each
              </p>
            </div>
          )}

          {/* Generation status */}
          {isGenerating && generationStatus && (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{generationStatus}</p>
              <p className="text-xs text-muted-foreground mt-1">
                This usually takes 2–3 minutes
              </p>
            </div>
          )}

          {/* Timeout/error message */}
          {!isGenerating && generatedTracks.length === 0 && generationCount === 0 && tab === "generate" && selectedVibe && (
            <div className="text-center py-4 px-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-800">
                Our AI music service is temporarily busy.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Please try again shortly, or select a track from the Browse Library tab.
              </p>
            </div>
          )}

          {/* Generated tracks */}
          {generatedTracks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Your Generated Tracks
              </p>
              {generatedTracks.map((track, i) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelectedGenerated(track.id)
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Play button */}
                    <button
                      type="button"
                      onClick={() =>
                        handlePlayTrack(track.id, track.streamUrl || track.audioUrl)
                      }
                      className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      {playingTrackId === track.id ? (
                        <span className="text-primary text-xs font-bold">■</span>
                      ) : (
                        <span className="text-primary text-xs font-bold ml-0.5">▶</span>
                      )}
                    </button>
                    <div>
                      <span className="font-medium text-sm">Option {i + 1}</span>
                      {track.duration && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round(track.duration)}s
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Thumbs up */}
                    <button
                      type="button"
                      onClick={() => handleVoteTrack(track.id, "up")}
                      className={`p-1.5 rounded-lg transition-all ${
                        track.vote === "up"
                          ? "bg-green-100 text-green-600"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>

                    {/* Thumbs down */}
                    <button
                      type="button"
                      onClick={() => handleVoteTrack(track.id, "down")}
                      className={`p-1.5 rounded-lg transition-all ${
                        track.vote === "down"
                          ? "bg-red-100 text-red-600"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>

                    {/* Select button */}
                    <button
                      type="button"
                      onClick={() => handleSelectGenerated(track)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isSelectedGenerated(track.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      {isSelectedGenerated(track.id) ? "✓ Selected" : "Use This"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
