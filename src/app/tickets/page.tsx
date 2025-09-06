
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { type Ticket, type User, type Project } from "@/lib/types";

const priorityDisplayMap: Record<string, string> = {
  'LOW': 'Low',
  'MEDIUM': 'Medium',
  'HIGH': 'High',
};

const getPriorityDisplay = (priority: string) => priorityDisplayMap[priority] || priority;
import { cn } from "@/lib/utils";


export default function TicketsPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    setIsClient(true);
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load tickets (includes project data via API)
        const ticketsRes = await fetch('/api/tickets');
        if (ticketsRes.ok) {
          const fetchedTickets = await ticketsRes.json();
          console.log('DEBUG: Fetched tickets from API:', fetchedTickets);
          console.log('DEBUG: Tickets length:', fetchedTickets.length);
          console.log('DEBUG: First ticket status:', fetchedTickets[0]?.status);
          console.log('DEBUG: First ticket status type:', typeof fetchedTickets[0]?.status);
          console.log('DEBUG: First ticket status is object:', typeof fetchedTickets[0]?.status === 'object');
          setTickets(fetchedTickets);
        } else {
          console.error('DEBUG: Tickets API failed with status:', ticketsRes.status);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);



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
              <SidebarMenuButton asChild>
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
              <SidebarMenuButton asChild isActive>
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
                {session && <UserNav session={session} />}
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
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            <h1 className="font-semibold text-lg">All Tickets</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p>Loading tickets...</p>
            </div>
          ) : (
            <div className="border rounded-lg w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    console.log('DEBUG: Rendering tickets, total count:', tickets.length);
                    console.log('DEBUG: All tickets:', tickets);
                    tickets.forEach((ticket) => {
                      const statusValue = ticket.status as any;
                      console.log('DEBUG: Rendering ticket', ticket.id, 'status:', statusValue, 'type:', typeof statusValue);
                    });
                    return tickets.map((ticket) => {
                      const statusValue = ticket.status as any;
                      return (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeof statusValue === 'object' ? statusValue?.name || 'Unknown' : statusValue}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            getPriorityDisplay(ticket.priority) === "High" && "border-red-500/60 text-red-500 dark:border-red-400/50 dark:text-red-400",
                            getPriorityDisplay(ticket.priority) === "Medium" && "border-yellow-500/60 text-yellow-500 dark:border-yellow-400/50 dark:text-yellow-400",
                            getPriorityDisplay(ticket.priority) === "Low" && "border-green-500/60 text-green-500 dark:border-green-400/50 dark:text-green-400"
                          )}
                        >
                          {getPriorityDisplay(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.project?.name || 'No Project'}</TableCell>
                      <TableCell>
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={ticket.assignee.image}
                                alt={ticket.assignee.name}
                              />
                              <AvatarFallback>{ticket.assignee.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{ticket.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(ticket.updatedAt), "PP")}</TableCell>
                    </TableRow>
                    );
                  });
                  })()}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
