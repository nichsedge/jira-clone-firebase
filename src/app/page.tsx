
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
import { ticketsApi, usersApi, type Ticket as ApiTicket, type User as ApiUser } from "@/services/api";
import { useTicketsRealtime } from "@/hooks/useRealtime";

const TICKETS_STORAGE_KEY = 'proflow-tickets';
const CURRENT_USER_STORAGE_KEY = 'proflow-current-user';
const USERS_STORAGE_KEY = 'proflow-users';

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [isSyncing, startSyncTransition] = useTransition();
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const { toast } = useToast();

  // Real-time updates
  const { isConnected: isRealtimeConnected } = useTicketsRealtime();


  useEffect(() => {
    setIsClient(true);

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load tickets from API
        const ticketsResponse = await ticketsApi.getAll();
        if (ticketsResponse.success && ticketsResponse.data) {
          setTickets(ticketsResponse.data.map((t: ApiTicket) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          })));
        } else {
          // Fallback to initial data if API fails
          setTickets(initialTickets);
        }

        // Load users from API
        const usersResponse = await usersApi.getAll();
        if (usersResponse.success && usersResponse.data) {
          setAllUsers(usersResponse.data);
          // Set current user to first user or fallback to localStorage
          const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const userExists = usersResponse.data.find(u => u.id === parsedUser.id);
            if (userExists) {
              setCurrentUser(userExists);
            } else if (usersResponse.data.length > 0) {
              setCurrentUser(usersResponse.data[0]);
            }
          } else if (usersResponse.data.length > 0) {
            setCurrentUser(usersResponse.data[0]);
          }
        } else {
          // Fallback to initial users
          setAllUsers(initialAllUsers);
          const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
          if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
          } else {
            setCurrentUser(initialAllUsers[0]);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage/initial data
        setTickets(initialTickets);
        setAllUsers(initialAllUsers);
        setCurrentUser(initialAllUsers[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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


  const handleTicketCreated = async (newTicket: Ticket) => {
    try {
      // Optimistically update UI
      setTickets((prevTickets) => [newTicket, ...prevTickets]);

      // Create ticket via API
      const response = await ticketsApi.create({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        assignee: newTicket.assignee,
        projectId: newTicket.projectId,
        reporter: newTicket.reporter,
        category: newTicket.category,
        status: newTicket.status,
      });

      if (response.success && response.data) {
        // Update with server response
        setTickets((prevTickets) =>
          prevTickets.map(ticket =>
            ticket.id === newTicket.id ? response.data! : ticket
          )
        );
      } else {
        // Revert optimistic update on error
        setTickets((prevTickets) =>
          prevTickets.filter(ticket => ticket.id !== newTicket.id)
        );
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to create ticket",
        });
      }
    } catch (error) {
      // Revert optimistic update
      setTickets((prevTickets) =>
        prevTickets.filter(ticket => ticket.id !== newTicket.id)
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create ticket",
      });
    }
  };

  const handleTicketUpdated = async (updatedTicket: Ticket) => {
    try {
      // Optimistically update UI
      setTickets((prevTickets) =>
        prevTickets.map(ticket =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        )
      );

      // Update ticket via API
      const response = await ticketsApi.update(updatedTicket.id, {
        title: updatedTicket.title,
        description: updatedTicket.description,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assignee: updatedTicket.assignee,
        category: updatedTicket.category,
        projectId: updatedTicket.projectId,
      });

      if (!response.success) {
        // Revert optimistic update on error
        // Note: In a real app, you'd want to refetch the original ticket
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to update ticket",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket",
      });
    }
  };

  const handleTicketDeleted = async (deletedTicketId: string) => {
    try {
      // Optimistically update UI
      const deletedTicket = tickets.find(t => t.id === deletedTicketId);
      setTickets((prevTickets) =>
        prevTickets.filter(ticket => ticket.id !== deletedTicketId)
      );

      // Delete ticket via API
      const response = await ticketsApi.delete(deletedTicketId);

      if (!response.success) {
        // Revert optimistic update on error
        if (deletedTicket) {
          setTickets((prevTickets) => [deletedTicket, ...prevTickets]);
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to delete ticket",
        });
      }
    } catch (error) {
      // Revert optimistic update
      const deletedTicket = tickets.find(t => t.id === deletedTicketId);
      if (deletedTicket) {
        setTickets((prevTickets) => [deletedTicket, ...prevTickets]);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete ticket",
      });
    }
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

               {/* Real-time connection indicator */}
               {isClient && (
                 <div className="flex items-center gap-2 text-sm">
                   <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                   <span className="text-muted-foreground">
                     {isRealtimeConnected ? 'Live' : 'Offline'}
                   </span>
                 </div>
               )}

                {isClient && currentUser && <CreateTicketDialog allUsers={allUsers} onTicketCreated={handleTicketCreated} currentUser={currentUser} />}
           </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center">
             <h1 className="text-lg font-semibold md:text-2xl md:hidden">Dashboard</h1>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            </div>
          ) : (
            isClient && <TicketBoard tickets={filteredTickets} setTickets={setTickets} onTicketUpdated={handleTicketUpdated} onTicketDeleted={handleTicketDeleted} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
