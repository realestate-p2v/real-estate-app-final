"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music, Loader2, Check, Sparkles } from "lucide-react";

const VIBE_PRESETS = [
  { key: "upbeat_modern", label: "Upbeat Modern", emoji: "🎵" },
  { key: "chill_tropical", label: "Chill Tropical", emoji: "🌴" },
  { key: "energetic_pop", label: "Energetic Pop", emoji: "⚡" },
  { key: "elegant_classical", label: "Elegant Classical", emoji: "🎹" },
  { key: "warm_acoustic", label: "Warm Acoustic", emoji: "🎸" },
  { key: "bold_cinematic", label: "Bold Cinematic", emoji: "🎬" },
  { key: "funky_groove", label: "Funky Groove", emoji: "🎷" },
  { key: "smooth_jazz", label: "Smooth Jazz", emoji: "🎺" },
  { key: "ambient", label: "Ambient", emoji: "🌙" },
];

interface MusicSelectorProps {
  selected: string;
  onSelect: (selection: string) => void;
  customAudioFile: File | null;
  onCustomAudioChange: (file: File | null) => void;
  photoCount?: number;
}

export function MusicSelector({
  selected,
  onSelect,
  customAudioFile,
  onCustomAudioChange,
  photoCount = 10,
}: MusicSelectorProps) {
  const [tab, setTab] = useState<"browse" | "generate">("browse");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioPermission, setAudioPermission] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [libraryTracks, setLibraryTracks] = useState<any[]>([]);
  const [libraryFilter, setLibraryFilter] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);

  const fetchLibrary = async (vibe: string = "") => {
    setLibraryLoading(true);
    try {
      const resp = await fetch(`/api/generate-music?library=true&vibe=${vibe}`);
      const data = await resp.json();
      setLibraryTracks(data.tracks || []);
    } catch (e) {
      console.error("Library fetch error:", e);
    }
    setLibraryLoading(false);
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  // Stop audio playback when component unmounts (e.g. navigating to next wizard step)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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

  const getPlayingTrackName = () => {
    if (!playingTrackId) return "";
    const track = libraryTracks.find(t => t.id === playingTrackId);
    return track?.display_name || "";
  };

  return (
    <div className="space-y-4">
      <style jsx>{`
        @keyframes scroll-text {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .scroll-text {
          animation: scroll-text 8s linear infinite;
        }
      `}</style>

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
            Generate Custom (Coming Soon)
          </span>
        </button>
      </div>

      {/* Browse Library Tab */}
      {tab === "browse" && (
        <div className="space-y-2">
          {/* Vibe filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => { setLibraryFilter(""); fetchLibrary(""); }}
              className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${
                libraryFilter === "" ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border hover:bg-muted"
              }`}
            >
              All
            </button>
            {VIBE_PRESETS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => { setLibraryFilter(v.key); fetchLibrary(v.key); }}
                className={`text-xs py-1.5 px-3 rounded-lg border transition-all ${
                  libraryFilter === v.key ? "bg-primary/10 border-primary text-primary font-semibold" : "border-border hover:bg-muted"
                }`}
              >
                {v.emoji} {v.label}
              </button>
            ))}
          </div>

          {libraryLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </div>
          ) : libraryTracks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tracks found</p>
          ) : (
            <div className={`space-y-2 ${libraryTracks.length > 10 ? "max-h-[500px] overflow-y-auto pr-2" : ""}`}>
              {libraryTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => onSelect(`library:${track.id}:${track.file_url}`)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    selected.includes(track.id) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePlayTrack(track.id, track.file_url); }}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                        playingTrackId === track.id ? "bg-primary text-white" : "bg-primary/10 hover:bg-primary/20"
                      }`}
                    >
                      {playingTrackId === track.id ? (
                        <span className="text-xs font-bold">■</span>
                      ) : (
                        <span className="text-primary text-xs font-bold ml-0.5">▶</span>
                      )}
                    </button>
                    <div>
                      <span className="font-medium text-sm">{track.display_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{track.duration_seconds}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0 ml-3">
                    {playingTrackId === track.id && (
                      <div className="overflow-hidden flex-1 max-w-[200px]">
                        <div className="scroll-text whitespace-nowrap text-xs font-semibold text-primary flex items-center gap-1.5">
                          <span>♪</span> Now Playing — {track.display_name}
                        </div>
                      </div>
                    )}
                    {selected.includes(track.id) && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Custom audio upload */}
          <div className="pt-3 border-t border-border mt-3">
            <p className="text-xs text-muted-foreground mb-2">Or upload your own audio:</p>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                onCustomAudioChange(file);
                if (file) { onSelect("custom"); setAudioPermission(false); }
              }}
              className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {customAudioFile && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-green-600">✓ {customAudioFile.name}</p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioPermission}
                    onChange={(e) => { setAudioPermission(e.target.checked); if (!e.target.checked) { onCustomAudioChange(null); onSelect(""); } }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">I have permission to use this audio track.</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Custom Tab — Coming Soon */}
      {tab === "generate" && (
        <div className="text-center py-8 space-y-3">
          <Sparkles className="h-10 w-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Custom AI Music Generation</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Soon you&apos;ll be able to generate custom music tracks tailored to your listing&apos;s vibe. Choose from 9 styles including Upbeat Modern, Chill Tropical, Elegant Classical, and more.
          </p>
          <p className="text-xs text-muted-foreground">
            In the meantime, browse our library of curated tracks — there&apos;s something for every listing.
          </p>
        </div>
      )}
    </div>
  );
}
