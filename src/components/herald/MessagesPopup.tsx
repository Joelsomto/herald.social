import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface MessagesPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagesPopup({ isOpen, onClose }: MessagesPopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const subscribeToMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel('messages-popup')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (selectedConversation && newMsg.sender_id === selectedConversation.user_id) {
            setMessages(prev => [...prev, newMsg]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!messagesData) return;

    const conversationMap = new Map<string, any>();
    
    for (const msg of messagesData) {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          user_id: otherUserId,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread_count: msg.receiver_id === user.id && !msg.read ? 1 : 0,
        });
      } else if (msg.receiver_id === user.id && !msg.read) {
        const conv = conversationMap.get(otherUserId);
        conv.unread_count += 1;
      }
    }

    const userIds = Array.from(conversationMap.keys());
    if (userIds.length === 0) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', userIds);

    if (profiles) {
      const convList: Conversation[] = profiles.map(profile => ({
        id: profile.user_id,
        user_id: profile.user_id,
        display_name: profile.display_name || 'Unknown',
        username: profile.username || 'unknown',
        avatar_url: profile.avatar_url,
        ...conversationMap.get(profile.user_id),
      }));

      setConversations(convList.sort((a, b) => 
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
      ));
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.user_id);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedConversation.user_id,
      content: newMessage.trim(),
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } else {
      setNewMessage('');
      fetchMessages(selectedConversation.user_id);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .neq('user_id', user?.id)
      .limit(5);

    if (data) setSearchResults(data);
  };

  const handleStartConversation = (profile: any) => {
    setSelectedConversation({
      id: profile.user_id,
      user_id: profile.user_id,
      display_name: profile.display_name || 'Unknown',
      username: profile.username || 'unknown',
      avatar_url: profile.avatar_url,
      unread_count: 0,
    });
    setSearchQuery('');
    setSearchResults([]);
    fetchMessages(profile.user_id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <Card className="w-80 sm:w-96 h-[500px] bg-card border-border shadow-elevated flex flex-col">
        <CardHeader className="p-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            {selectedConversation ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                  {selectedConversation.display_name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{selectedConversation.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{selectedConversation.username}</p>
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
          {!selectedConversation ? (
            <>
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {searchResults.map((profile) => (
                      <div
                        key={profile.user_id}
                        onClick={() => handleStartConversation(profile)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                          {profile.display_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{profile.display_name}</p>
                          <p className="text-xs text-muted-foreground">@{profile.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Search for users to start chatting</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer border-b border-border/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                        {conv.display_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-foreground">{conv.display_name}</p>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
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
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-secondary border-border"
                />
                <Button
                  variant="gold"
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
