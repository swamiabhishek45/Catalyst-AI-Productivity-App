import { useState, useRef, useEffect, useCallback } from "react";

interface UseAssemblyAIStreamingProps {
  onFinalTranscript: (text: string) => void;
}

export function useAssemblyAIStreaming({ onFinalTranscript }: UseAssemblyAIStreamingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Clean up all audio resources
  const cleanupAudio = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch((err) => {
          console.error("Error closing AudioContext:", err);
        });
      }
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    // 1. Immediately stop capturing audio and release microphone
    cleanupAudio();

    // 2. Tell AssemblyAI we are done, allowing it to send any final transcripts
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: "Terminate" }));
      } catch (err) {
        console.error("Error sending Terminate message:", err);
        wsRef.current.close();
      }
    } else {
      setIsRecording(false);
      setIsConnecting(false);
    }
  }, [cleanupAudio]);

  const startRecording = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setPartialTranscript("");

    let stream: MediaStream;
    try {
      // 1. Request microphone permission
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      setError("Microphone access denied. Please grant microphone permissions.");
      setIsConnecting(false);
      return;
    }

    try {
      // 2. Fetch temporary token from our secure backend API
      const tokenRes = await fetch("/api/assemblyai/token");
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch authentication token.");
      }
      const { token } = await tokenRes.json();

      // 3. Establish WebSocket connection with AssemblyAI v3 Universal Streaming
      // Universal-3 Pro model: u3-rt-pro
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?token=${token}&speech_model=u3-rt-pro&sample_rate=16000`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = async () => {
        try {
          // 4. Setup Audio Context downsampled to 16000 Hz
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextClass({ sampleRate: 16000 });
          audioContextRef.current = audioContext;
          mediaStreamRef.current = stream;

          // Resume audio context if suspended (browser security)
          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }

          const source = audioContext.createMediaStreamSource(stream);
          // 4096 buffer size, 1 input channel, 1 output channel
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Convert Float32 audio data to signed 16-bit PCM (Int16)
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }

            if (socket.readyState === WebSocket.OPEN) {
              socket.send(pcmData.buffer);
            }
          };

          source.connect(processor);
          processor.connect(audioContext.destination);

          setIsRecording(true);
          setIsConnecting(false);
        } catch (err: any) {
          console.error("Audio recording setup error:", err);
          setError("Failed to initialize microphone stream.");
          cleanupAudio();
          socket.close();
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "Turn") {
            const transcriptText = data.transcript || "";
            if (data.end_of_turn) {
              // Turn finalized - insert into editor
              onFinalTranscript(transcriptText);
              setPartialTranscript("");
            } else {
              // Turn ongoing - show as live preview
              setPartialTranscript(transcriptText);
            }
          } else if (data.type === "Error") {
            console.error("AssemblyAI WebSocket Error message:", data);
            setError(data.message || "An error occurred with the Speech-to-Text service.");
            stopRecording();
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      socket.onerror = (event) => {
        console.error("WebSocket connection error:", event);
        setError("WebSocket connection failed.");
        stopRecording();
      };

      socket.onclose = () => {
        setIsRecording(false);
        setIsConnecting(false);
        setPartialTranscript("");
        wsRef.current = null;
      };

    } catch (err: any) {
      console.error("Failed to connect to AssemblyAI streaming API:", err);
      setError(err.message || "Failed to connect to Speech-to-Text streaming.");
      setIsConnecting(false);
      cleanupAudio();
    }
  }, [onFinalTranscript, stopRecording, cleanupAudio]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [cleanupAudio]);

  return {
    isRecording,
    isConnecting,
    partialTranscript,
    error,
    startRecording,
    stopRecording,
  };
}
