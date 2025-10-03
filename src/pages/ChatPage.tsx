import { useState, useEffect, useRef } from "react";
import { Send, Users, LogOut, MessageSquare } from "lucide-react";
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
          setMessages((prev) => [
            ...prev,
            {
              created: e.record.created,
              id: e.record.id,
              text: e.record.text,
              userId: e.record.userId,
              expand: e.record.expand, // keep expand if you need
            },
          ]);
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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                UK Student Chat
              </h1>
              <p className="text-xs text-gray-500">University of Kigali</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4" />
              <span className="text-sm">{currentUser?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                No messages yet. Start the conversation!
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
                  }`}
                >
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {!isOwnMessage && (
                        <span className="text-xs text-gray-600 font-medium">
                          {message.expand?.userId?.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(message.created)}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded ${
                        isOwnMessage
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
