
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
  Search,
  FolderKanban,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

import { Input } from "@/components/ui/input";

import { type Ticket } from "@/lib/types";
import { initialTickets } from "@/data/tickets";
import { TicketBoard } from "@/components/ticket-board";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

const TICKETS_STORAGE_KEY = 'proflow-tickets';

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setIsClient(true)
    const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (storedTickets) {
      const parsedTickets = JSON.parse(storedTickets).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
      setTickets(parsedTickets);
    } else {
      setTickets(initialTickets);
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    }
  }, [tickets, isClient]);

  const filteredTickets = useMemo(() => {
    if (!searchTerm) return tickets;
    return tickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);


  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prevTickets) => [newTicket, ...prevTickets]);
  };
  
  const handleTicketUpdated = (updatedTicket: Ticket) => {
     setTickets((prevTickets) => prevTickets.map(ticket => ticket.id === updatedTicket.id ? { ...ticket, ...updatedTicket} : ticket));
  }

  const handleTicketDeleted = (deletedTicketId: string) => {
    setTickets((prevTickets) => prevTickets.filter(ticket => ticket.id !== deletedTicketId));
  };


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="font-semibold text-lg">ProFlow</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive>
                <Link href="/">
                  <Home />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/projects">
                  <FolderKanban />
                  Projects
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/tickets">
                  <TicketIcon />
                  All Tickets
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="#">
                  <Users />
                  Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/settings">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <CreateTicketDialog onTicketCreated={handleTicketCreated} />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
          </div>
          {isClient && <TicketBoard tickets={filteredTickets} setTickets={setTickets} onTicketUpdated={handleTicketUpdated} onTicketDeleted={handleTicketDeleted} />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
