"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
}

export function VoiceModal({ isOpen, onClose, articleId, articleTitle }: VoiceModalProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startConnection = async () => {
    setStatus("connecting");
    setError(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create WebSocket connection
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      const ws = new WebSocket(`${wsUrl}/voice/ws?articleId=${articleId}`);
      
      ws.onopen = () => {
        setStatus("connected");
        setIsListening(true);
        
        // Start recording
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg",
        });
        
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };
        
        mediaRecorder.start(1000); // Send data every second
        mediaRecorderRef.current = mediaRecorder;
        webSocketRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "transcript") {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: data.role as "user" | "assistant",
                content: data.content,
                timestamp: new Date(),
              },
            ]);
          } else if (data.type === "error") {
            setError(data.message);
          }
        } catch (e) {
          // Handle non-JSON messages
        }
      };

      ws.onerror = () => {
        setStatus("error");
        setError("Connection error. Please try again.");
      };

      ws.onclose = () => {
        setStatus("idle");
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
      };
    } catch (err) {
      setStatus("error");
      setError("Microphone access denied. Please enable microphone permissions.");
    }
  };

  const endCall = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setStatus("idle");
    setIsListening(false);
    onClose();
  };

  const sendTextMessage = () => {
    if (!inputValue.trim() || !webSocketRef.current) return;

    const message: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    webSocketRef.current.send(JSON.stringify({ type: "text", content: inputValue }));
    setInputValue("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={endCall}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4 bg-[#111111] rounded-xl border border-[#1c1c1c] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1c1c1c]">
              <div>
                <h2 className="text-lg font-semibold text-white">Talk about this article</h2>
                <p className="text-sm text-[#525252] truncate max-w-xs">{articleTitle}</p>
              </div>
              <button
                onClick={endCall}
                className="p-2 rounded-lg hover:bg-[#111111] text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {status === "idle" && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#111111] flex items-center justify-center">
                    <Mic className="w-10 h-10 text-[#4ade80]" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Ready to discuss this article?
                  </h3>
                  <p className="text-sm text-[#525252] mb-6">
                    Click below to start a voice conversation with Nomi about this article.
                  </p>
                  <Button variant="primary" size="lg" onClick={startConnection}>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Voice Chat
                  </Button>
                </div>
              )}

              {status === "connecting" && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#4ade80] animate-spin" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Connecting to Nomi...
                  </h3>
                  <p className="text-sm text-[#525252]">
                    Setting up voice connection
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <MicOff className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Connection Error
                  </h3>
                  <p className="text-sm text-red-400 mb-6">{error}</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={endCall}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={startConnection}>
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {status === "connected" && (
                <>
                  {/* Waveform Visualization */}
                  <div className="flex items-center justify-center gap-1 h-16">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 text-[#4ade80] rounded-full"
                        animate={{
                          height: isListening 
                            ? `${Math.random() * 40 + 10}px`
                            : "8px",
                        }}
                        transition={{
                          duration: 0.2,
                          repeat: isListening ? Infinity : 0,
                          delay: i * 0.05,
                        }}
                      />
                    ))}
                  </div>

                  {/* Transcript */}
                  <div className="h-64 overflow-y-auto space-y-3 p-2">
                    {messages.length === 0 ? (
                      <div className="text-center text-[#525252] py-8">
                        <p>Start talking or type a message...</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2 ${
                              message.role === "user"
                                ? "bg-[#111111] text-[#4ade80] border border-[#1c1c1c]"
                                : "bg-[#111111] text-zinc-200"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.role === "user" ? "text-[#e5e5e5]" : "text-[#525252]"
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendTextMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-[#111111] border border-[#1c1c1c] rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4ade80]"
                    />
                    <Button variant="primary" onClick={sendTextMessage} disabled={!inputValue.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* End Call */}
                  <div className="flex justify-center">
                    <Button variant="danger" onClick={endCall}>
                      <MicOff className="w-4 h-4 mr-2" />
                      End Conversation
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
