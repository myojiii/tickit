document.addEventListener('DOMContentLoaded', async () => {

  // ========================================
  // SIDEBAR TOGGLE FUNCTIONALITY
  // ========================================
  const sidebar = document.querySelector('.sidebar');
  const layout = document.querySelector('.layout');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  // Load saved state from localStorage
  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState === 'true') {
    sidebar?.classList.add('collapsed');
    layout?.classList.add('sidebar-collapsed');
  }
  
  // Toggle sidebar on button click
  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
    layout?.classList.toggle('sidebar-collapsed');
    
    // Save state to localStorage
    const isCollapsed = sidebar?.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  });

  // ========================================
  // NAVIGATION ACTIVE STATE
  // ========================================
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      navButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Here you can add navigation logic
      const buttonText = btn.querySelector('.nav-text')?.textContent;
      console.log('Navigating to:', buttonText);
    });
  });

  // ========================================
  // TICKET STATUS TABS (Admin tickets page)
  // ========================================
  const ticketTabs = document.querySelectorAll('.tickets-tabs .mgmt-tab');
  const ticketTables = document.querySelectorAll('.mgmt-table[data-status]');
  const viewToggleButtons = document.querySelectorAll('[data-view-toggle]');
  const ticketsViewPanels = document.querySelectorAll('.tickets-view');
  const ticketsFilterInput = document.getElementById('tickets-filter');

  const activateTicketTab = (target) => {
    if (!target) return;
    ticketTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === target));
    ticketTables.forEach(table => {
      const shouldShow = table.dataset.status === target;
      table.classList.toggle('hidden', !shouldShow);
    });
  };

  ticketTabs.forEach(tab => {
    tab.addEventListener('click', () => activateTicketTab(tab.dataset.tab));
  });

  // Ensure default tab shown on load
  const initialTab = document.querySelector('.tickets-tabs .mgmt-tab.active')?.dataset.tab || 'open';
  activateTicketTab(initialTab);

  viewToggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.viewToggle));
  });

  ticketsFilterInput?.addEventListener('input', (e) => {
    applyTableFilter(e.target.value);
  });

  // ========================================
  // LOGOUT FUNCTIONALITY
  // ========================================
  const logoutBtn = document.getElementById('logout-btn');
  const logoutModal = document.getElementById('logout-modal');
  const logoutConfirmBtn = document.getElementById('logout-confirm-btn');
  const logoutCancelBtn = document.getElementById('logout-cancel-btn');
  const logoutCloseBtn = document.getElementById('logout-modal-close');

  const openLogoutModal = () => logoutModal?.classList.remove('hidden');
  const closeLogoutModal = () => logoutModal?.classList.add('hidden');

  const performLogout = () => {
    localStorage.removeItem('sidebarCollapsed');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  logoutBtn?.addEventListener('click', () => {
    if (logoutModal) {
      openLogoutModal();
      return;
    }

    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      performLogout();
    }
  });

  logoutConfirmBtn?.addEventListener('click', () => {
    closeLogoutModal();
    performLogout();
  });

  logoutCancelBtn?.addEventListener('click', closeLogoutModal);
  logoutCloseBtn?.addEventListener('click', closeLogoutModal);

  logoutModal?.addEventListener('click', (event) => {
    if (event.target === logoutModal) {
      closeLogoutModal();
    }
  });

  // ========================================
  // NOTIFICATION SYSTEM
  // ========================================
  function showNotification(title, message, type = 'success', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) {
      console.error('Notification container not found');
      return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconSvg = type === 'success' ? `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ` : type === 'error' ? `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ` : `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    
    notification.innerHTML = `
      <div class="notification-icon">${iconSvg}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // Make showNotification globally accessible
  window.showNotification = showNotification;

  // ========================================
  // GLOBAL STATE
  // ========================================
  let assignModalState = { ticketId: null, pendingStatus: null };
  let editModalState = { ticketId: null };
  let deleteModalState = { ticketId: null };
  let ticketsCache = [];
  let kanbanDnDReady = false;
  let activeViewMode = localStorage.getItem('adminTicketsView') || 'kanban';
  if (!['kanban', 'table'].includes(activeViewMode)) {
    activeViewMode = 'kanban';
  }

  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const adminCanCommunicate = userRole === 'admin'
    ? localStorage.getItem('adminCanCommunicate') !== 'false'
    : false;

  // ========================================
  // ADMIN NOTIFICATION SYSTEM
  // ========================================
  const adminId = localStorage.getItem("userId");
  console.log("Admin ID:", adminId);

  let notifications = [];
  let lastCheckTimestamp = Date.now();

  // Load all notifications from backend
  const loadNotifications = async () => {
    if (!adminId) return;

    try {
      const response = await fetch(`/api/staff/${adminId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        notifications = data.notifications || [];
        updateNotificationUI(data.unreadCount || 0);
        console.log('Loaded admin notifications:', notifications.length, 'Unread:', data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading admin notifications:', error);
    }
  };

  // Check for new notifications since last check
  const checkForNewNotifications = async () => {
    if (!adminId) return;

    try {
      const response = await fetch(`/api/staff/${adminId}/notifications/new?since=${lastCheckTimestamp}`);
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];

        if (newNotifications.length > 0) {
          console.log('Found new admin notifications:', newNotifications.length);

          // Show toast for each new notification
          newNotifications.forEach(notif => {
            const type = notif.type === 'new_ticket' ? 'success' : 'info';
            showNotification(notif.title, notif.message, type);
          });

          // Reload all notifications to update the list
          await loadNotifications();
        }

        lastCheckTimestamp = Date.now();
      }
    } catch (error) {
      console.error('Error checking for new admin notifications:', error);
    }
  };

  // Update notification UI
  const updateNotificationUI = (unreadCount) => {
    const notificationsList = document.getElementById('notifications-list');
    const bellBadge = document.getElementById('bell-badge');

    if (!notificationsList) return;

    // Update badge
    if (bellBadge) {
      if (unreadCount > 0) {
        bellBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        bellBadge.classList.add('active');
        bellBadge.removeAttribute('data-count');
      } else {
        bellBadge.textContent = '';
        bellBadge.setAttribute('data-count', '0');
        bellBadge.classList.remove('active');
      }
    }

    // Clear list
    notificationsList.innerHTML = '';

    if (notifications.length === 0) {
      notificationsList.innerHTML = '<p class="empty-state">No notifications</p>';
      return;
    }

    // Render notifications
    notifications.forEach((notif, index) => {
      const item = document.createElement('div');
      item.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
      
      // Determine notification style based on type
      if (notif.type === 'new_ticket') {
        item.classList.add('success');
      } else if (notif.type === 'ticket_assigned') {
        item.classList.add('info');
      }
      
      // Check if this is a recently created notification (within last minute)
      const createdTime = new Date(notif.createdAt).getTime();
      const now = Date.now();
      const isNew = (now - createdTime) < 60000; // Less than 1 minute old
      if (isNew && !notif.read) {
        item.classList.add('new-notification');
      }

      // Extract client name and ticket title from metadata
      const clientName = notif.metadata?.clientName || 'Unknown';
      const ticketTitle = notif.metadata?.ticketTitle || 'Untitled Ticket';

      item.innerHTML = `
        <div class="notification-item-content">
          <div class="notification-item-type">New Ticket Submitted</div>
          <div class="notification-item-title">${ticketTitle}</div>
          <div class="notification-item-submitter">Submitted by ${clientName}</div>
          <div class="notification-item-time">${getRelativeTime(notif.createdAt)}</div>
        </div>
      `;

      // Click to mark as read and open ticket panel
      item.addEventListener('click', async (e) => {
        if (!notif.read) {
          await markAsRead(notif._id);
        }
        // Open ticket panel with the ticket details
        if (notif.ticketId) {
          await openTicketPanel(notif.ticketId);
        }
      });

      notificationsList.appendChild(item);
    });
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Reload notifications
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking admin notification as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload notifications
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error deleting admin notification:', error);
    }
  };

  // Helper function to get relative time
  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const date = new Date(timestamp);
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Open ticket in side panel
  const openTicketPanel = async (ticketId) => {
    try {
      // Close notifications panel first
      const notificationsPanel = document.getElementById('notifications-panel');
      if (notificationsPanel) {
        notificationsPanel.classList.add('hidden');
      }

      // Fetch ticket details
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) {
        console.error('Failed to fetch ticket details');
        return;
      }

      const ticket = await response.json();

      // Create or get panel elements
      let panel = document.getElementById('notification-ticket-panel');
      let overlay = document.getElementById('notification-overlay');

      if (!panel) {
        // Create panel HTML structure
        panel = document.createElement('div');
        panel.id = 'notification-ticket-panel';
        panel.className = 'notification-ticket-panel';
        panel.innerHTML = `
          <div class="notification-ticket-panel-header">
            <h3 class="notification-ticket-panel-title">Ticket Details</h3>
            <button class="notification-ticket-panel-close" id="panel-close-btn" aria-label="Close panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="notification-ticket-content" id="panel-content">
          </div>
          <div class="notification-ticket-actions">
            <button class="secondary-btn" id="panel-view-full-btn">View Full Ticket</button>
          </div>
        `;
        document.body.appendChild(panel);

        // Create overlay
        overlay = document.createElement('div');
        overlay.id = 'notification-overlay';
        overlay.className = 'notification-overlay';
        document.body.appendChild(overlay);

        // Close panel handlers
        const closePanel = () => {
          panel.classList.remove('open');
          overlay.classList.remove('open');
        };

        document.getElementById('panel-close-btn').addEventListener('click', closePanel);
        overlay.addEventListener('click', closePanel);

        // View full ticket button
        document.getElementById('panel-view-full-btn').addEventListener('click', () => {
          closePanel();
          window.location.href = `/admin?ticketId=${ticketId}`;
        });
      }

      // Populate panel with ticket details
      const contentDiv = document.getElementById('panel-content');
      
      // Format the date properly
      let formattedDate = 'N/A';
      if (ticket.date) {
        try {
          const dateObj = new Date(ticket.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
          }
        } catch (e) {
          formattedDate = 'N/A';
        }
      }

      contentDiv.innerHTML = `
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Ticket ID</div>
          <div class="notification-ticket-field-value">#${ticket.id || 'N/A'}</div>
        </div>
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Title</div>
          <div class="notification-ticket-field-value">${ticket.title || 'Untitled'}</div>
        </div>
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Client</div>
          <div class="notification-ticket-field-value">${ticket.userId?.name || 'Unknown'}</div>
        </div>
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Category</div>
          <div class="notification-ticket-field-value">${ticket.category || 'N/A'}</div>
        </div>
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Status</div>
          <div class="notification-ticket-field-value"><span class="status-badge ${ticket.status?.toLowerCase() || 'open'}">${ticket.status || 'Open'}</span></div>
        </div>
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Priority</div>
          <div class="notification-ticket-field-value">${ticket.priority || 'Medium'}</div>
        </div>
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Description</div>
          <div class="notification-ticket-field-value">${ticket.description || 'No description provided'}</div>
        </div>
        <div class="notification-ticket-field">
          <div class="notification-ticket-field-label">Submitted</div>
          <div class="notification-ticket-field-value">${formattedDate}</div>
        </div>
      `;

      // Open panel
      panel.classList.add('open');
      overlay.classList.add('open');
    } catch (error) {
      console.error('Error opening ticket panel:', error);
    }
  };

  // Initialize notification system
  if (adminId) {
    await loadNotifications();

    // Check for new notifications every 10 seconds
    setInterval(checkForNewNotifications, 10000);
  }

  // ========================================
  // MODAL ELEMENTS
  // ========================================
  const assignOverlay = document.getElementById('assign-modal');
  const editOverlay = document.getElementById('edit-modal');
  const deleteOverlay = document.getElementById('delete-modal');
  const viewOverlay = document.getElementById('view-modal');
  const messagesList = document.getElementById('messages-list');
  const kanbanLoading = document.getElementById('kanban-loading');
  let lastMessagesSnapshot = null;

  // ========================================
  // MODAL HELPERS
  // ========================================
  const openAssignModal = () => assignOverlay?.classList.remove('hidden');
  const closeAssignModal = () => {
    assignOverlay?.classList.add('hidden');
    assignModalState.pendingStatus = null;
  };

  const openEditModal = () => editOverlay?.classList.remove('hidden');
  const closeEditModal = () => editOverlay?.classList.add('hidden');

  const openDeleteModal = () => deleteOverlay?.classList.remove('hidden');
  const closeDeleteModal = () => deleteOverlay?.classList.add('hidden');

  const openViewModal = () => viewOverlay?.classList.remove('hidden');
  const closeViewModal = () => {
    viewOverlay?.classList.add('hidden');
    stopMessagesPolling();
    viewTicketId = null;
    viewTicketUserId = null;
    viewTicketStaffId = null;
    lastMessagesSnapshot = null;
  };

  // ========================================
  // VIEW TOGGLE
  // ========================================
  const setKanbanLoading = (isLoading) => {
    if (!kanbanLoading) return;
    kanbanLoading.classList.toggle('hidden', !isLoading);
  };

  const setViewMode = (mode) => {
    activeViewMode = mode;
    localStorage.setItem('adminTicketsView', mode);
    ticketsViewPanels.forEach((panel) => {
      const shouldShow = panel.dataset.view === mode;
      panel.classList.toggle('hidden', !shouldShow);
    });
    viewToggleButtons.forEach((btn) => {
      const isActive = btn.dataset.viewToggle === mode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  let viewMessagesTimer = null;
  let viewTicketId = null;
  let viewTicketUserId = null;
  let viewTicketStaffId = null;

  // ========================================
  // HELPERS
  // ========================================
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return 'No description';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const escapeHtml = (str = '') =>
    str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c] || c));

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusClass = (status) =>
    status ? status.toLowerCase().replace(/\s+/g, '-') : '';

  const normalizeStatusKey = (status) => {
    const value = (status || '').toString().trim().toLowerCase();
    if (value === 'in progress' || value === 'in-progress') return 'in-progress';
    if (value === 'resolved') return 'resolved';
    if (value === 'open') return 'open';
    if (!value || value === 'pending') return 'open';
    return 'open';
  };

  const getStatusLabel = (statusKey) => {
    if (statusKey === 'in-progress') return 'In Progress';
    if (statusKey === 'resolved') return 'Resolved';
    if (statusKey === 'open') return 'Open';
    return 'Open';
  };

  const hasAssignedCategory = (ticket) =>
    !!ticket?.category && ticket.category.toString().trim() !== '';

  const canMoveToStatus = (statusKey) => {
    if (statusKey === 'unassigned') return false;
    if (userRole === 'staff') return ['open', 'in-progress', 'resolved'].includes(statusKey);
    if (userRole === 'admin') {
      return adminCanCommunicate
        ? ['open', 'in-progress', 'resolved'].includes(statusKey)
        : statusKey === 'open';
    }
    return false;
  };

  function renderMessages(messages) {
    lastMessagesSnapshot = JSON.stringify(messages || []);

    if (!messagesList) return;
    if (!Array.isArray(messages) || messages.length === 0) {
      messagesList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          No conversation yet
        </div>
      `;
      return;
    }

    messagesList.innerHTML = messages.map(msg => {
      const senderNameRaw = msg.senderName || '';
      const isStaff =
        (viewTicketStaffId && msg.senderId === viewTicketStaffId) ||
        /staff/i.test(senderNameRaw);
      const isClient =
        (!isStaff && viewTicketUserId && msg.senderId === viewTicketUserId) ||
        (!isStaff && /client/i.test(senderNameRaw));

      const senderClass = isStaff ? 'staff' : 'client';
      const senderName = escapeHtml(
        senderNameRaw ||
        (isStaff ? 'Staff' : 'Client')
      );
      const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
      const safeMessage = escapeHtml(msg.message || '');

      let attachmentsHtml = '';
      if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        attachmentsHtml = '<div class="message-attachments">' +
          msg.attachments.map(att => {
            const isImage = att.mimetype && att.mimetype.startsWith('image/');
            let downloadLink = att.filepath || '#';
            if (downloadLink && !downloadLink.startsWith('http') && !downloadLink.startsWith('/')) {
              downloadLink = '/' + downloadLink;
            }
            const safeFilename = escapeHtml(att.filename || 'attachment');
            const sizeLabel = formatFileSize(att.size);

            if (isImage) {
              return `
                <div class="message-attachment image-attachment">
                  <img src="${downloadLink}" alt="${safeFilename}" onclick="window.open('${downloadLink}', '_blank')" onerror="this.alt='Failed to load image'">
                  <div class="attachment-name">${safeFilename}</div>
                </div>
              `;
            }

            return `
              <a href="${downloadLink}" download="${safeFilename}" class="message-attachment file-attachment" title="${safeFilename}">
                <svg viewBox="0 0 24 24">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                <span class="attachment-name">${safeFilename}</span>
                ${sizeLabel ? `<span class="att-size">${sizeLabel}</span>` : ''}
              </a>
            `;
          }).join('') +
          '</div>';
      }

      return `
        <div class="message ${senderClass}">
          <div class="message-header">
            <div class="message-sender ${senderClass}">${senderName}</div>
            <div class="message-time">${time}</div>
          </div>
          <div class="message-content">${safeMessage}</div>
          ${attachmentsHtml}
        </div>
      `;
    }).join('');
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  // ========================================
  // TABLE FILTER & SORT
  // ========================================
  const applyTableFilter = (query) => {
    const value = (query || '').toLowerCase().trim();
    document.querySelectorAll('.mgmt-table tbody tr').forEach((row) => {
      const isPlaceholder = row.querySelector('td[colspan]');
      if (isPlaceholder) return;
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(value) ? '' : 'none';
    });
  };

  const sortTable = (table, columnIndex, direction) => {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr'))
      .filter((row) => !row.querySelector('td[colspan]'));

    const multiplier = direction === 'desc' ? -1 : 1;
    rows.sort((a, b) => {
      const aText = (a.children[columnIndex]?.textContent || '').trim().toLowerCase();
      const bText = (b.children[columnIndex]?.textContent || '').trim().toLowerCase();
      if (aText < bText) return -1 * multiplier;
      if (aText > bText) return 1 * multiplier;
      return 0;
    });

    rows.forEach((row) => tbody.appendChild(row));
  };

  const attachTableSorting = () => {
    document.querySelectorAll('.mgmt-table').forEach((table) => {
      table.querySelectorAll('th[data-sortable="true"]').forEach((th, index) => {
        th.style.cursor = 'pointer';
        th.onclick = () => {
          const currentDir = th.dataset.sortDir === 'asc' ? 'desc' : 'asc';
          table.querySelectorAll('th[data-sortable="true"]').forEach((header) => {
            header.dataset.sortDir = '';
          });
          th.dataset.sortDir = currentDir;
          sortTable(table, index, currentDir);
        };
      });
    });
  };

  async function fetchMessages() {
    if (!viewTicketId) return;
    try {
      const res = await fetch(`/api/tickets/${viewTicketId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();

      // Prepend ticket description as first message once
      const ticket = await fetchTicketForDescription();
      const descriptionMessage = ticket?.description ? [{
        senderId: ticket.userId,
        senderName: 'Client',
        message: ticket.description,
        timestamp: ticket.date,
      }] : [];

      const combined = [...descriptionMessage, ...(data || [])];
      const snapshot = JSON.stringify(combined || []);
      if (snapshot === lastMessagesSnapshot) return;
      renderMessages(combined);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }

  function stopMessagesPolling() {
    if (viewMessagesTimer) {
      clearInterval(viewMessagesTimer);
      viewMessagesTimer = null;
    }
  }

  function startMessagesPolling() {
    stopMessagesPolling();
    fetchMessages();
    viewMessagesTimer = setInterval(fetchMessages, 4000);
  }

  const fetchTicketForDescription = async () => {
    if (!viewTicketId) return null;
    try {
      const res = await fetch(`/api/tickets/${viewTicketId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error fetching ticket for description:', err);
      return null;
    }
  };

  // ========================================
  // ASSIGN BUTTONS
  // ========================================
  const openAssignModalWithTicket = async (ticketId, ticketData = null, pendingStatus = null) => {
    if (!assignOverlay || !ticketId) return;

    assignModalState.ticketId = ticketId;
    assignModalState.pendingStatus = pendingStatus;

    let ticket = ticketData;
    if (!ticket || !ticket.user) {
      try {
        const res = await fetch(`/api/tickets/${ticketId}`);
        if (res.ok) ticket = await res.json();
      } catch (err) {
        console.error('Error fetching ticket for assign modal:', err);
      }
    }

    const modalTicketId = assignOverlay.querySelector('.modal-ticket-id');
    const modalTicketTitle = assignOverlay.querySelector('.modal-ticket-title');
    const modalTicketClient = assignOverlay.querySelector('.modal-ticket-client');
    const modalDesc = assignOverlay.querySelector('.modal-desc');
    const modalDate = assignOverlay.querySelector('.modal-date');

    if (modalTicketId) modalTicketId.textContent = ticketId;
    if (modalTicketTitle) modalTicketTitle.textContent = ticket?.title || 'Untitled';
    if (modalTicketClient) {
      const clientName = ticket?.user?.name || ticket?.userId || 'Unknown';
      modalTicketClient.textContent = clientName;
    }
    if (modalDesc) modalDesc.textContent = ticket?.description || 'No description';
    if (modalDate) modalDate.textContent = formatDate(ticket?.date);

    const categorySelect = document.getElementById('assign-category-select');
    if (categorySelect) categorySelect.value = '';

    openAssignModal();
  };

  const attachAssignButtonListeners = () => {
    document.querySelectorAll('.assign-category-btn').forEach(btn => {
      btn.onclick = (e) => {
        const tr = e.target.closest('tr');
        if (!tr || !assignOverlay) return;

        const ticketId = tr.dataset.ticketId;
        const ticket = ticketsCache.find((t) => t.id === ticketId);
        openAssignModalWithTicket(ticketId, ticket, null);
      };
    });
  };

  // ========================================
  // EDIT BUTTONS
  // ========================================
  const attachEditButtonListeners = () => {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = (e) => {
        const tr = e.target.closest('tr');
        if (!tr || !editOverlay) return;

        const tds = tr.querySelectorAll('td');
        editModalState.ticketId = tr.dataset.ticketId;

        const editTicketId = document.getElementById('edit-ticket-id');
        const editCurrentCategory = document.getElementById('edit-current-category');
        const editCategorySelect = document.getElementById('edit-category-select');

        if (editTicketId) editTicketId.textContent = editModalState.ticketId;
        if (editCurrentCategory) editCurrentCategory.textContent = tds[3]?.textContent || '';
        if (editCategorySelect) editCategorySelect.value = '';

        openEditModal();
      };
    });
  };

  // ========================================
  // VIEW BUTTONS
  // ========================================
  const openTicketModalById = async (ticketId) => {
    if (!ticketId) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const ticket = await res.json();

      viewTicketId = ticket.id || null;
      viewTicketUserId = ticket.userId || null;
      viewTicketStaffId = ticket.assignedStaffId || null;
      renderMessages([]);

      const viewTicketIdEl = document.getElementById('view-ticket-id');
      const viewTicketTitleEl = document.getElementById('view-ticket-title');
      const viewTicketDescEl = document.getElementById('view-ticket-description');
      const viewTicketCategoryEl = document.getElementById('view-ticket-category');
      const viewTicketDateEl = document.getElementById('view-ticket-date');
      const viewClientUserIdEl = document.getElementById('view-client-userid');

      if (viewTicketIdEl) viewTicketIdEl.textContent = ticket.id || '-';
      if (viewTicketTitleEl) viewTicketTitleEl.textContent = ticket.title || '-';
      if (viewTicketDescEl) viewTicketDescEl.textContent = ticket.description || '-';
      if (viewTicketCategoryEl) viewTicketCategoryEl.textContent = ticket.category || 'Unassigned';
      if (viewTicketDateEl) viewTicketDateEl.textContent = formatDate(ticket.date);
      if (viewClientUserIdEl) viewClientUserIdEl.textContent = ticket.userId || '-';

      const statusEl = document.getElementById('view-ticket-status');
      if (statusEl) {
        statusEl.textContent = ticket.status || '';
        statusEl.className = `status-badge ${getStatusClass(ticket.status)}`;
      }

      const priorityEl = document.getElementById('view-ticket-priority');
      if (priorityEl) {
        priorityEl.textContent = ticket.priority || 'Not Set';
      }

      openViewModal();
      startMessagesPolling();
    } catch (err) {
      console.error('Error fetching ticket:', err);
      showNotification('Error', 'Failed to load ticket details', 'error');
    }
  };

  const attachViewButtonListeners = () => {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        await openTicketModalById(tr.dataset.ticketId);
      };
    });
  };

  // ========================================
  // DELETE BUTTONS
  // ========================================
  const attachDeleteButtonListeners = () => {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        
        deleteModalState.ticketId = tr.dataset.ticketId;
        const deleteTicketId = document.getElementById('delete-ticket-id');
        if (deleteTicketId) deleteTicketId.textContent = deleteModalState.ticketId;
        openDeleteModal();
      };
    });
  };

  // ========================================
  // KANBAN RENDERING & DRAG/DROP
  // ========================================
  const renderKanban = (tickets) => {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    const columns = {
      unassigned: [],
      open: [],
      'in-progress': [],
      resolved: [],
    };

    tickets.forEach((ticket) => {
      if (!hasAssignedCategory(ticket)) {
        columns.unassigned.push(ticket);
        return;
      }

      const statusKey = normalizeStatusKey(ticket.status);
      if (columns[statusKey]) {
        columns[statusKey].push(ticket);
      } else {
        columns.open.push(ticket);
      }
    });

    Object.keys(columns).forEach((statusKey) => {
      const columnBody = board.querySelector(`.kanban-column-body[data-status="${statusKey}"]`);
      const countEl = board.querySelector(`[data-count-for="${statusKey}"]`);
      if (!columnBody) return;

      columnBody.innerHTML = '';
      if (countEl) countEl.textContent = columns[statusKey].length.toString();

      if (!columns[statusKey].length) {
        const empty = document.createElement('div');
        empty.className = 'kanban-empty';
        empty.style.textAlign = 'center';
        empty.style.color = '#7b8296';
        empty.style.fontSize = '13px';
        empty.textContent = 'No tickets';
        columnBody.appendChild(empty);
        return;
      }

      columns[statusKey].forEach((ticket) => {
        const card = document.createElement('article');
        const badgeClass = hasAssignedCategory(ticket) ? 'assigned' : 'unassigned';
        const safeTitle = escapeHtml(ticket.title || 'Untitled');
        const safeDesc = escapeHtml(truncateText(ticket.description, 120));
        const safeCategory = escapeHtml(ticket.category || 'Unassigned');
        const dateLabel = formatDate(ticket.date);

        card.className = 'kanban-card';
        card.dataset.ticketId = ticket.id || '';
        card.dataset.status = normalizeStatusKey(ticket.status);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Ticket ${ticket.id || ''}`);

        card.innerHTML = `
          <div class="kanban-card-header">
            <div class="kanban-card-title">${safeTitle}</div>
            <span class="ticket-badge ${badgeClass}">${badgeClass}</span>
          </div>
          <div class="kanban-card-meta">#${escapeHtml(ticket.id || '')} · ${dateLabel}</div>
          <div class="kanban-card-desc">${safeDesc}</div>
          <div class="kanban-card-footer">
            <span class="kanban-card-category">${safeCategory}</span>
            <button class="kanban-card-action" type="button">View</button>
          </div>
        `;

        const viewButton = card.querySelector('.kanban-card-action');
        viewButton?.addEventListener('click', (event) => {
          event.stopPropagation();
          openTicketModalById(ticket.id);
        });

        card.addEventListener('click', () => openTicketModalById(ticket.id));
        card.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openTicketModalById(ticket.id);
          }
        });

        columnBody.appendChild(card);
      });
    });

    applyRoleRestrictions();
    setupKanbanDnD();
  };

  const applyRoleRestrictions = () => {
    document.querySelectorAll('.kanban-column').forEach((column) => {
      const statusKey = column.dataset.status;
      const shouldDisable = statusKey !== 'unassigned' && !canMoveToStatus(statusKey);
      column.classList.toggle('is-disabled', shouldDisable);
      if (shouldDisable) {
        column.dataset.tooltip = 'You do not have permission to move tickets here.';
      } else {
        column.removeAttribute('data-tooltip');
      }

      const columnBody = column.querySelector('.kanban-column-body');
      if (columnBody) {
        columnBody.dataset.dropDisabled = shouldDisable || statusKey === 'unassigned' ? 'true' : 'false';
      }
    });
  };

  const setupKanbanDnD = () => {
    if (kanbanDnDReady || !window.interact) return;
    kanbanDnDReady = true;

    interact('.kanban-card').draggable({
      inertia: true,
      autoScroll: true,
      listeners: {
        start(event) {
          const card = event.target;
          card.classList.add('is-dragging');
          card.setAttribute('aria-grabbed', 'true');
          card.dataset.originStatus = card.closest('.kanban-column')?.dataset.status || '';
        },
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        },
        end(event) {
          const card = event.target;
          card.classList.remove('is-dragging');
          card.setAttribute('aria-grabbed', 'false');
          card.style.transform = '';
          card.removeAttribute('data-x');
          card.removeAttribute('data-y');
        },
      },
    });

    interact('.kanban-column-body').dropzone({
      accept: '.kanban-card',
      overlap: 0.2,
      ondropactivate(event) {
        event.target.classList.add('drop-active');
      },
      ondragenter(event) {
        event.target.classList.add('drop-target');
      },
      ondragleave(event) {
        event.target.classList.remove('drop-target');
      },
      ondropdeactivate(event) {
        event.target.classList.remove('drop-active');
        event.target.classList.remove('drop-target');
      },
      ondrop(event) {
        handleKanbanDrop(event);
      },
    });
  };

  const handleKanbanDrop = async (event) => {
    const dropzone = event.target;
    const card = event.relatedTarget;
    if (!dropzone || !card) return;

    const targetStatus = dropzone.dataset.status;
    const ticketId = card.dataset.ticketId;
    const originStatus = card.dataset.originStatus;

    if (!ticketId || !targetStatus || targetStatus === originStatus) return;
    if (dropzone.dataset.dropDisabled === 'true') {
      showNotification('Permission denied', 'You cannot move tickets to this column.', 'error');
      renderKanban(ticketsCache);
      return;
    }

    const ticket = ticketsCache.find((t) => t.id === ticketId);
    if (!ticket) return;

    if (!canMoveToStatus(targetStatus)) {
      showNotification('Restricted', 'You do not have permission to move this ticket.', 'error');
      renderKanban(ticketsCache);
      return;
    }

    if (!hasAssignedCategory(ticket)) {
      assignModalState.ticketId = ticketId;
      assignModalState.pendingStatus = targetStatus;
      await openAssignModalWithTicket(ticketId, ticket);
      renderKanban(ticketsCache);
      return;
    }

    await updateTicketStatus(ticketId, targetStatus);
  };

  // ========================================
  // LOAD TICKETS
  // ========================================
  const renderTableView = (tickets) => {
    const unassignedTbody = document.querySelector('.mgmt-table[data-status="unassigned"] tbody');
    const statusTbodies = {
      open: document.querySelector('.mgmt-table[data-status="open"] tbody'),
      inProgress: document.querySelector('.mgmt-table[data-status="in-progress"] tbody'),
      resolved: document.querySelector('.mgmt-table[data-status="resolved"] tbody'),
    };

    const unassigned = tickets.filter((t) => !hasAssignedCategory(t));
    const assigned = tickets.filter((t) => hasAssignedCategory(t));

    if (unassignedTbody) {
      unassignedTbody.innerHTML = unassigned.length
        ? unassigned.map((t) => `
            <tr data-ticket-id="${escapeHtml(t.id || '')}">
              <td>${escapeHtml(t.title || 'Untitled')}</td>
              <td>${escapeHtml(truncateText(t.description, 100))}</td>
              <td>${formatDate(t.date)}</td>
              <td><button class="action-btn primary-btn assign-category-btn">Assign Category</button></td>
            </tr>
          `).join('')
        : '<tr><td colspan="4" style="text-align:center;padding:40px;color:#666;">No unassigned tickets</td></tr>';
      attachAssignButtonListeners();
    }

    const buckets = { open: [], inProgress: [], resolved: [] };
    assigned.forEach((t) => {
      const status = normalizeStatusKey(t.status);
      if (status === 'in-progress') buckets.inProgress.push(t);
      else if (status === 'resolved') buckets.resolved.push(t);
      else buckets.open.push(t);
    });

    const renderAssignedRows = (list) => list.length
      ? list.map((t) => `
          <tr data-ticket-id="${escapeHtml(t.id || '')}">
            <td>${escapeHtml(t.title || 'Untitled')}</td>
            <td>${escapeHtml(truncateText(t.description, 100))}</td>
            <td>${formatDate(t.date)}</td>
            <td>${escapeHtml(t.category || 'Unassigned')}</td>
            <td><span class="status-badge ${getStatusClass(t.status)}">${escapeHtml(t.status || '')}</span></td>
            <td>
              <div class="action-icons">
                <button class="icon-action-btn view-btn" title="View">👁</button>
                <button class="icon-action-btn edit-btn" title="Edit">✏️</button>
                <button class="icon-action-btn delete-btn" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">No tickets in this status</td></tr>';

    if (statusTbodies.open) statusTbodies.open.innerHTML = renderAssignedRows(buckets.open);
    if (statusTbodies.inProgress) statusTbodies.inProgress.innerHTML = renderAssignedRows(buckets.inProgress);
    if (statusTbodies.resolved) statusTbodies.resolved.innerHTML = renderAssignedRows(buckets.resolved);

    attachViewButtonListeners();
    attachEditButtonListeners();
    attachDeleteButtonListeners();
    attachTableSorting();
    if (ticketsFilterInput) applyTableFilter(ticketsFilterInput.value);
  };

  const loadTickets = async () => {
    console.log('🎫 Starting to load tickets...');
    setKanbanLoading(true);

    try {
      const res = await fetch('/api/tickets');
      console.log('📡 Response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Response not OK. Status:', res.status, 'Error:', errorText);
        throw new Error(`Failed to fetch tickets: ${res.status}`);
      }

      ticketsCache = await res.json();
      console.log('✅ Fetched tickets:', ticketsCache);

      const pill = document.querySelector('.mgmt-pill');
      if (pill) pill.textContent = `${ticketsCache.length} total`;

      renderTableView(ticketsCache);
      renderKanban(ticketsCache);

      console.log('🎉 Tickets loaded successfully');
    } catch (err) {
      console.error('💥 Failed to load tickets:', err);
      const errorMessage = `Error loading tickets: ${err.message}`;

      document.querySelectorAll('.mgmt-table tbody').forEach((tbody) => {
        const colSpan = tbody.closest('.mgmt-table')?.dataset.status === 'unassigned' ? 4 : 6;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;padding:40px;color:#d32f2f;">${errorMessage}</td></tr>`;
      });

      showNotification('Error', 'Failed to load tickets. Check console for details.', 'error');
    } finally {
      setKanbanLoading(false);
    }
  };

  // ========================================
  // POPULATE CATEGORIES
  // ========================================
  const populateCategories = async () => {
    const categorySelect = document.getElementById('assign-category-select');
    const editCategorySelect = document.getElementById('edit-category-select');
    
    console.log('📂 Loading categories...');
    
    try {
      const res = await fetch('/api/categories');
      console.log('📡 Categories response status:', res.status);
      
      if (!res.ok) {
        console.error('❌ Failed to load categories');
        return;
      }
      
      const categories = await res.json();
      console.log('✅ Categories loaded:', categories);
      
      // Populate assign modal
      if (categorySelect) {
        while (categorySelect.options.length > 1) categorySelect.remove(1);
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          categorySelect.appendChild(opt);
        });
        console.log('✅ Assign category select populated');
      }
      
      // Populate edit modal
      if (editCategorySelect) {
        while (editCategorySelect.options.length > 1) editCategorySelect.remove(1);
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.name;
          opt.textContent = c.name;
          editCategorySelect.appendChild(opt);
        });
        console.log('✅ Edit category select populated');
      }
    } catch (err) {
      console.error('💥 Error loading categories:', err);
    }
  };

  // ========================================
  // MODAL CLOSE HANDLERS
  // ========================================
  document.getElementById('assign-modal-close')?.addEventListener('click', closeAssignModal);
  document.getElementById('assign-modal-cancel')?.addEventListener('click', closeAssignModal);
  
  document.getElementById('edit-modal-close')?.addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-cancel')?.addEventListener('click', closeEditModal);
  
  document.getElementById('delete-modal-close')?.addEventListener('click', closeDeleteModal);
  document.getElementById('delete-modal-cancel')?.addEventListener('click', closeDeleteModal);
  
  document.getElementById('view-modal-close')?.addEventListener('click', closeViewModal);
  document.getElementById('view-modal-close-btn')?.addEventListener('click', closeViewModal);

  // ========================================
  // TICKET UPDATE HELPERS
  // ========================================
  const updateTicketCategory = async (ticketId, category) => {
    const res = await fetch(`/api/tickets/${ticketId}/category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });

    if (!res.ok) {
      throw new Error('Failed to assign category');
    }

    return res.json().catch(() => ({}));
  };

  const updateTicketStatus = async (ticketId, statusKey, options = {}) => {
    const { skipReload = false, silent = false } = options;
    const statusLabel = getStatusLabel(statusKey);

    setKanbanLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusLabel })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      if (!silent) {
        showNotification('Success', `Ticket moved to ${statusLabel}`, 'success');
      }

      if (!skipReload) {
        await loadTickets();
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      showNotification('Error', err.message || 'Failed to update status', 'error');
    } finally {
      setKanbanLoading(false);
    }
  };

  // ========================================
  // ASSIGN CATEGORY ACTION
  // ========================================
  document.getElementById('assign-modal-assign')?.addEventListener('click', async () => {
    const category = document.getElementById('assign-category-select')?.value;
    if (!category || !assignModalState.ticketId) {
      showNotification('Missing category', 'Please select a category before continuing.', 'warning');
      return;
    }

    const assignButton = document.getElementById('assign-modal-assign');
    if (assignButton) {
      assignButton.disabled = true;
      assignButton.textContent = 'Assigning...';
    }

    try {
      await updateTicketCategory(assignModalState.ticketId, category);

      if (assignModalState.pendingStatus && assignModalState.pendingStatus !== 'open') {
        await updateTicketStatus(assignModalState.ticketId, assignModalState.pendingStatus, {
          skipReload: true,
          silent: true
        });
      }

      showNotification('Success', 'Category assigned successfully!', 'success', 3000);
      closeAssignModal();
      await loadTickets();
    } catch (err) {
      console.error('Error assigning category:', err);
      showNotification('Error', err.message || 'Failed to assign category', 'error', 3000);
    } finally {
      if (assignButton) {
        assignButton.disabled = false;
        assignButton.textContent = 'Assign & Continue';
      }
    }
  });

  // ========================================
  // EDIT CATEGORY ACTION
  // ========================================
  document.getElementById('edit-modal-update')?.addEventListener('click', async () => {
    const category = document.getElementById('edit-category-select')?.value;
    if (!category || !editModalState.ticketId) return;

    try {
      const res = await fetch(`/api/tickets/${editModalState.ticketId}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });

      if (res.ok) {
        showNotification('Success', 'Category updated successfully!', 'success', 3000);
        closeEditModal();
        await loadTickets();
      } else {
        showNotification('Error', 'Failed to update category', 'error', 3000);
      }
    } catch (err) {
      console.error('Error updating category:', err);
      showNotification('Error', 'Failed to update category', 'error', 3000);
    }
  });

  // ========================================
  // DELETE TICKET ACTION
  // ========================================
  document.getElementById('delete-modal-delete')?.addEventListener('click', async () => {
    if (!deleteModalState.ticketId) return;

    try {
      const res = await fetch(`/api/tickets/${deleteModalState.ticketId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showNotification('Success', 'Ticket deleted successfully!', 'success', 3000);
        closeDeleteModal();
        await loadTickets();
      } else {
        showNotification('Error', 'Failed to delete ticket', 'error', 3000);
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      showNotification('Error', 'Failed to delete ticket', 'error', 3000);
    }
  });

  // ========================================
  // NEW TICKET NOTIFICATION SYSTEM
  // ========================================
  let lastTicketCount = 0;
  let knownTicketIds = new Set();
  let isFirstLoad = true;

  const checkForNewTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) return;
      
      const tickets = await res.json();
      const currentTicketIds = new Set(tickets.map(t => t.id));
      
      // Skip notification on first load
      if (isFirstLoad) {
        knownTicketIds = currentTicketIds;
        lastTicketCount = tickets.length;
        isFirstLoad = false;
        return;
      }
      
      // Check for new tickets
      const newTickets = tickets.filter(t => !knownTicketIds.has(t.id));
      
      if (newTickets.length > 0) {
        // Show notification for each new ticket
        newTickets.forEach(ticket => {
          const category = ticket.category ? `Category: ${ticket.category}` : 'Unassigned';
          showNotification(
            '🎫 New Ticket Received',
            `"${ticket.title}" - ${category}`,
            'info',
            5000
          );
        });
        
        // Play notification sound (optional)
        playNotificationSound();
        
        // Update known tickets
        knownTicketIds = currentTicketIds;
        lastTicketCount = tickets.length;
      }
    } catch (err) {
      console.error('Error checking for new tickets:', err);
    }
  };

  // Optional: Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PVqzn77BdGAk+ltryxnMnBSh+zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1rwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofszy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4PUqzn77BdGAk+ltryxnMnBSh9zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1pwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofczy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4PUqzn77BdGAk+ltryxnMnBSh9zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1pwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofczy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4PUqzn77BdGAk+ltryxnMnBSh9zPLaizsIGGS56+qgUhENTKXh8bllHAU2jtLyz4A0Bx1pwO/mnFIOD1Ks5++wXRgJPpba8sZzJwUofczy2os7CBhkuevqoFIRDUyl4fG5ZRwFNo7S8s+ANAcdacDv5pxSDg9SrOfvsF0YCT6W2vLGcycFKH3M8tqLOwgYZLnr6qBSEQ1MpeHxuWUcBTaO0vLPgDQHHWnA7+acUg4=');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (err) {
      // Silently fail if audio doesn't work
    }
  };

  // ========================================
  // EVENT LISTENERS FOR NOTIFICATIONS
  // ========================================
  const bellBtn = document.getElementById("bell-btn");
  const notificationsPanel = document.getElementById("notifications-panel");
  const markAllReadBtn = document.getElementById("mark-all-read-btn");

  bellBtn?.addEventListener("click", () => {
    notificationsPanel?.classList.toggle("hidden");
  });

  markAllReadBtn?.addEventListener("click", async () => {
    if (adminId) {
      try {
        const response = await fetch(`/api/staff/${adminId}/notifications/read-all`, {
          method: 'PATCH',
        });

        if (response.ok) {
          await loadNotifications();
        }
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
  });

  // View History button
  const viewHistoryBtn = document.getElementById('view-history-btn');
  viewHistoryBtn?.addEventListener('click', () => {
    window.location.href = '/admin/notification-history.html';
  });

  document.addEventListener("click", (e) => {
    if (!notificationsPanel || !bellBtn) return;
    if (notificationsPanel.contains(e.target) || bellBtn.contains(e.target)) return;
    notificationsPanel.classList.add("hidden");
  });

  // ========================================
  // INITIALIZE
  // ========================================
  console.log('🚀 Initializing admin dashboard...');
  setViewMode(activeViewMode);
  await populateCategories();
  await loadTickets();

  // Check for new tickets every 10 seconds
  setInterval(() => {
    loadTickets();
    checkForNewTickets();
  }, 10000);

  console.log('✅ Initialization complete');
  console.log('📡 New ticket notification system active');
});
