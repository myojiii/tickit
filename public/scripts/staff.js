document.addEventListener("DOMContentLoaded", async () => {
  // ========================================
  // SIDEBAR TOGGLE FUNCTIONALITY
  // ========================================
  const sidebar = document.querySelector('.sidebar');
  const layout = document.querySelector('.layout');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  let sidebarCollapsed = false;
  
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    layout.classList.add('sidebar-collapsed');
  }
  
  toggleBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    layout.classList.toggle('sidebar-collapsed');
    sidebarCollapsed = sidebar.classList.contains('collapsed');
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
  // TOAST NOTIFICATION SYSTEM
  // ========================================
  const showToastNotification = (title, message, type = "info", duration = 5000) => {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>';
    } else if (type === "error") {
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
    }

    notification.innerHTML = `
      <div class="notification-icon">${iconSvg}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <p class="notification-message">${message}</p>
      </div>
      <button class="notification-close" aria-label="Close notification">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
      </button>
    `;

    container.appendChild(notification);

    const closeBtn = notification.querySelector(".notification-close");
    const removeNotification = () => {
      notification.classList.add("removing");
      setTimeout(() => notification.remove(), 300);
    };
    closeBtn?.addEventListener("click", removeNotification);

    if (duration > 0) {
      setTimeout(removeNotification, duration);
    }
  };

  // Helper function to build ticket ID
  const buildTicketId = (id = "") => {
    if (!id) return "TKT";
    return `TKT-${id.slice(-6).toUpperCase()}`;
  };

  // Helper to get relative time
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

  // ========================================
  // BACKEND-DRIVEN NOTIFICATION SYSTEM
  // ========================================
  const staffId = localStorage.getItem("userId");
  console.log("Staff ID:", staffId);
  
  let notifications = [];
  let lastCheckTimestamp = Date.now();

  // Load all notifications from backend
  const loadNotifications = async () => {
    if (!staffId) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        notifications = data.notifications || [];
        updateNotificationUI(data.unreadCount || 0);
        console.log('Loaded notifications:', notifications.length, 'Unread:', data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Check for new notifications since last check
  const checkForNewNotifications = async () => {
    if (!staffId) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/notifications/new?since=${lastCheckTimestamp}`);
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];
        
        if (newNotifications.length > 0) {
          console.log('Found new notifications:', newNotifications.length);
          
          // Show toast for each new notification
          newNotifications.forEach(notif => {
            const type = notif.type === 'new_message' ? 'success' : 'info';
            showToastNotification(notif.title, notif.message, type);
          });
          
          // Reload all notifications to update the list
          await loadNotifications();
        }
        
        lastCheckTimestamp = Date.now();
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };

  // Update notification UI
  const updateNotificationUI = (unreadCount) => {
    const notificationsList = document.getElementById('notifications-list');
    const bellBadge = document.getElementById('bell-badge');
    
    if (!notificationsList) return;

    // Update badge
    if (bellBadge) {
      bellBadge.setAttribute('data-count', unreadCount);
      if (unreadCount > 0) {
        bellBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        bellBadge.classList.add('active');
      } else {
        bellBadge.textContent = '';
        bellBadge.classList.remove('active');
      }
    }

    // Clear list
    notificationsList.innerHTML = '';

    if (notifications.length === 0) {
      notificationsList.innerHTML = '<p class="empty-state">No notifications</p>';
      return;
    }

    // Limit to 5 most recent notifications
    const recentNotifications = notifications.slice(0, 5);

    // Render notifications
    recentNotifications.forEach((notif, index) => {
      const item = document.createElement('div');
      item.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
      
      // Determine notification style based on type
      if (notif.type === 'new_message') {
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

      // Determine type label
      let typeLabel = 'New Message';
      if (notif.type === 'new_message') typeLabel = 'New Message';
      else if (notif.type === 'ticket_assigned') typeLabel = 'Ticket Assigned';
      else if (notif.type === 'status_changed') typeLabel = 'Status Changed';
      else if (notif.type === 'priority_changed') typeLabel = 'Priority Changed';

      // Extract metadata
      const clientName = notif.metadata?.clientName || 'Unknown';
      const ticketTitle = notif.metadata?.ticketTitle || notif.title || 'Untitled Ticket';
      const messagePreview = notif.message || '';

      // Helper function for relative time
      const getRelativeTime = (timestamp) => {
        const now = Date.now();
        const time = new Date(timestamp).getTime();
        const diff = now - time;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
      };

      item.innerHTML = `
        <div class="notification-item-content">
          <div class="notification-item-type">${typeLabel}</div>
          <div class="notification-item-title">${ticketTitle}</div>
          <div class="notification-item-submitter">${messagePreview}</div>
          <div class="notification-item-time">${getRelativeTime(notif.createdAt)}</div>
        </div>
      `;

      // Click to mark as read and navigate to ticket
      item.addEventListener('click', async (e) => {
        if (!notif.read) {
          await markAsRead(notif._id);
        }
        // Navigate to the ticket detail page
        if (notif.ticketId) {
          window.location.href = `/staff/details.html?ticketId=${notif.ticketId}`;
        }
      });

      notificationsList.appendChild(item);
    });

    // Add "View All History" button if there are more than 5 notifications
    if (notifications.length > 5) {
      const viewAllBtn = document.createElement('button');
      viewAllBtn.className = 'view-all-history-btn';
      viewAllBtn.textContent = 'View All History';
      viewAllBtn.addEventListener('click', () => {
        window.location.href = '/staff/notification-history.html';
      });
      notificationsList.appendChild(viewAllBtn);
    }
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
      console.error('Error marking notification as read:', error);
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
      console.error('Error deleting notification:', error);
    }
  };

  // Initialize notification system
  if (staffId) {
    await loadNotifications();
    
    // Check for new notifications every 10 seconds
    setInterval(checkForNewNotifications, 10000);
  }

  // ========================================
  // TICKET FILTERING AND DISPLAY
  // ========================================
  const ticketsTableBody = document.getElementById("staff-tickets-body");
  const ticketsTabs = document.querySelectorAll(".ticket-tab");
  const tabsRow = document.querySelector(".tabs-and-priority");
  const priorityFilter = document.getElementById("priority-filter");
  const tableWrap = document.querySelector(".table-wrap");
  const kanbanWrap = document.getElementById("kanban-wrap");
  const kanbanColumns = {
    open: document.getElementById("kanban-open"),
    "in-progress": document.getElementById("kanban-inprogress"),
    resolved: document.getElementById("kanban-resolved"),
  };
  const viewToggleBtns = document.querySelectorAll(".view-toggle-btn");

  let ticketsCache = [];
  let filteredTickets = [];
  let currentTab = "all";
  let currentView = "list";

  const normalize = (value = "") => value.toString().trim().toLowerCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusPillClass = (status = "") => {
    const s = normalize(status);
    if (s.includes("progress")) return "in-progress";
    if (s.includes("resolved")) return "resolved";
    if (s.includes("open") || s.includes("pending")) return "open";
    return "unassigned";
  };

  const mapStatusForFilter = (status = "") => {
    const s = normalize(status);
    if (s.includes("progress")) return "in-progress";
    if (s.includes("resolved")) return "resolved";
    if (s.includes("open") || s.includes("pending")) return "open";
    if (!s) return "open";
    return s === "unassigned" ? "open" : s;
  };

  const priorityPillClass = (priority = "") => {
    const p = normalize(priority);
    if (p === "high") return "high";
    if (p === "medium") return "medium";
    if (p === "low") return "low";
    if (p === "not set" || !p) return "not-set";
    return "";
  };

  const clearTicketCards = () => {}; // not used in table mode
  const updatePagination = () => {}; // pagination hidden in table mode

  const setViewVisibility = () => {
    const isKanban = currentView === "kanban";
    tableWrap?.classList.toggle("hidden", isKanban);
    kanbanWrap?.classList.toggle("hidden", !isKanban);
    tabsRow?.classList.toggle("hidden", isKanban);
  };

  const renderTickets = (tickets) => {
    if (!ticketsTableBody) return;
    ticketsTableBody.innerHTML = "";

    if (!Array.isArray(tickets) || tickets.length === 0) {
      ticketsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:32px;color:#667085;">No tickets found. Try a different status or priority.</td>
        </tr>
      `;
      return;
    }

    tickets.forEach((ticket) => {
      const statusText = ticket.status || "Unassigned";
      const priorityText = ticket.priority || "Not Set";
      const statusClass = statusPillClass(statusText);
      const priorityClass = priorityPillClass(priorityText);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ticket.id ? buildTicketId(ticket.id) : "—"}</td>
        <td>${ticket.title || "Untitled"}</td>
        <td>${ticket.category || "Uncategorized"}</td>
        <td><span class="table-status ${statusClass}" aria-label="${statusText.toLowerCase()}">${statusText}</span></td>
        <td>${priorityText ? `<span class="table-priority ${priorityClass}">${priorityText}</span>` : "—"}</td>
        <td>${formatDate(ticket.date)}</td>
        <td><a class="table-action-btn" href="/staff/details.html?ticketId=${encodeURIComponent(ticket.id || "")}">View Details</a></td>
      `;
      ticketsTableBody.appendChild(tr);
    });
  };

  const createKanbanCard = (ticket) => {
    const statusKey = mapStatusForFilter(ticket.status);
    const statusLabel = statusKey === "in-progress"
      ? "In Progress"
      : statusKey === "resolved"
      ? "Resolved"
      : "Open";
    const card = document.createElement("div");
    card.className = "kanban-card";
    card.draggable = true;
    card.dataset.id = ticket.id;
    card.dataset.status = statusKey;

    const safeTitle = ticket.title || "Untitled Ticket";
    const safeDesc = ticket.description || ticket.category || "No description";
    const safeCategory = ticket.category || "Uncategorized";
    const priorityText = ticket.priority || "Not Set";

    const displayId = buildTicketId(ticket.id);

    card.innerHTML = `
      <div class="kanban-card-header">
        <div class="kanban-card-title">${safeTitle}</div>
        <span class="status-badge ${statusKey}">${statusLabel}</span>
      </div>
      <div class="kanban-card-meta">${displayId} · ${formatDate(ticket.date)} · ${priorityText}</div>
      <div class="kanban-card-desc">${safeDesc}</div>
      <div class="kanban-card-footer">
        <span class="kanban-card-category">${safeCategory}</span>
        <a class="kanban-card-action" href="/staff/details.html?ticketId=${encodeURIComponent(ticket.id || "")}">View</a>
      </div>
    `;

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", ticket.id);
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("is-dragging"));
    return card;
  };

  const renderKanban = (tickets) => {
    if (!kanbanWrap) return;
    Object.values(kanbanColumns).forEach((col) => col && (col.innerHTML = ""));
    document.querySelectorAll(".kanban-count").forEach((c) => (c.textContent = "0"));

    if (!tickets || tickets.length === 0) {
      Object.values(kanbanColumns).forEach((col) => {
        if (col) col.innerHTML = `<div class="kanban-empty">No tickets</div>`;
      });
      return;
    }

    const counts = { open: 0, "in-progress": 0, resolved: 0 };

    tickets.forEach((ticket) => {
      const statusKey = mapStatusForFilter(ticket.status);
      const target =
        kanbanColumns[statusKey] || kanbanColumns["open"];
      if (!target) return;
      const card = createKanbanCard(ticket);
      target.appendChild(card);
      const bucket = counts.hasOwnProperty(statusKey) ? statusKey : "open";
      counts[bucket] = (counts[bucket] || 0) + 1;
    });

    Object.entries(counts).forEach(([key, val]) => {
      const pill = document.querySelector(`.kanban-count[data-count-for="${key}"]`);
      if (pill) pill.textContent = val;
    });
  };

  const updateTicketStatus = async (ticketId, newStatusKey) => {
    const statusMap = {
      open: "Open",
      "in-progress": "In Progress",
      resolved: "Resolved",
    };
    const payloadStatus = statusMap[newStatusKey] || "Open";

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: payloadStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const ticket = ticketsCache.find((t) => t.id === ticketId);
      if (ticket) ticket.status = payloadStatus;
      applyFilters();
    } catch (err) {
      console.error(err);
      showToastNotification("Update failed", "Could not move ticket. Try again.", "error");
      applyFilters(); // refresh positions back
    }
  };

  const setupColumnDrops = () => {
    const columns = document.querySelectorAll(".kanban-column-body");
    columns.forEach((col) => {
      col.addEventListener("dragover", (e) => {
        e.preventDefault();
        col.classList.add("drag-over");
      });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        col.classList.remove("drag-over");
        const ticketId = e.dataTransfer.getData("text/plain");
        const newStatusKey = col.dataset.status || "open";
        const ticket = ticketsCache.find((t) => t.id === ticketId);
        if (!ticket) return;
        // Optimistic move
        ticket.status =
          newStatusKey === "in-progress"
            ? "In Progress"
            : newStatusKey === "resolved"
            ? "Resolved"
            : "Open";
        renderKanban(filteredTickets);
        updateTicketStatus(ticketId, newStatusKey);
      });
    });
  };

  const setActiveViewBtn = (view) => {
    viewToggleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  };

  const applyFilters = () => {
    const selectedPriority = (priorityFilter?.value || "all").toLowerCase();
    const selectedStatus = currentTab;

    let filtered = ticketsCache.filter((ticket) => {
      const mappedStatus = mapStatusForFilter(ticket.status);
      const priorityPass =
        selectedPriority === "all" ||
        normalize(ticket.priority) === normalize(selectedPriority);
      const statusPass =
        selectedStatus === "all" ||
        normalize(mappedStatus) === normalize(selectedStatus);
      return priorityPass && statusPass;
    });

    // Sort tickets: those with unread notifications go to the top
    filtered.sort((a, b) => {
      const aHasUnread = notifications.some(n => n.ticketId === a.id && !n.read);
      const bHasUnread = notifications.some(n => n.ticketId === b.id && !n.read);
      
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      return 0;
    });

    filteredTickets = filtered;
    if (currentView === "kanban") {
      renderKanban(filtered);
    } else {
      renderTickets(filtered);
    }
  };

  const fetchCategories = async () => {
    if (priorityFilter) priorityFilter.value = "all";
  };

  const loadStaffTickets = async () => {
    const staffId = localStorage.getItem("userId");
    if (!staffId) {
      console.warn("No userId found in localStorage");
      if (ticketsTableBody) {
        ticketsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#667085;">Please log in to view your tickets</td></tr>`;
      }
      setTimeout(() => window.location.href = '/', 2000);
      return;
    }

    try {
      const res = await fetch(`/api/staff/${staffId}/tickets`);
      if (!res.ok) throw new Error("Failed to fetch staff tickets");
      const data = await res.json();
      ticketsCache = Array.isArray(data) ? data : [];
      applyFilters();
    } catch (err) {
      console.error(err);
      ticketsCache = [];
      renderTickets([]);
    }
  };

  // ========================================
  // EVENT LISTENERS
  // ========================================
  const bellBtn = document.getElementById("bell-btn");
  const notificationsPanel = document.getElementById("notifications-panel");
  const closeNotificationsBtn = document.getElementById("close-notifications");
  const markAllReadBtn = document.getElementById("mark-all-read-btn");

  bellBtn?.addEventListener("click", () => {
    notificationsPanel?.classList.toggle("hidden");
  });

  closeNotificationsBtn?.addEventListener("click", () => {
    notificationsPanel?.classList.add("hidden");
  });

  markAllReadBtn?.addEventListener("click", async () => {
    if (staffId) {
      try {
        const response = await fetch(`/api/staff/${staffId}/notifications/read-all`, {
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

  document.addEventListener("click", (e) => {
    if (!notificationsPanel || !bellBtn) return;
    if (notificationsPanel.contains(e.target) || bellBtn.contains(e.target)) return;
    notificationsPanel.classList.add("hidden");
  });

  // Tabs & priority filter
  ticketsTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      ticketsTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = (tab.dataset.status || "all").toLowerCase();
      applyFilters();
    });
  });

  priorityFilter?.addEventListener("change", applyFilters);

  viewToggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (!view) return;
      currentView = view;
      setActiveViewBtn(view);
      setViewVisibility();
      applyFilters();
    });
  });

  // ========================================
  // INITIALIZE
  // ========================================
  await fetchCategories();
  await loadStaffTickets();
  setViewVisibility();
  setupColumnDrops();
  setInterval(loadStaffTickets, 10000);
});
