'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { callCallableFunction } from '@/lib/firebase/functions';
import type {
  ConversationSummary,
  ChatMessage,
  RecipientMessageSettings,
  SocialEntityType,
} from '@crowdbeats/contracts';

interface MessagingDashboardProps {
  readonly currentPersona: 'fan' | 'artist' | 'band';
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
  readonly initialRecipientId?: string;
  readonly initialRecipientType?: SocialEntityType;
  readonly initialRecipientName?: string;
}

export function MessagingDashboard({
  currentPersona,
  actingAsBandId,
  actingAsArtistId,
  initialRecipientId,
  initialRecipientType,
  initialRecipientName,
}: MessagingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests' | 'restricted'>('inbox');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<RecipientMessageSettings>({
    eligibility: 'everyone_eligible',
    pauseMessages: false,
  });

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDescription, setReportDescription] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async (tabToFetch = activeTab) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await callCallableFunction<
        { actingAsBandId?: string; actingAsArtistId?: string; tab: string },
        { conversations: ConversationSummary[]; totalUnreadCount: number; pendingRequestsCount: number }
      >('getConversations', {
        actingAsBandId,
        actingAsArtistId,
        tab: tabToFetch,
      });

      setConversations(response.conversations || []);
      setUnreadCount(response.totalUnreadCount || 0);
      setRequestsCount(response.pendingRequestsCount || 0);

      // If initialRecipientId is provided, select existing conversation or initialize draft
      if (initialRecipientId && !selectedConv) {
        const found = (response.conversations || []).find((c: ConversationSummary) => c.otherParticipant.id === initialRecipientId);
        if (found) {
          setSelectedConv(found);
        } else {
          setSelectedConv({
            id: 'new',
            participantIds: ['', initialRecipientId],
            participantTypes: { [initialRecipientId]: initialRecipientType || 'artist' },
            status: 'pending_request',
            requesterId: '',
            recipientId: initialRecipientId,
            lastMessageText: '',
            lastMessageTimestamp: new Date().toISOString(),
            lastSenderId: '',
            unreadCount: 0,
            isRestricted: false,
            otherParticipant: {
              id: initialRecipientId,
              type: initialRecipientType || 'artist',
              name: initialRecipientName || initialRecipientId,
            },
          });
        }
      } else if (!selectedConv && response.conversations && response.conversations.length > 0) {
        setSelectedConv(response.conversations[0]);
      }
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setErrorMessage(err?.message || 'Failed to load conversations.');
    } finally {
      setIsLoading(false);
    }
  }, [actingAsBandId, actingAsArtistId, activeTab, selectedConv, initialRecipientId, initialRecipientType, initialRecipientName]);

  const fetchMessages = useCallback(async (convId: string) => {
    if (convId === 'new') {
      setMessages([]);
      return;
    }
    try {
      const response = await callCallableFunction<
        { conversationId: string; actingAsBandId?: string; actingAsArtistId?: string },
        { messages: ChatMessage[]; conversation: ConversationSummary }
      >('getMessages', {
        conversationId: convId,
        actingAsBandId,
        actingAsArtistId,
      });

      setMessages(response.messages || []);
      if (response.conversation) {
        setSelectedConv(response.conversation);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setErrorMessage(err?.message || 'Failed to load messages.');
    }
  }, [actingAsBandId, actingAsArtistId]);

  useEffect(() => {
    fetchConversations(activeTab);
  }, [activeTab, fetchConversations]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv?.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConv || isSending) return;

    const trimmed = inputText.trim();
    if (trimmed.length > 2000) {
      setErrorMessage('Message exceeds 2,000 character limit.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const recipientId = selectedConv.otherParticipant.id;
      const recipientType = selectedConv.otherParticipant.type;

      const res = await callCallableFunction<
        { recipientId: string; recipientType: SocialEntityType; text: string; actingAsBandId?: string; actingAsArtistId?: string },
        { ok: boolean; messageId: string; conversationId: string; status: string }
      >('sendMessage', {
        recipientId,
        recipientType,
        text: trimmed,
        actingAsBandId,
        actingAsArtistId,
      });

      if (res.ok) {
        setInputText('');
        if (selectedConv.id === 'new' && res.conversationId) {
          await fetchConversations(activeTab);
          await fetchMessages(res.conversationId);
        } else {
          await fetchMessages(selectedConv.id);
          await fetchConversations(activeTab);
        }
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMessage(err?.message || 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRespondToRequest = async (action: 'accept' | 'decline' | 'block' | 'report') => {
    if (!selectedConv) return;
    setErrorMessage(null);

    try {
      await callCallableFunction<
        { conversationId: string; action: string; actingAsBandId?: string; actingAsArtistId?: string; reportReason?: string; reportDescription?: string },
        { ok: boolean; status: string }
      >('respondToMessageRequest', {
        conversationId: selectedConv.id,
        action,
        actingAsBandId,
        actingAsArtistId,
        reportReason: action === 'report' ? reportReason : undefined,
        reportDescription: action === 'report' ? reportDescription : undefined,
      });

      setSuccessMessage(
        action === 'accept'
          ? 'Message request accepted.'
          : action === 'decline'
          ? 'Message request declined. 7-day cooldown applied.'
          : action === 'block'
          ? 'User blocked and conversation closed.'
          : 'Report submitted to Admin Support.',
      );

      setShowReportModal(false);
      setSelectedConv(null);
      await fetchConversations(activeTab);
    } catch (err: any) {
      console.error('Failed to respond to request:', err);
      setErrorMessage(err?.message || 'Action failed.');
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConv) return;
    if (!confirm(`Are you sure you want to block ${selectedConv.otherParticipant.name}? This will remove follow edges in both directions and prevent all future communication.`)) {
      return;
    }

    try {
      await callCallableFunction('blockEntity', {
        targetId: selectedConv.otherParticipant.id,
        targetType: selectedConv.otherParticipant.type,
        actingAsBandId,
        actingAsArtistId,
      });

      setSuccessMessage(`${selectedConv.otherParticipant.name} has been blocked.`);
      setSelectedConv(null);
      await fetchConversations(activeTab);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to block user.');
    }
  };

  const handleRestrictUser = async () => {
    if (!selectedConv) return;
    try {
      await callCallableFunction('restrictEntity', {
        targetId: selectedConv.otherParticipant.id,
        targetType: selectedConv.otherParticipant.type,
        actingAsBandId,
        actingAsArtistId,
      });

      setSuccessMessage(`${selectedConv.otherParticipant.name} has been quietly restricted. Their messages will route to the Restricted tab with no read receipts.`);
      setSelectedConv(null);
      await fetchConversations(activeTab);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to restrict user.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await callCallableFunction('updateMessageSettings', {
        eligibility: settings.eligibility,
        pauseMessages: settings.pauseMessages,
        actingAsBandId,
      });
      setSuccessMessage('Message controls updated.');
      setShowSettingsModal(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save settings.');
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
            {currentPersona === 'band' ? 'Band Direct Messages' : currentPersona === 'artist' ? 'Creator Inbox & Requests' : 'Messages'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', margin: '4px 0 0' }}>
            {actingAsBandId ? 'Acting on behalf of your band' : 'Recipient-controlled text conversations'}
          </p>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          ⚙️ Message Settings
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 10, padding: '10px 16px', color: '#FCA5A5', fontSize: 13, marginBottom: 16 }}>
          ⚠️ {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 10, padding: '10px 16px', color: '#86EFAC', fontSize: 13, marginBottom: 16 }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Main Split Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, height: 680, backgroundColor: 'rgba(18, 20, 28, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, overflow: 'hidden' }}>
        
        {/* Left Column: Navigation Tabs & Conversation List */}
        <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <button
              onClick={() => setActiveTab('inbox')}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: activeTab === 'inbox' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderBottom: activeTab === 'inbox' ? '2px solid #6366F1' : 'none',
                color: activeTab === 'inbox' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              Inbox
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#6366F1', color: '#FFFFFF', padding: '2px 6px', borderRadius: 10, fontSize: 11 }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: activeTab === 'requests' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderBottom: activeTab === 'requests' ? '2px solid #6366F1' : 'none',
                color: activeTab === 'requests' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              Requests
              {requestsCount > 0 && (
                <span style={{ backgroundColor: '#EC4899', color: '#FFFFFF', padding: '2px 6px', borderRadius: 10, fontSize: 11 }}>
                  {requestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('restricted')}
              style={{
                flex: 1,
                padding: '12px 8px',
                border: 'none',
                background: activeTab === 'restricted' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderBottom: activeTab === 'restricted' ? '2px solid #6366F1' : 'none',
                color: activeTab === 'restricted' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Restricted
            </button>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: 13 }}>
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: 13 }}>
                {activeTab === 'inbox'
                  ? 'No conversations yet.'
                  : activeTab === 'requests'
                  ? 'No pending message requests.'
                  : 'No restricted conversations.'}
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const p = conv.otherParticipant;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#2E3247', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 700 }}>
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        p.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' }}>
                          {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: conv.unreadCount > 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)', fontWeight: conv.unreadCount > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.lastMessageText || 'Direct message thread'}
                        </span>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {p.followsViewer && (
                          <span style={{ fontSize: 10, backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818CF8', padding: '1px 5px', borderRadius: 4 }}>
                            Follows you
                          </span>
                        )}
                        <span style={{ fontSize: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', padding: '1px 5px', borderRadius: 4, textTransform: 'capitalize' }}>
                          {p.type}
                        </span>
                      </div>
                    </div>

                    {conv.unreadCount > 0 && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366F1' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat View or Empty Selection */}
        {selectedConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Conversation Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#2E3247', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 700 }}>
                  {selectedConv.otherParticipant.avatarUrl ? (
                    <img src={selectedConv.otherParticipant.avatarUrl} alt={selectedConv.otherParticipant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    selectedConv.otherParticipant.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                      {selectedConv.otherParticipant.name}
                    </span>
                    {selectedConv.otherParticipant.isVerified && <span>✓</span>}
                    <span style={{ fontSize: 11, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)', padding: '1px 6px', borderRadius: 4, textTransform: 'capitalize' }}>
                      {selectedConv.otherParticipant.type}
                    </span>
                  </div>
                  {selectedConv.otherParticipant.handle && (
                    <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>
                      @{selectedConv.otherParticipant.handle}
                    </span>
                  )}
                </div>
              </div>

              {/* Safety Controls Dropdown / Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleRestrictUser}
                  title="Quietly restrict this account"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: 'none', color: 'rgba(255, 255, 255, 0.7)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', minHeight: 36 }}
                >
                  Restrict
                </button>
                <button
                  onClick={handleBlockUser}
                  title="Block this user"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#FCA5A5', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', minHeight: 36 }}
                >
                  Block
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  title="Report to Admin Support"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: 'none', color: 'rgba(255, 255, 255, 0.7)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', minHeight: 36 }}
                >
                  Report
                </button>
              </div>
            </div>

            {/* Pending Request Decision Action Bar */}
            {selectedConv.status === 'pending_request' && activeTab === 'requests' && (
              <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', borderBottom: '1px solid rgba(99, 102, 241, 0.3)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                    {selectedConv.otherParticipant.name} sent you a message request
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>
                    Accepting allows them to send messages and see when you have read them.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleRespondToRequest('accept')}
                    style={{ backgroundColor: '#6366F1', border: 'none', color: '#FFFFFF', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToRequest('decline')}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40 }}
                  >
                    Decline (7-Day Cooldown)
                  </button>
                  <button
                    onClick={() => handleRespondToRequest('block')}
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#FCA5A5', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40 }}
                  >
                    Block
                  </button>
                </div>
              </div>
            )}

            {/* Message Stream */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'rgba(255, 255, 255, 0.4)', fontSize: 13 }}>
                  No messages in this conversation.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId !== selectedConv.otherParticipant.id;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        backgroundColor: isMe ? '#6366F1' : 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}
                    >
                      <div>{msg.text}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', textAlign: isMe ? 'right' : 'left', marginTop: 4 }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          <span style={{ marginLeft: 4 }}>
                            {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓' : '•'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Bar */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
              {selectedConv.status === 'blocked' ? (
                <div style={{ textAlign: 'center', color: '#FCA5A5', fontSize: 13, padding: 8 }}>
                  🔒 This conversation is blocked and read-only.
                </div>
              ) : selectedConv.status === 'pending_request' && activeTab !== 'requests' ? (
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, padding: 8 }}>
                  ⏳ Message request sent. You can send more messages once the recipient accepts.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message (max 2,000 chars)..."
                    maxLength={2000}
                    disabled={isSending}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 24,
                      padding: '12px 18px',
                      color: '#FFFFFF',
                      fontSize: 14,
                      outline: 'none',
                      minHeight: 44,
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.4)' }}>
                    {2000 - inputText.length}
                  </span>
                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    style={{
                      backgroundColor: inputText.trim() ? '#6366F1' : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '0 20px',
                      borderRadius: 24,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: inputText.trim() ? 'pointer' : 'default',
                      minHeight: 44,
                    }}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: 14 }}>
            Select a conversation from the left to read and send messages.
          </div>
        )}
      </div>

      {/* Recipient Message Settings Modal */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1A1D28', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>
              Message Control Settings
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 20 }}>
              Control who can send you message requests and pause incoming messages.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#FFFFFF', fontSize: 14, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={settings.pauseMessages}
                  onChange={(e) => setSettings({ ...settings, pauseMessages: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                Pause all incoming message requests
              </label>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4, marginLeft: 28 }}>
                When enabled, nobody can start a new message thread with you. Existing chats remain open.
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 8 }}>
                Who can send message requests?
              </label>
              <select
                value={settings.eligibility}
                onChange={(e) => setSettings({ ...settings, eligibility: e.target.value as any })}
                style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFFFFF', padding: '10px 14px', borderRadius: 8, fontSize: 14, outline: 'none', minHeight: 44 }}
              >
                <option value="everyone_eligible" style={{ background: '#1A1D28' }}>Everyone who follows you</option>
                <option value="following_or_followers" style={{ background: '#1A1D28' }}>People I follow or who follow me</option>
                <option value="mutual_only" style={{ background: '#1A1D28' }}>Mutual follows only</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', minHeight: 40 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                style={{ backgroundColor: '#6366F1', border: 'none', color: '#FFFFFF', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1A1D28', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>
              Report to Admin Support
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 20 }}>
              Recent messages will be securely snapshotted as evidence for the moderation team.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 6 }}>
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFFFFF', padding: '10px 14px', borderRadius: 8, fontSize: 14, minHeight: 44 }}
              >
                <option value="harassment" style={{ background: '#1A1D28' }}>Harassment or Bullying</option>
                <option value="spam" style={{ background: '#1A1D28' }}>Spam or Scam</option>
                <option value="hate_speech" style={{ background: '#1A1D28' }}>Hate Speech</option>
                <option value="violence" style={{ background: '#1A1D28' }}>Threats or Violence</option>
                <option value="impersonation" style={{ background: '#1A1D28' }}>Impersonation</option>
                <option value="other" style={{ background: '#1A1D28' }}>Other Violation</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 6 }}>
                Description (Optional)
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional context for support staff..."
                rows={3}
                style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#FFFFFF', padding: '10px 14px', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', minHeight: 40 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespondToRequest('report')}
                style={{ backgroundColor: '#EF4444', border: 'none', color: '#FFFFFF', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
