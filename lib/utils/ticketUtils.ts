import { Ticket } from '../api/tickets';

export const TICKET_STATUS_PRIORITY = {
  ACTIVE: 1,
  REDEEMED: 2,
  CANCELLED: 3,
  EXPIRED: 4,
  REVOKED: 5,
} as const;

export const sortTicketsByStatusAndDate = (tickets: Ticket[]): Ticket[] => {
  console.log('TicketUtils - Sorting tickets:', {
    totalTickets: tickets.length,
    statusBreakdown: getStatusBreakdown(tickets),
  });

  const sorted = tickets.sort((a, b) => {
    // First sort by status priority
    const statusA = TICKET_STATUS_PRIORITY[a.status] || 999;
    const statusB = TICKET_STATUS_PRIORITY[b.status] || 999;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // Then sort by date (most recent first within same status)
    const dateA = new Date(a.productDate || a.createdAt);
    const dateB = new Date(b.productDate || b.createdAt);

    return dateB.getTime() - dateA.getTime();
  });

  console.log('TicketUtils - Sorted tickets:', {
    first5: sorted.slice(0, 5).map((t) => ({
      id: t._id?.substring(0, 8),
      status: t.status,
      date: t.productDate || t.createdAt,
      product: t.productName,
    })),
  });

  return sorted;
};

export const getActiveTickets = (tickets: Ticket[]): Ticket[] => {
  const active = tickets.filter((ticket) => ticket.status === 'ACTIVE');
  console.log('TicketUtils - Active tickets:', { count: active.length });
  return active;
};

export const getRecentActiveTickets = (tickets: Ticket[], limit: number = 4): Ticket[] => {
  const activeTickets = getActiveTickets(tickets);
  const sortedActive = sortTicketsByStatusAndDate(activeTickets);
  const recent = sortedActive.slice(0, limit);

  console.log('TicketUtils - Recent active tickets:', {
    totalActive: activeTickets.length,
    limitRequested: limit,
    returned: recent.length,
    tickets: recent.map((t) => ({
      id: t._id?.substring(0, 8),
      product: t.productName,
      date: t.productDate || t.createdAt,
    })),
  });

  return recent;
};

export const getStatusBreakdown = (tickets: Ticket[]): Record<string, number> => {
  const breakdown = tickets.reduce(
    (acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('TicketUtils - Status breakdown:', breakdown);
  return breakdown;
};

export const getTicketStatusColor = (status: string): string => {
  switch (status) {
    case 'ACTIVE':
      return '#10B981'; // Green
    case 'REDEEMED':
      return '#EF4444'; // Red
    case 'CANCELLED':
      return '#6B7280'; // Gray
    case 'EXPIRED':
      return '#F59E0B'; // Orange
    case 'REVOKED':
      return '#8B5CF6'; // Purple
    default:
      return '#60A5FA'; // Blue
  }
};

export const formatTicketDate = (ticket: Ticket): string => {
  const date = new Date(ticket.productDate || ticket.createdAt);
  return date.toLocaleDateString();
};

export const formatTicketPrice = (ticket: Ticket): string => {
  const price = ticket.totalPrice || ticket.productPrice || 0;
  return `$${price.toFixed(2)}`;
};
