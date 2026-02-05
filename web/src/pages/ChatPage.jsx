import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { chatService } from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import toast from "react-hot-toast";
import Icon from "../components/Icon";

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    socket,
    sendMessage: socketSendMessage,
    joinConversation,
    leaveConversation,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      joinConversation(selectedConversation._id);

      return () => {
        leaveConversation(selectedConversation._id);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (socket) {
      socket.on("new_message", handleNewMessage);
      socket.on("typing_start", () => setIsTyping(true));
      socket.on("typing_stop", () => setIsTyping(false));

      return () => {
        socket.off("new_message");
        socket.off("typing_start");
        socket.off("typing_stop");
      };
    }
  }, [socket, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await chatService.getConversations();
      setConversations(response.data || []);

      // Auto-select first conversation or from URL params
      const spaceId = searchParams.get("space");
      if (response.data?.length > 0) {
        const conv = spaceId
          ? response.data.find((c) => c.parkingSpace?._id === spaceId)
          : response.data[0];
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await chatService.getMessages(conversationId);
      setMessages(response.data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversation === selectedConversation?._id) {
      setMessages((prev) => [...prev, message]);
    }

    // Update conversation list
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv._id === message.conversation) {
          return { ...conv, lastMessage: message };
        }
        return conv;
      });
      return updated.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt) -
          new Date(a.lastMessage?.createdAt),
      );
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    const otherUser = selectedConversation.participants?.find(
      (p) => p._id !== user?._id,
    );

    try {
      if (socket && socket.connected) {
        socketSendMessage(
          otherUser._id,
          newMessage,
          selectedConversation.parkingSpace?._id,
          selectedConversation._id,
        );
      } else {
        await chatService.sendMessage(
          otherUser._id,
          newMessage,
          selectedConversation.parkingSpace?._id,
        );
        fetchMessages(selectedConversation._id);
      }
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner" className="text-primary-600" size="3xl" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversations List */}
      <div
        className={`w-full md:w-80 bg-white border-r flex flex-col ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4 text-center">
            <div>
              <div className="text-4xl mb-2 text-primary-600">
                <Icon name="chat" size="3xl" />
              </div>
              <p className="text-gray-500">No conversations yet</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
              const otherUser = conv.participants?.find(
                (p) => p._id !== user?._id,
              );
              return (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors text-left ${
                    selectedConversation?._id === conv._id
                      ? "bg-primary-50"
                      : ""
                  }`}
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-semibold">
                      {otherUser?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-800 truncate">
                        {otherUser?.name || "Unknown"}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {conv.lastMessage &&
                          formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.text || "No messages yet"}
                    </p>
                    {conv.parkingSpace && (
                      <p className="text-xs text-primary-600 truncate mt-1">
                        Re: {conv.parkingSpace.title}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b bg-white flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden text-gray-600"
            >
              <Icon name="back" />
            </button>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold">
                {selectedConversation.participants
                  ?.find((p) => p._id !== user?._id)
                  ?.name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                {
                  selectedConversation.participants?.find(
                    (p) => p._id !== user?._id,
                  )?.name
                }
              </p>
              {selectedConversation.parkingSpace && (
                <p className="text-xs text-gray-500">
                  {selectedConversation.parkingSpace.title}
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => {
              const isOwn =
                message.sender?._id === user?._id ||
                message.sender === user?._id;
              const showDate =
                index === 0 ||
                formatDate(message.createdAt) !==
                  formatDate(messages[index - 1].createdAt);

              return (
                <div key={message._id || index}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-4">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  <div
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-primary-600 text-white"
                          : "bg-white text-gray-800 shadow-sm"
                      }`}
                    >
                      <p>{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${isOwn ? "text-primary-200" : "text-gray-400"}`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="btn-primary px-6"
              >
                {sendingMessage ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4 text-primary-600">
              <Icon name="chat" size="4xl" />
            </div>
            <p className="text-gray-500">
              Select a conversation to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
