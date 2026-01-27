"use client";

import { useState, useRef } from "react";
import { Check, Mic, Play, Pause } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const voiceoverOptions = [
  {
    id: "none",
    name: "No Voiceover",
    description: "Music only",
    price: 0,
  },
  {
    id: "voiceover",
    name: "Professional Voiceover",
    description: "AI-generated narration describing the property",
    price: 25,
  },
];

const voiceOptions = [
  {
    id: "male-1",
    name: "James",
    gender: "male",
    description: "Deep, warm and professional",
    audioUrl: "https://cdn.themetavoice.xyz/speakers/bria.mp3",
  },
  {
    id: "male-2",
    name: "Michael",
    gender: "male",
    description: "Clear, friendly and engaging",
    audioUrl: "https://cdn.themetavoice.xyz/speakers/alex.mp3",
  },
  {
    id: "female-1",
    name: "Sarah",
    gender: "female",
    description: "Warm, inviting and articulate",
    audioUrl: "https://cdn.themetavoice.xyz/speakers/zoe.mp3",
  },
  {
    id: "female-2",
    name: "Emily",
    gender: "female",
    description: "Bright, energetic and confident",
    audioUrl: "https://cdn.themetavoice.xyz/speakers/jessica.mp3",
  },
];

interface VoiceoverSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  script?: string;
  onScriptChange?: (script: string) => void;
  selectedVoice?: string;
  onVoiceSelect?: (voiceId: string) => void;
}

export function VoiceoverSelector({ 
  selected, 
  onSelect, 
  script,
  onScriptChange,
  selectedVoice,
  onVoiceSelect,
}: VoiceoverSelectorProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (e: React.MouseEvent, voiceId: string, audioUrl: string) => {
    e.stopPropagation();

    if (playingId === voiceId) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(voiceId);
    }
  };

  const handleVoiceSelection = (voiceId: string) => {
    if (onVoiceSelect) {
      onVoiceSelect(voiceId);
    }
  };

  const maleVoices = voiceOptions.filter(v => v.gender === "male");
  const femaleVoices = voiceOptions.filter(v => v.gender === "female");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Voiceover</h3>
          <p className="text-sm text-muted-foreground">Add narration to your video</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {voiceoverOptions.map((option) => (
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
            <p className="font-semibold text-foreground pr-6">{option.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
            <p className="text-sm font-semibold text-primary mt-2">
              {option.price === 0 ? "Included" : `+$${option.price}`}
            </p>
          </button>
        ))}
      </div>

      {/* Voice Selection and Script Input */}
      {selected === "voiceover" && (
        <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border space-y-6">
          {/* Voice Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Select a Voice</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Choose your preferred voice for the narration. Click play to hear a sample.
              </p>
            </div>

            {/* Male Voices */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Male Voices</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {maleVoices.map((voice) => (
                  <label
                    key={voice.id}
                    htmlFor={`voice-${voice.id}`}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedVoice === voice.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      id={`voice-${voice.id}`}
                      checked={selectedVoice === voice.id}
                      onCheckedChange={() => handleVoiceSelection(voice.id)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{voice.name}</p>
                      <p className="text-sm text-muted-foreground">{voice.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handlePlayPause(e, voice.id, voice.audioUrl)}
                      className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                      aria-label={playingId === voice.id ? "Pause sample" : "Play sample"}
                    >
                      {playingId === voice.id ? (
                        <Pause className="h-4 w-4 text-primary" />
                      ) : (
                        <Play className="h-4 w-4 text-primary ml-0.5" />
                      )}
                    </button>
                  </label>
                ))}
              </div>
            </div>

            {/* Female Voices */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Female Voices</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {femaleVoices.map((voice) => (
                  <label
                    key={voice.id}
                    htmlFor={`voice-${voice.id}`}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedVoice === voice.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox
                      id={`voice-${voice.id}`}
                      checked={selectedVoice === voice.id}
                      onCheckedChange={() => handleVoiceSelection(voice.id)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{voice.name}</p>
                      <p className="text-sm text-muted-foreground">{voice.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handlePlayPause(e, voice.id, voice.audioUrl)}
                      className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                      aria-label={playingId === voice.id ? "Pause sample" : "Play sample"}
                    >
                      {playingId === voice.id ? (
                        <Pause className="h-4 w-4 text-primary" />
                      ) : (
                        <Play className="h-4 w-4 text-primary ml-0.5" />
                      )}
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Script Input */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Label htmlFor="voiceoverScript">Voiceover Script (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Provide a custom script or leave blank and we will create one for you based on the property photos.
            </p>
            <Textarea
              id="voiceoverScript"
              placeholder="Welcome to this stunning 4-bedroom home in the heart of..."
              rows={4}
              value={script || ""}
              onChange={(e) => onScriptChange?.(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
