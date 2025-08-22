
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
  Search,
  FolderKanban,
  Mail,
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { type Ticket, type User, type EmailSettings } from "@/lib/types";
import { initialTickets, allUsers as initialAllUsers } from "@/data/tickets";
import { TicketBoard } from "@/components/ticket-board";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { syncEmailsAction } from "@/app/actions";
import { getEmailSettings } from "@/lib/email-settings";

const TICKETS_STORAGE_KEY = 'proflow-tickets';
const CURRENT_USER_STORAGE_KEY = 'proflow-current-user';
const USERS_STORAGE_KEY = 'proflow-users';

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [isSyncing, startSyncTransition] = useTransition();
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const { toast } = useToast();


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
    
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : initialAllUsers;
    setAllUsers(users);

    const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if(storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else if (users.length > 0) {
      setCurrentUser(users[0]);
    }
    setEmailSettings(getEmailSettings());

  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    }
  }, [tickets, isClient]);
  
  useEffect(() => {
    if (isClient) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    }
   }, [allUsers, isClient]);

   useEffect(() => {
    if (isClient && currentUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser, isClient]);

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

  const handleSyncEmails = async () => {
    const currentSettings = getEmailSettings();
    if (!currentSettings) {
        toast({
            variant: "destructive",
            title: "Email Settings Not Found",
            description: "Please configure your email settings on the settings page before syncing.",
        });
        return;
    }

    startSyncTransition(async () => {
      const result = await syncEmailsAction(allUsers, currentSettings);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: result.error,
        });
      } else {
        const ticketCount = result.count || 0;
        const userCount = result.newUsers?.length || 0;

        let description = `${ticketCount} new ticket(s) created.`;
        if (userCount > 0) {
            description += ` ${userCount} new user(s) created.`;
        }

        toast({
          title: "Sync Complete!",
          description: description,
        });
        
        if (ticketCount > 0 && result.tickets) {
           setTickets((prevTickets) => [...result.tickets!, ...prevTickets]);
        }
        if (userCount > 0 && result.newUsers) {
            setAllUsers((prevUsers) => [...prevUsers, ...result.newUsers!]);
        }
      }
    });
  };


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
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
                <Link href="/users">
                  <Users />
                  Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-2 p-2">
                 {isClient && currentUser && <UserNav users={allUsers} currentUser={currentUser} onUserChange={setCurrentUser} />}
            </div>
             <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/settings">
                      <Settings />
                      Settings
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <ThemeToggle />
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold md:text-2xl hidden md:flex">Dashboard</h1>
             <div className="relative md:w-auto md:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-64 lg:w-96"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>
          <div className="flex items-center gap-4">
              <Button onClick={handleSyncEmails} disabled={isSyncing}>
                {isSyncing ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                    </>
                ) : (
                    <>
                    <Mail className="mr-2 h-4 w-4" />
                    Sync Emails
                    </>
                )}
              </Button>
               {isClient && currentUser && <CreateTicketDialog allUsers={allUsers} onTicketCreated={handleTicketCreated} currentUser={currentUser} />}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
             <h1 className="text-lg font-semibold md:text-2xl md:hidden">Dashboard</h1>
          </div>
          {isClient && <TicketBoard tickets={filteredTickets} setTickets={setTickets} onTicketUpdated={handleTicketUpdated} onTicketDeleted={handleTicketDeleted} />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
