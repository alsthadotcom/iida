
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuthUser } from '../src/hooks/useAuthUser';
import { supabase } from '../services/supabase';
import { ChatService } from '../services/chat';
import { getUserInfoById } from '../services/database';
import type { Conversation, Message } from '../types/chat';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    ChevronLeftIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { AutoResizeTextarea } from './AutoResizeTextarea';

type ViewArgs = 'inbox' | 'thread';

interface OpenChatDetail {
    userId: string;
    userName?: string;
}

export const ChatWidget: React.FC = () => {
    const { user } = useAuthUser();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<ViewArgs>('inbox');
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [activeThreadName, setActiveThreadName] = useState<string>('');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of thread
    useEffect(() => {
        if (view === 'thread' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [view, conversations, activeThreadId]);

    // Listen for custom open-chat event
    useEffect(() => {
        const handleOpenChat = async (e: Event) => {
            const detail = (e as CustomEvent<OpenChatDetail>).detail;
            console.log('ChatWidget received open-chat event:', detail);

            if (!detail) return;

            let targetUserId = detail.userId;
            let targetUserName = detail.userName;

            // Self-Healing: If ID is missing but we have a username, fetch the ID
            if (!targetUserId && targetUserName) {
                console.log('ChatWidget: Missing userId, attempting to handle by username:', targetUserName);

                const fetchIdByUsername = async (name: string) => {
                    const { data } = await supabase
                        .from('user_info')
                        .select('user_id')
                        .eq('username', name) // Try exact match
                        .maybeSingle();
                    return data?.user_id;
                };

                try {
                    // Try 1: As provided
                    let foundId = await fetchIdByUsername(targetUserName);

                    // Try 2: Strip '@' if present
                    if (!foundId && targetUserName.startsWith('@')) {
                        console.log('ChatWidget: Retrying without @ prefix...');
                        foundId = await fetchIdByUsername(targetUserName.substring(1));
                    }

                    if (foundId) {
                        console.log('ChatWidget: Resolved userId:', foundId);
                        targetUserId = foundId;
                    } else {
                        console.error('ChatWidget: Failed to resolve userId for', targetUserName);
                        alert(`Error: User '${targetUserName}' not found. Cannot start chat.`);
                        return;
                    }
                } catch (err) {
                    console.error('ChatWidget: Exception resolving user', err);
                    return;
                }
            } else if (!targetUserId) {
                return;
            }

            if (user && targetUserId === user.id) return; // Can't chat with self

            let name = targetUserName;
            // ... (rest of logic uses targetUserId)

            if (!name) {
                // Try to find in existing convos
                const existing = conversations.find(c => c.other_user_id === targetUserId);
                if (existing) {
                    name = existing.other_user_name;
                } else {
                    // Fetch name
                    try {
                        const { data } = await getUserInfoById(targetUserId!);
                        if (data) {
                            name = data.name || data.username;
                        }
                    } catch (err) {
                        console.error("Failed to fetch user name", err);
                    }
                }
            }

            setActiveThreadId(targetUserId!);
            setActiveThreadName(name || "User");
            setView('thread');
            setIsOpen(true);
        };

        window.addEventListener('ida:open-chat', handleOpenChat);
        return () => window.removeEventListener('ida:open-chat', handleOpenChat);
    }, [user, conversations]);

    // Initial Fetch & Subscription
    useEffect(() => {
        if (!user) return;

        fetchMessages();

        // Subscribe to new messages
        const subscription = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${user.id}`
                },
                (payload) => {
                    handleIncomingMessage(payload.new as Message);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    // Polling Backup: Refresh every 1 second
    useEffect(() => {
        if (!user || !isOpen) return; // Only poll when open
        const interval = setInterval(() => {
            fetchMessages(true); // true = silent refresh (no loading spinner)
        }, 1000);
        return () => clearInterval(interval);
    }, [user, isOpen]);

    // Mark as read when opening a thread
    useEffect(() => {
        if (view === 'thread' && activeThreadId && user) {
            const currentConvo = conversations.find(c => c.other_user_id === activeThreadId);

            // Only update if there are unread messages to clear, avoiding infinite loop
            if (currentConvo && currentConvo.unread_count > 0) {
                ChatService.markThreadRead(user.id, activeThreadId);
                setConversations(prev => prev.map(c =>
                    c.other_user_id === activeThreadId
                        ? { ...c, unread_count: 0 }
                        : c
                ));
            }
        }
    }, [view, activeThreadId, conversations]);

    const fetchMessages = async (silent: boolean = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        const { conversations: data } = await ChatService.fetchConversations(user.id);
        setConversations(data);
        if (!silent) setLoading(false);
    };

    const handleIncomingMessage = async (msg: Message) => {
        await fetchMessages();
    };

    const handleSend = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!user || !activeThreadId || !newMessage.trim()) return;

        setSending(true);
        const content = newMessage;
        setNewMessage('');

        const { error } = await ChatService.sendMessage(user.id, activeThreadId, content);

        if (error) {
            alert(error);
            setNewMessage(content);
        } else {
            await fetchMessages();
        }
        setSending(false);
    };

    const activeConversation = conversations.find(c => c.other_user_id === activeThreadId);
    const displayThreadName = activeConversation ? activeConversation.other_user_name : activeThreadName;
    const displayMessages = activeConversation ? activeConversation.messages : [];

    const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

    if (!user) return null;

    // Use Portal to ensure it renders at document body level, bypassing parent styles (like blur/transform)
    return createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] font-sans print:hidden">
            {/* Chat Panel */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-200" style={{ height: '500px' }}>

                    {/* Header */}
                    <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between">
                        {view === 'thread' ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setView('inbox')}
                                    className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <div>
                                    <h3 className="font-bold text-white text-sm truncate max-w-[180px]">
                                        {displayThreadName}
                                    </h3>
                                </div>
                            </div>
                        ) : (
                            <h3 className="font-bold text-white text-lg">Inbox</h3>
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-zinc-900/95 scrollbar-thin scrollbar-thumb-zinc-700">
                        {loading && conversations.length === 0 ? (
                            <div className="flex justify-center items-center h-full text-zinc-500 text-sm">Loading...</div>
                        ) : view === 'inbox' ? (
                            // Inbox View
                            conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
                                    <UserIcon className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No messages yet</p>
                                    <p className="text-xs mt-2 opacity-50">Start a conversation from the marketplace</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-zinc-800/50">
                                    {conversations.map(conv => (
                                        <li key={conv.other_user_id}>
                                            <button
                                                onClick={() => {
                                                    setActiveThreadId(conv.other_user_id);
                                                    setActiveThreadName(conv.other_user_name);
                                                    setView('thread');
                                                }}
                                                className="w-full text-left p-4 hover:bg-zinc-800/50 transition-colors flex items-start gap-3 group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-700 transition-colors shrink-0">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className={`text-sm font-medium truncate ${conv.unread_count > 0 ? 'text-white' : 'text-zinc-300'}`}>
                                                            {conv.other_user_name}
                                                        </span>
                                                        <span className="text-xs text-zinc-500 shrink-0 ml-2">
                                                            {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-white font-medium' : 'text-zinc-500'}`}>
                                                        {conv.last_message.sender_id === user.id ? 'You: ' : ''}{conv.last_message.content}
                                                    </p>
                                                </div>
                                                {conv.unread_count > 0 && (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )
                        ) : (
                            // Thread View
                            <div className="flex flex-col h-full">
                                <div className="flex-1 p-4 space-y-4">
                                    {displayMessages.length === 0 && (
                                        <div className="text-center text-zinc-500 text-sm mt-8">
                                            This is the beginning of your conversation with {displayThreadName}
                                        </div>
                                    )}
                                    {displayMessages.map((msg, index) => {
                                        const isMe = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm break-words ${isMe
                                                        ? 'bg-green-600 text-white rounded-tr-sm'
                                                        : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-3 bg-zinc-950 border-t border-zinc-800">
                                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                        <AutoResizeTextarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 placeholder-zinc-500 pr-10 min-h-[42px] max-h-[120px] scrollbar-thin scrollbar-thumb-zinc-700"
                                            maxLength={4000}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend(e);
                                                }
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="absolute right-2 p-1.5 text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <PaperAirplaneIcon className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 md:w-14 md:h-14 bg-green-500 hover:bg-green-400 text-black rounded-full shadow-lg shadow-green-500/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative group"
            >
                {isOpen ? (
                    <XMarkIcon className="w-6 h-6 md:w-7 md:h-7" />
                ) : (
                    <ChatBubbleLeftRightIcon className="w-6 h-6 md:w-7 md:h-7" />
                )}

                {/* Unread Badge on Button */}
                {!isOpen && totalUnread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-zinc-950 animate-bounce">
                        {totalUnread > 9 ? '9+' : totalUnread}
                    </div>
                )}
            </button>
        </div>,
        document.body
    );
};
