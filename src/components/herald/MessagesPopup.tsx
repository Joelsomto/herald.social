import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, MessageCircle, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getConversations,
  getConversation,
  sendMessage,
  markMessageRead,
  type Conversation,
  type DirectMessage,
} from '@/lib/api/messages';
import { searchUsers } from '@/lib/api/users';
import type { ApiUser } from '@/lib/api/types';

interface MessagesPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 10_000; // refresh active conversation every 10 s

export function MessagesPopup({ isOpen, onClose }: MessagesPopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations when popup opens
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    try {
      const data = await getConversations({ limit: 50 });
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
    }
  }, [user, isOpen, fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(
    async (convUserId: string, markRead = false) => {
      if (!user) return;
      try {
        const response = await getConversation(convUserId, { limit: 100 });
        const items: DirectMessage[] = Array.isArray(response)
          ? response
          : (response as any)?.data ?? [];
        // Messages come back newest-first from the API, reverse for display
        setMessages([...items].reverse());

        // Mark unread messages from the other user as read
        if (markRead) {
          const unread = items.filter(
            (m) => m.sender_id !== user.id && !m.read
          );
          await Promise.all(unread.map((m) => markMessageRead(m.id).catch(() => null)));
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    },
    [user]
  );

  // Start/stop polling when a conversation is selected
  useEffect(() => {
    if (selectedConv) {
      setLoadingMsgs(true);
      fetchMessages(selectedConv.user.id, true).finally(() => setLoadingMsgs(false));

      pollRef.current = setInterval(
        () => fetchMessages(selectedConv.user.id, true),
        POLL_INTERVAL_MS
      );
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedConv, fetchMessages]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConv || !newMessage.trim() || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const msg = await sendMessage(selectedConv.user.id, content);
      setMessages((prev) => [...prev, msg]);
      // Refresh conversations so last_message updates
      fetchConversations();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      setNewMessage(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await searchUsers({ q: query, limit: 5 });
          const users: ApiUser[] = Array.isArray(result)
            ? result
            : (result as any)?.data ?? (result as any)?.results ?? [];
          setSearchResults(users.filter((u) => u.id !== user?.id));
        } catch {
          setSearchResults([]);
        }
      }, 400);
    },
    [user]
  );

  const handleStartConversation = (profile: ApiUser) => {
    const conv: Conversation = {
      user: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url ?? null,
      },
      last_message: null,
      last_message_at: null,
      unread_count: 0,
    };
    setSelectedConv(conv);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <Card className="w-80 sm:w-96 h-[500px] bg-card border-border shadow-elevated flex flex-col">
        {/* Header */}
        <CardHeader className="p-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            {selectedConv ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedConv(null);
                    setMessages([]);
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedConv.user.avatar_url ?? ''} />
                  <AvatarFallback className="bg-secondary text-sm font-bold">
                    {selectedConv.user.display_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {selectedConv.user.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{selectedConv.user.username}
                  </p>
                </div>
              </div>
            ) : (
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Messages
              </CardTitle>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          {!selectedConv ? (
            <>
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users to message…"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {searchResults.map((profile) => (
                      <div
                        key={profile.id}
                        onClick={() => handleStartConversation(profile)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={profile.avatar_url ?? ''} />
                          <AvatarFallback className="bg-secondary text-sm font-bold">
                            {profile.display_name?.[0]?.toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{profile.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{profile.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                {loadingConvs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Search for users to start chatting</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user.id}
                      onClick={() => handleSelectConversation(conv)}
                      className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer border-b border-border/50"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conv.user.avatar_url ?? ''} />
                        <AvatarFallback className="bg-secondary font-bold">
                          {conv.user.display_name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-foreground">
                            {conv.user.display_name}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message ?? 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  placeholder="Type a message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="bg-secondary border-border"
                  disabled={sending}
                />
                <Button
                  variant="gold"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
