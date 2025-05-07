/**
 * MessageNotificationService.js
 * A global service to handle real-time notifications for chat messages.
 * This service remains active throughout the application lifecycle.
 */

import { toast } from 'react-toastify';

class MessageNotificationService {
  constructor() {
    this.initialized = false;
    this.unreadMessages = {};
    this.totalUnreadCount = 0;
    this.observers = [];
    this.socket = null;
    this.currentUserId = null;
  }

  /**
   * Initialize the service with socket and user information
   */
  init(socket, userId) {
    if (this.initialized && this.socket === socket && this.currentUserId === userId) {
      console.log('MessageNotificationService already initialized with matching parameters');
      return;
    }
    
    console.log('MessageNotificationService initializing with socket:', socket?.id || 'undefined', 'and userId:', userId || 'undefined');
    this.socket = socket;
    this.currentUserId = userId;
    this.initialized = true;
    
    // Load any stored unread messages from localStorage
    this.loadUnreadMessages();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Dispatch a ready event for other components to know service is ready
    window.dispatchEvent(new CustomEvent('textlaire_notification_service_ready'));
    
    console.log('MessageNotificationService initialized with userId:', userId);
  }

  /**
   * Set up event listeners for real-time updates
   */
  setupEventListeners() {
    console.log('Setting up MessageNotificationService event listeners');
    
    // Remove existing listeners to prevent duplicates
    window.removeEventListener('textlaire_new_message', this.handleNewMessage);
    window.removeEventListener('textlaire_chat_selected', this.handleChatSelected);
    
    // Listen for new messages via custom event
    window.addEventListener('textlaire_new_message', this.handleNewMessage);
    console.log('Added textlaire_new_message event listener');
    
    // Listen for chat selection to clear unread counts
    window.addEventListener('textlaire_chat_selected', this.handleChatSelected);
    console.log('Added textlaire_chat_selected event listener');
    
    // Debug listeners after 1 second to verify they're working
    setTimeout(() => {
      const listeners = window.getEventListeners ? window.getEventListeners(window) : {};
      console.log('Current window event listeners:', listeners);
      console.log('MessageNotificationService event listeners active');
    }, 1000);
    
    console.log('MessageNotificationService event listeners set up');
  }

  /**
   * Handle incoming new messages
   */
  handleNewMessage = (event) => {
    console.log('MessageNotificationService received new message event:', event.detail?._id);
    const message = event.detail;
    if (!message || !message._id) {
      console.log('Invalid message received, ignoring');
      return;
    }
    
    // Don't count messages from the current user as unread
    if (message.sender?._id === this.currentUserId) {
      console.log('Message is from current user, ignoring for notifications');
      return;
    }
    
    // Extract chat ID
    const chatId = message.chat?._id || message.chat;
    if (!chatId) {
      console.log('Message has no chatId, ignoring');
      return;
    }
    
    console.log('Processing new message for chat:', chatId);
    
    // Track unread message
    this.addUnreadMessage(chatId, message);
    
    // Show notification if not already shown
    this.showToastNotification(message);
    
    // Notify observers (like the sidebar badge)
    this.notifyObservers();
  }

  /**
   * Handle chat selection to clear unread counts
   */
  handleChatSelected = (event) => {
    const chatId = event.detail;
    if (!chatId) return;
    
    // Clear unread messages for this chat
    this.clearUnreadMessages(chatId);
    
    // Notify observers about the updated unread count
    this.notifyObservers();
  }

  /**
   * Add an unread message to the tracking system
   */
  addUnreadMessage(chatId, message) {
    // Initialize the chat's message array if needed
    if (!this.unreadMessages[chatId]) {
      this.unreadMessages[chatId] = [];
    }
    
    // Check if this message is already tracked
    if (this.unreadMessages[chatId].some(m => m._id === message._id)) {
      return; // Already tracked
    }
    
    // Add the message to the unread list
    this.unreadMessages[chatId].push(message);
    
    // Update total count
    this.totalUnreadCount = this.calculateTotalUnreadCount();
    
    // Persist to storage
    this.saveUnreadMessages();
  }

  /**
   * Clear unread messages for a specific chat
   */
  clearUnreadMessages(chatId) {
    // Remove the chat from unread tracking
    if (this.unreadMessages[chatId]) {
      delete this.unreadMessages[chatId];
      
      // Update total count
      this.totalUnreadCount = this.calculateTotalUnreadCount();
      
      // Persist to storage
      this.saveUnreadMessages();
      
      return true;
    }
    return false;
  }

