import { API_URL } from './config';
import { getTokensInfo } from './storage';
import {
  SupportTicket,
  SupportTicketsResponse,
  CreateSupportTicketDto,
  UpdateSupportTicketDto,
  AddTicketUpdateDto,
  SupportTicketStatus,
  SupportTicketCategory,
} from '~/lib/types/support-ticket';

const createHeaders = async (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const tokens = await getTokensInfo();
    if (tokens?.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }
  }

  return headers;
};

export const supportTicketsApi = {
  async getUserSupportTickets(
    page: number = 1,
    limit: number = 20
  ): Promise<SupportTicketsResponse> {
    console.log('SupportTicketsAPI - Fetching user support tickets:', { page, limit });

    const response = await fetch(`${API_URL}/support-tickets?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SupportTicketsAPI - Failed to get user support tickets:', error);
      throw new Error(error.message || 'Failed to get user support tickets');
    }

    const result = await response.json();

    // Backend returns { tickets: [], total, totalPages, currentPage }
    const tickets = result.tickets || [];

    console.log('SupportTicketsAPI - User support tickets fetched:', {
      ticketCount: tickets.length,
      total: result.total,
      sample: tickets.slice(0, 3).map((ticket: SupportTicket) => ({
        id: ticket._id?.substring(0, 8),
        ticketId: ticket.ticketId,
        status: ticket.status,
        category: ticket.ticketCategory,
        title: ticket.ticketTitle?.substring(0, 30),
      })),
    });

    return {
      data: tickets,
      total: result.total || tickets.length,
      page: result.currentPage || page,
      limit,
    };
  },

  async getSupportTicket(ticketId: string): Promise<{ data: SupportTicket }> {
    console.log('SupportTicketsAPI - Fetching support ticket:', ticketId);

    const response = await fetch(`${API_URL}/support-tickets/${ticketId}`, {
      method: 'GET',
      headers: await createHeaders(true),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SupportTicketsAPI - Failed to get support ticket:', error);
      throw new Error(error.message || 'Failed to get support ticket');
    }

    const result = await response.json();

    console.log('SupportTicketsAPI - Support ticket fetched:', {
      id: result._id?.substring(0, 8),
      ticketId: result.ticketId,
      status: result.status,
      title: result.ticketTitle?.substring(0, 30),
      updatesCount: result.updates?.length || 0,
    });

    return { data: result };
  },

  async createSupportTicket(ticketData: CreateSupportTicketDto): Promise<{ data: SupportTicket }> {
    console.log('SupportTicketsAPI - Creating support ticket:', {
      category: ticketData.ticketCategory,
      title: ticketData.ticketTitle?.substring(0, 30),
    });

    const response = await fetch(`${API_URL}/support-tickets`, {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SupportTicketsAPI - Failed to create support ticket:', error);
      throw new Error(error.message || 'Failed to create support ticket');
    }

    const result = await response.json();

    console.log('SupportTicketsAPI - Support ticket created:', {
      id: result._id?.substring(0, 8),
      ticketId: result.ticketId,
      status: result.status,
    });

    return { data: result };
  },

  async updateSupportTicket(
    ticketId: string,
    updateData: UpdateSupportTicketDto
  ): Promise<{ data: SupportTicket }> {
    console.log('SupportTicketsAPI - Updating support ticket:', ticketId, updateData);

    const response = await fetch(`${API_URL}/support-tickets/${ticketId}`, {
      method: 'PUT',
      headers: await createHeaders(true),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SupportTicketsAPI - Failed to update support ticket:', error);
      throw new Error(error.message || 'Failed to update support ticket');
    }

    const result = await response.json();

    console.log('SupportTicketsAPI - Support ticket updated:', {
      id: result._id?.substring(0, 8),
      ticketId: result.ticketId,
      status: result.status,
    });

    return { data: result };
  },

  async addTicketUpdate(
    ticketId: string,
    updateData: AddTicketUpdateDto
  ): Promise<{ data: SupportTicket }> {
    console.log('SupportTicketsAPI - Adding update to support ticket:', ticketId);

    const response = await fetch(`${API_URL}/support-tickets/${ticketId}/updates`, {
      method: 'POST',
      headers: await createHeaders(true),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SupportTicketsAPI - Failed to add ticket update:', error);
      throw new Error(error.message || 'Failed to add ticket update');
    }

    const result = await response.json();

    console.log('SupportTicketsAPI - Ticket update added:', {
      id: result._id?.substring(0, 8),
      ticketId: result.ticketId,
      updatesCount: result.updates?.length || 0,
    });

    return { data: result };
  },

  async updateTicketStatus(
    ticketId: string,
    status: SupportTicketStatus
  ): Promise<{ data: SupportTicket }> {
    console.log('SupportTicketsAPI - Updating ticket status:', ticketId, status);

    const response = await fetch(`${API_URL}/support-tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: await createHeaders(true),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('SupportTicketsAPI - Failed to update ticket status:', error);
      throw new Error(error.message || 'Failed to update ticket status');
    }

    const result = await response.json();

    console.log('SupportTicketsAPI - Ticket status updated:', {
      id: result._id?.substring(0, 8),
      ticketId: result.ticketId,
      status: result.status,
    });

    return { data: result };
  },
};
