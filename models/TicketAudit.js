import mongoose from "mongoose";

const ticketAuditSchema = new mongoose.Schema(
  {
    ticketId: String,
    changedById: String,
    changedByRole: String,
    fromStatus: String,
    toStatus: String,
    note: String,
  },
  { collection: "ticket_audits", timestamps: true }
);

export default mongoose.models.TicketAudit || mongoose.model("ticket_audits", ticketAuditSchema);