  /**
   * Calculate the total number of unread messages
   */
  calculateTotalUnreadCount() {
    return Object.values(this.unreadMessages).reduce((total, messages) => total + messages.length, 0);
  }

  /**
   * Get the number of unread messages for a specific chat
   */
  getUnreadCountForChat(chatId) {
    return this.unreadMessages[chatId]?.length || 0;
  }

  /**
   * Get the total number of unread messages
   */
  getTotalUnreadCount() {
    return this.totalUnreadCount;
  }

  /**
   * Show a toast notification for a new message
   */
  showToastNotification(message) {
    console.log('Attempting to show toast notification for message:', message._id);
    
    // Check if we've already shown a notification for this message
    const recentNotifications = JSON.parse(sessionStorage.getItem('textlaire_recent_notifications') || '[]');
    if (recentNotifications.includes(message._id)) {
      console.log('Toast notification for this message already shown, skipping');
      return;
    }
    
    // Add to shown notifications
    recentNotifications.push(message._id);
    // Keep only the most recent 20 notifications
    if (recentNotifications.length > 20) {
      recentNotifications.shift();
    }
    sessionStorage.setItem('textlaire_recent_notifications', JSON.stringify(recentNotifications));
    
    // Check if we're on the messages page and the chat is selected
    const isMessagesPageActive = localStorage.getItem('textlaire_messages_page_active') === 'true';
    const selectedChatId = localStorage.getItem('textlaire_selected_chat_id');
    const chatId = message.chat?._id || message.chat;
    
    if (isMessagesPageActive && selectedChatId === chatId) {
      console.log('User is viewing the chat for this message, skipping toast notification');
      return;
    }
    
    // Show toast notification
    const sender = message.sender?.name || 'Someone';
    const content = message.content || 
                   (message.attachments?.length ? 'Sent an attachment' : 'New message');
    
    console.log('Displaying toast notification for message:', message._id);
    
    toast.info(`${sender}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      toastId: message._id, // Use message ID as toast ID to prevent duplicates
      onClick: () => {
        // Navigate to messages page when toast is clicked
        if (window.location.pathname !== '/messages') {
          window.location.href = '/messages';
        }
      }
    });
    
    // Play notification sound
    this.playNotificationSound();
  }

  /**
   * Play a notification sound for new messages
   */
  playNotificationSound() {
    try {
      // Create audio element only if needed
      const audio = new Audio();
      audio.src = '/notification.mp3';
      // Preload the audio
      audio.preload = 'auto';
      // Add error handling
      audio.onerror = (e) => console.log('Audio load error:', e.message);
      // Only play after loaded
      audio.oncanplaythrough = () => {
        audio.play().catch(e => console.log('Audio play error:', e.message));
      };
    } catch (error) {
      console.log('Notification sound not available:', error.message);
    }
  }

  /**
   * Save unread messages to localStorage
   */
  saveUnreadMessages() {
    try {
      // Convert to simpler format for storage
      const storageFormat = {};
      
      Object.keys(this.unreadMessages).forEach(chatId => {
        storageFormat[chatId] = this.unreadMessages[chatId].map(msg => ({
          _id: msg._id,
          sender: msg.sender?._id,
          createdAt: msg.createdAt,
          chat: msg.chat,
          content: msg.content?.substring(0, 50) // Only store a preview of content
        }));
      });
      
      localStorage.setItem('textlaire_unread_messages', JSON.stringify(storageFormat));
    } catch (error) {
      console.error('Error saving unread messages to storage:', error);
    }
  }

  /**
   * Load unread messages from localStorage
   */
  loadUnreadMessages() {
    try {
      const storedMessages = JSON.parse(localStorage.getItem('textlaire_unread_messages') || '{}');
      this.unreadMessages = storedMessages;
      this.totalUnreadCount = this.calculateTotalUnreadCount();
    } catch (error) {
      console.error('Error loading unread messages from storage:', error);
      this.unreadMessages = {};
      this.totalUnreadCount = 0;
    }
  }

  /**
   * Subscribe to unread count updates
   */
  subscribe(callback) {
    if (typeof callback !== 'function') return;
    
    // Add callback to observers if not already there
    if (!this.observers.includes(callback)) {
      this.observers.push(callback);
      
      // Immediately notify with current state
      callback({
        total: this.totalUnreadCount,
        byChatId: this.unreadMessages
      });
    }
    
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all observers of changes
   */
  notifyObservers() {
    const update = {
      total: this.totalUnreadCount,
      byChatId: this.unreadMessages
    };
    
    this.observers.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in notification observer:', error);
      }
    });
  }
}

// Create singleton instance
const notificationService = new MessageNotificationService();

export default notificationService; 