import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMessages, sendMessage as sendMessageAPI } from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { COLORS } from "../constants/config";
import { format } from "date-fns";
import Icon from "../components/Icon";

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, receiverId, receiverName, parkingSpaceId } =
    route.params;
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    onNewMessage,
    onUserTyping,
    onUserStoppedTyping,
  } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const currentConversationId = useRef(conversationId);

  // Update ref when conversationId changes
  useEffect(() => {
    currentConversationId.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [conversationId, receiverId]);

  // Socket listeners using context methods
  useEffect(() => {
    if (!socket) return;

    // Join conversation room
    if (conversationId) {
      socket.emit("join_conversation", conversationId);
    }

    // Handle new messages
    const handleNewMessage = (data) => {
      // Handle both formats: { message } or direct message object
      const message = data.message || data;

      // Only add if it's for this conversation and not from current user
      if (message.sender?._id !== user?._id && message.sender !== user?._id) {
        // Check if message belongs to current conversation
        if (
          !data.conversationId ||
          data.conversationId === currentConversationId.current
        ) {
          setMessages((prevMessages) => {
            // Avoid duplicates
            const exists = prevMessages.some((m) => m._id === message._id);
            if (exists) return prevMessages;
            return [...prevMessages, message];
          });
          scrollToBottom();
        }
      }
    };

    // Handle typing indicators
    const handleTypingStart = (data) => {
      if (
        data.userId !== user?._id &&
        data.conversationId === currentConversationId.current
      ) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (
        data.userId !== user?._id &&
        data.conversationId === currentConversationId.current
      ) {
        setIsTyping(false);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTypingStart);
    socket.on("user_stopped_typing", handleTypingStop);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTypingStart);
      socket.off("user_stopped_typing", handleTypingStop);

      if (conversationId) {
        socket.emit("leave_conversation", conversationId);
      }
    };
  }, [socket, conversationId, user?._id]);

  const fetchMessages = async () => {
    // If no conversationId, this is a new conversation - no messages yet
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const result = await getMessages(conversationId);
      setMessages(result.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const onSend = async () => {
    if (!inputText.trim() || sending) return;

    const tempId = Date.now().toString();
    const newMessage = {
      _id: tempId,
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
      sender: { _id: user?._id, name: user?.name },
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputText("");
    setSending(true);
    scrollToBottom();

    try {
      const result = await sendMessageAPI(
        receiverId,
        newMessage.text,
        parkingSpaceId,
      );

      // Update conversation ID if this is a new conversation
      if (result.data?.conversation && !currentConversationId.current) {
        currentConversationId.current = result.data.conversation;
      }

      // Emit socket event for real-time delivery
      if (socket && isConnected) {
        socket.emit("send_message", {
          conversationId: currentConversationId.current || conversationId,
          receiverId,
          message: {
            ...newMessage,
            _id: result.data?._id || tempId,
          },
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) =>
        prevMessages.filter((m) => m._id !== tempId),
      );
    } finally {
      setSending(false);
    }
  };

  const onInputTextChanged = (text) => {
    setInputText(text);

    if (!socket || !isConnected) return;

    socket.emit("typing_start", { receiverId, conversationId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { receiverId, conversationId });
    }, 2000);
  };

  const renderMessage = ({ item }) => {
    if (!item) return null;
    const senderId = item.sender?._id || item.sender;
    const isMe = senderId === user?._id;
    const messageTime = item.createdAt ? format(new Date(item.createdAt), "HH:mm") : "";

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size="lg" color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{receiverName}</Text>
          {isConnected ? (
            <Text style={styles.onlineStatus}>Online</Text>
          ) : (
            <Text style={styles.offlineStatus}>Offline</Text>
          )}
        </View>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start the conversation by sending a message
              </Text>
            </View>
          }
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{receiverName} is typing...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={onInputTextChanged}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.gray[400]}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={onSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  backButton: {
    fontSize: 24,
    color: COLORS.gray[700],
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  onlineStatus: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  offlineStatus: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[400],
    marginTop: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  theirMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.gray[100],
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: COLORS.white,
  },
  theirMessageText: {
    color: COLORS.text.primary,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  theirMessageTime: {
    color: COLORS.gray[500],
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    backgroundColor: COLORS.card,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.gray[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text.primary,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ChatScreen;
