export enum SupportTicketStatus {
  OPENED = 'OPENED',
  ASSIGNED = 'ASSIGNED',
  HOLD = 'HOLD',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportTicketCategory {
  TICKETS = 'TICKETS',
  PAYMENTS = 'PAYMENTS',
  VENDORS = 'VENDORS',
  TECHNICAL = 'TECHNICAL',
  FEEDBACK = 'FEEDBACK',
}

export interface TicketUpdate {
  timestamp: string;
  userId: string;
  updateText: string;
}

export interface SupportTicket {
  _id: string;
  ticketId: string;
  status: SupportTicketStatus;
  createdBy: string;
  createDate: string;
  assignedTo?: string;
  ticketCategory: SupportTicketCategory;
  ticketTitle: string;
  ticketDescription: string;
  updates: TicketUpdate[];
}

export interface SupportTicketsResponse {
  data: SupportTicket[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

export interface CreateSupportTicketDto {
  ticketCategory: SupportTicketCategory;
  ticketTitle: string;
  ticketDescription: string;
  createdBy?: string;
}

export interface UpdateSupportTicketDto extends Partial<CreateSupportTicketDto> {
  status?: SupportTicketStatus;
  assignedTo?: string;
}

export interface AddTicketUpdateDto {
  updateText: string;
  userId?: string;
}

// Utility constants
export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPENED]: 'Open',
  [SupportTicketStatus.ASSIGNED]: 'Assigned',
  [SupportTicketStatus.HOLD]: 'On Hold',
  [SupportTicketStatus.RESOLVED]: 'Resolved',
  [SupportTicketStatus.CLOSED]: 'Closed',
};

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  [SupportTicketCategory.TICKETS]: 'Tickets',
  [SupportTicketCategory.PAYMENTS]: 'Payments',
  [SupportTicketCategory.VENDORS]: 'Vendors',
  [SupportTicketCategory.TECHNICAL]: 'Technical',
  [SupportTicketCategory.FEEDBACK]: 'Feedback',
};

export const SUPPORT_TICKET_STATUS_COLORS: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPENED]: '#3B82F6',
  [SupportTicketStatus.ASSIGNED]: '#F59E0B',
  [SupportTicketStatus.HOLD]: '#EF4444',
  [SupportTicketStatus.RESOLVED]: '#10B981',
  [SupportTicketStatus.CLOSED]: '#6B7280',
};

// Status priority for sorting
export const SUPPORT_TICKET_STATUS_PRIORITY: Record<SupportTicketStatus, number> = {
  [SupportTicketStatus.OPENED]: 1,
  [SupportTicketStatus.ASSIGNED]: 2,
  [SupportTicketStatus.HOLD]: 3,
  [SupportTicketStatus.RESOLVED]: 4,
  [SupportTicketStatus.CLOSED]: 5,
};
