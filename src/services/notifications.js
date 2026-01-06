// Notification Service
class NotificationService {
  constructor() {
    this.permission = null;
    this.audioContext = null;
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    // Play sound
    this.playSound();

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  playSound() {
    try {
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Create a simple beep sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  notifySuccess(message) {
    return this.showNotification('✅ Success', {
      body: message,
      tag: 'success',
      requireInteraction: false
    });
  }

  notifyError(message) {
    return this.showNotification('❌ Error', {
      body: message,
      tag: 'error',
      requireInteraction: false
    });
  }

  notifyInfo(message) {
    return this.showNotification('ℹ️ Info', {
      body: message,
      tag: 'info',
      requireInteraction: false
    });
  }

  notifyBillCreated(bill) {
    return this.showNotification('💰 New Bill Generated', {
      body: `Bill for ${bill.billing_cycle}: ₱${bill.total_amount.toLocaleString()}`,
      tag: 'bill',
      requireInteraction: true
    });
  }

  notifyPaymentReceived(payment) {
    return this.showNotification('💵 Payment Received', {
      body: `Payment of ₱${payment.amount.toLocaleString()} recorded`,
      tag: 'payment',
      requireInteraction: false
    });
  }
}

export default new NotificationService();

