(() => {
  const ClientApp = window.ClientApp || {};
  const state = ClientApp.state || {};
  const utils = ClientApp.utils || {};
  const formatTime =
    utils.formatTime ||
    ((dateStr) =>
      dateStr
        ? new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : "");

  const chatModal = document.getElementById("chat-modal");
  const chatMessages = document.getElementById("chat-messages");
  const chatTitle = document.getElementById("chat-ticket-title");
  const chatId = document.getElementById("chat-ticket-id");
  const closeChatBtn = document.getElementById("close-chat");
  const sendBtn = document.getElementById("send-message");
  const messageInput = document.getElementById("message-input");
  const attachBtn = document.getElementById("attach-btn");
  const fileInput = document.getElementById("file-input");
  const attachmentsPreview = document.getElementById("attachments-preview");

  let selectedFiles = [];

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    }
    
    if (['pdf'].includes(ext)) {
      return `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
    }
    
    if (['doc', 'docx'].includes(ext)) {
      return `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    }
    
    return `<svg viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
  };

  // Render attachments preview
  const renderAttachments = () => {
    if (!attachmentsPreview) return;
    
    attachmentsPreview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'attachment-item';
      item.innerHTML = `
        <div class="attachment-icon">${getFileIcon(file.name)}</div>
        <span class="attachment-name" title="${file.name}">${file.name}</span>
        <span class="attachment-size">${formatFileSize(file.size)}</span>
        <button type="button" class="attachment-remove" data-index="${index}">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      attachmentsPreview.appendChild(item);
    });

    // Add remove listeners
    attachmentsPreview.querySelectorAll('.attachment-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(e.currentTarget.dataset.index);
        selectedFiles.splice(index, 1);
        renderAttachments();
      });
    });
  };

  // Handle file selection
  attachBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    // Add to selected files
    selectedFiles = [...selectedFiles, ...validFiles];
    
    // Limit to 5 files
    if (selectedFiles.length > 5) {
      alert('You can only attach up to 5 files at once.');
      selectedFiles = selectedFiles.slice(0, 5);
    }

    renderAttachments();
    
    // Reset file input
    if (fileInput) fileInput.value = '';
  });

  const renderMessages = (allMessages) => {
    if (!chatMessages) return;

    // Get current user ID from state or localStorage
    const currentUserId = state.currentUserId || localStorage.getItem("userId");

    chatMessages.innerHTML = allMessages
      .map((msg) => {
        if (msg.isDescription) {
          return `
					<div class="message client">
						<div class="message-avatar">C</div>
						<div class="message-content">
							<div class="message-sender">You</div>
							<div class="message-text">${msg.text}</div>
						</div>
					</div>
				`;
        }

        // Determine if message is from staff or client
        const isFromStaff =
          msg.senderId && String(msg.senderId) === String(state.currentStaffId);
        const isClient =
          !isFromStaff && String(msg.senderId) === String(currentUserId);
        const avatar = isClient ? "C" : "A";
        const senderName = isClient ? "You" : msg.senderName || "Agent";

        // Build attachments HTML if present
        let attachmentsHtml = '';
        if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
          attachmentsHtml = '<div class="message-attachments">' + 
            msg.attachments.map(att => {
              const isImage = att.mimetype && att.mimetype.startsWith('image/');
              const downloadLink = att.filepath || '#';
              
              if (isImage) {
                return `
                  <div class="message-attachment image-attachment">
                    <img src="${downloadLink}" alt="${att.filename}" style="max-width: 250px; max-height: 250px; border-radius: 4px; cursor: pointer;" onclick="window.open('${downloadLink}', '_blank')">
                    <div class="attachment-name" style="margin-top: 6px;">${att.filename}</div>
                  </div>
                `;
              } else {
                return `
                  <a href="${downloadLink}" download="${att.filename}" class="message-attachment file-attachment">
                    <svg viewBox="0 0 24 24">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                      <polyline points="13 2 13 9 20 9"/>
                    </svg>
                    <span class="attachment-name">${att.filename}</span>
                    <span class="att-size">${formatFileSize(att.size)}</span>
                  </a>
                `;
              }
            }).join('') +
            '</div>';
        }

        return `
				<div class="message ${isClient ? "client" : "agent"}">
					<div class="message-avatar">${avatar}</div>
					<div class="message-content">
						<div class="message-sender">${senderName}</div>
						<div class="message-text">${msg.message || msg.text || ""}</div>
						${attachmentsHtml}
						<div class="message-time">${formatTime(msg.timestamp || msg.createdAt)}</div>
					</div>
				</div>
			`;
      })
      .join("");

    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const loadMessages = async (ticketId) => {
    try {
      const ticketRes = await fetch(`/api/tickets/${ticketId}`);
      const ticket = ticketRes.ok ? await ticketRes.json() : null;

      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (!res.ok) return;

      const messages = await res.json();
      const allMessages = [];

      // Get current user ID from state or localStorage
      const currentUserId =
        state.currentUserId || localStorage.getItem("userId");

      if (ticket && ticket.description) {
        allMessages.push({
          isDescription: true,
          text: ticket.description,
          senderName: "You",
          senderId: currentUserId,
          staffId: state.currentStaffId,
        });
      }

      allMessages.push(...messages);
      renderMessages(allMessages);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const markTicketAsOpened = (ticketId) => {
    try {
      console.log(`Marking ticket #${ticketId} as viewed...`);

      // Notify backend that client has viewed the agent's message
      // This will set hasAgentView = true on the backend
      fetch(`/api/tickets/${ticketId}/mark-viewed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error(
              `Failed to mark ticket as viewed. Status: ${res.status}, Error:`,
              errorText
            );
            return;
          }
          console.log(`✓ Ticket #${ticketId} marked as viewed on server`);

          // Refresh ticket list to update badge immediately
          if (
            window.ClientApp &&
            typeof window.ClientApp.loadMyTickets === "function"
          ) {
            setTimeout(() => {
              window.ClientApp.loadMyTickets();
            }, 500);
          }
        })
        .catch((err) => {
          console.error("Error marking ticket as viewed on server:", err);
          alert(
            "Note: Unable to mark ticket as viewed on server. The badge may reappear."
          );
        });
    } catch (err) {
      console.error("Error marking ticket as opened:", err);
    }
  };

  const openChat = async (ticketId) => {
    if (!chatModal) return;
    state.currentTicketId = ticketId;

    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Failed to fetch ticket");

      const ticket = await res.json();
      state.currentStaffId = ticket.assignedStaffId || null;
      state.currentTicketId = ticket.id || ticketId;

      if (chatTitle) chatTitle.textContent = ticket.title || "Untitled";
      if (chatId) chatId.textContent = `Ticket #${ticket.id}`;

      chatModal.classList.add("active");

      // Mark ticket as opened with current timestamp and clear notifications for this ticket
      markTicketAsOpened(ticketId);
      fetch(`/api/notifications/ticket/${encodeURIComponent(ticketId)}/read`, {
        method: "PATCH",
      }).catch(() => {});

      await loadMessages(ticketId);

      if (state.messagePolling) clearInterval(state.messagePolling);
      state.messagePolling = setInterval(() => loadMessages(ticketId), 5000);
    } catch (err) {
      console.error("Error opening chat:", err);
      alert("Failed to load ticket details");
    }
  };

  const closeChat = () => {
    if (!chatModal) return;
    chatModal.classList.remove("active");
    if (state.messagePolling) {
      clearInterval(state.messagePolling);
      state.messagePolling = null;
    }
    state.currentTicketId = null;
    state.currentStaffId = null;

    // Refresh ticket list to update badges after viewing
    if (
      window.ClientApp &&
      typeof window.ClientApp.loadMyTickets === "function"
    ) {
      window.ClientApp.loadMyTickets();
    }
  };

  const sendMessage = async () => {
    if (!messageInput || !state.currentTicketId) return;
    const text = messageInput.value.trim();
    if (!text && selectedFiles.length === 0) return;

    // Get senderId directly from localStorage as fallback
    const senderId = state.currentUserId || localStorage.getItem("userId");

    if (!senderId) {
      alert("Please log in to send messages");
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("senderId", senderId);
      formData.append("senderName", localStorage.getItem("userName") || "Client");
      formData.append("receiverId", state.currentStaffId || "");
      formData.append("staffId", state.currentStaffId || "");
      formData.append("message", text);
      formData.append("timestamp", new Date().toISOString());
      
      // Append each file
      selectedFiles.forEach(file => {
        formData.append("attachments", file);
      });

      const res = await fetch(
        `/api/tickets/${state.currentTicketId}/messages`,
        {
          method: "POST",
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        }
      );

      if (res.ok) {
        messageInput.value = "";
        selectedFiles = [];
        renderAttachments();
        await loadMessages(state.currentTicketId);
      } else {
        const errorData = await res.json();
        console.error("Send error:", errorData);
        alert(
          "Failed to send message: " + (errorData.message || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Error sending message");
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (closeChatBtn) closeChatBtn.addEventListener("click", closeChat);
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);

    if (messageInput) {
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    window.Messages = {
      openChat,
      loadMessages,
    };
  });
})();
