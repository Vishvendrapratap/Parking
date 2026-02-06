import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getConversations } from "../api/services";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useUnreadMessages } from "../contexts/UnreadMessagesContext";
import { format, isToday, isYesterday } from "date-fns";
import { COLORS } from "../constants/config";
import Icon from "../components/Icon";
import Header from "../components/Header";

const ChatListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { refreshUnreadCount } = useUnreadMessages();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch conversations when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      // Refresh unread count when viewing chat list
      refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const message = data.message || data;
      const conversationId = data.conversationId;

      // Update the conversation in the list
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: message.createdAt || new Date().toISOString(),
              unreadCount: (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });

        // Sort by most recent
        return updated.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        );
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const result = await getConversations();
      setConversations(result.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "h:mm a");
    }
    if (isYesterday(messageDate)) {
      return "Yesterday";
    }
    return format(messageDate, "MMM d");
  };

  const getOtherParticipant = (conversation) => {
    // Backend returns 'participant' (singular) for the other user
    if (conversation?.participant) {
      return conversation.participant;
    }
    // Fallback for older format with participants array
    if (
      !conversation?.participants ||
      !Array.isArray(conversation.participants)
    ) {
      return null;
    }
    return conversation.participants.find((p) => p._id !== user?._id);
  };

  const renderConversationItem = ({ item }) => {
    const otherUser = getOtherParticipant(item);
    const hasUnread = item.unreadCount > 0;

    // Don't render if no other user found
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          navigation.navigate("ChatRoom", {
            conversationId: item._id,
            receiverId: otherUser._id,
            receiverName: otherUser.name,
            parkingSpaceId: item.parkingSpace?._id,
          })
        }
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          {otherUser?.profilePicture ? (
            <Image
              source={{ uri: otherUser.profilePicture }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {otherUser?.name?.charAt(0).toUpperCase() || "?"}
            </Text>
          )}
          {hasUnread && <View style={styles.unreadBadge} />}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.name, hasUnread && styles.nameUnread]}
              numberOfLines={1}
            >
              {otherUser?.name || "Unknown User"}
            </Text>
            <Text style={styles.time}>
              {item.lastMessage?.createdAt || item.updatedAt
                ? formatTime(item.lastMessage?.createdAt || item.updatedAt)
                : ""}
            </Text>
          </View>

          {item.parkingSpace && (
            <View style={styles.parkingNameRow}>
              <Icon name="mapMarker" size="xs" color={COLORS.primary} />
              <Text style={styles.parkingName} numberOfLines={1}>
                {item.parkingSpace.title}
              </Text>
            </View>
          )}

          <Text
            style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
            numberOfLines={1}
          >
            {item.lastMessage?.text || "Start a conversation"}
          </Text>
        </View>
      </TouchableOpacity>
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
      {/* Header with Logo */}
      <Header showLogo={true} />

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="comment" size="4xl" color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with parking owners{"\n"}when you view their
              listings
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    backgroundColor: COLORS.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.white,
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text.primary,
    flex: 1,
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  parkingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  parkingName: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  lastMessageUnread: {
    color: COLORS.text.primary,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ChatListScreen;
