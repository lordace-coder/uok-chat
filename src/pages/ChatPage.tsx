import { useState, useEffect, useRef } from "react";
import {
  Send,
  Users,
  LogOut,
  MessageSquare,
  Sparkles,
  Heart,
} from "lucide-react";
import { pb } from "../lib/pocketbase";
import type { AuthRecord } from "pocketbase";

// PocketBase Configuration

interface Message {
  id: string;
  text: string;
  userId: string;
  created: string;
  expand?: any;
}

interface User {
  id: string;
  email: string;
}

export default function UKChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const currentUser: AuthRecord = pb.authStore.record;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const records = await pb
        .collection("messages")
        .getFullList({ expand: "userId" });
      setMessages(records as any);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const subscribeToMessages = () => {
    pb.collection("messages").subscribe(
      "*",
      function (e) {
        if (e.action == "create") {
          if (e.record.userId == pb.authStore.record?.id) {
            return;
          }
          setMessages((prev) => {
            // Check if the message already exists
            const exists = prev.some((msg) => msg.id === e.record.id);
            if (exists) return prev; // Don't add duplicates

            // Add the new message
            return [
              ...prev,
              {
                created: e.record.created,
                id: e.record.id,
                text: e.record.text,
                userId: e.record.userId,
                expand: e.record.expand,
              },
            ];
          });
        }
      },
      {
        expand: "userId",
      }
    );
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      const _txt = newMessage;
      setMessages([
        ...messages,
        {
          created: new Date().toISOString(),
          id: currentUser.id,
          text: newMessage,
          userId: currentUser.id,
        },
      ]);
      setNewMessage("");
      await pb.collection("messages").create({
        text: _txt,
        userId: currentUser.id,
      });
      ("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/3 w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "4s" }}
      ></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-pink-200/50 px-4 py-4 shadow-sm relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 hover:rotate-3 transition duration-300">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                  UK Student Chat
                </h1>
                <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
              </div>
              <p className="text-xs text-gray-600 font-medium">
                University of Kigali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
              <Users className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-semibold text-gray-700">
                {currentUser?.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-pink-600 bg-white border-2 border-pink-300 rounded-xl hover:bg-pink-50 hover:border-pink-400 transition duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 relative z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full mb-4 shadow-lg">
                <MessageSquare className="w-10 h-10 text-pink-500" />
              </div>
              <p className="text-gray-500 font-medium mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">
                Start the conversation! ✨
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.userId === currentUser?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  } animate-fadeIn`}
                >
                  <div className="max-w-md">
                    <div
                      className={`flex items-center gap-2 mb-1.5 px-2 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOwnMessage && (
                        <span className="text-xs font-bold text-pink-600">
                          {message.expand?.userId?.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 font-medium">
                        {formatTime(message.created)}
                      </span>
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md transition duration-300 hover:shadow-lg ${
                        isOwnMessage
                          ? "bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 text-white"
                          : "bg-white/90 backdrop-blur-sm border-2 border-pink-200/50 text-gray-800"
                      }`}
                    >
                      <p className="text-sm break-words leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-lg border-t border-pink-200/50 p-4 shadow-lg relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... 💬"
              className="flex-1 px-4 py-3 border-2 border-pink-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 bg-white/70 backdrop-blur-sm placeholder-gray-400 hover:border-pink-300"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-5 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white rounded-2xl font-bold hover:from-pink-600 hover:via-rose-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 disabled:hover:scale-100"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
