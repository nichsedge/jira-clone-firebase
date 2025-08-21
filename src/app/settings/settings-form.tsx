
"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
  Mail,
  ChevronLeft,
  FolderKanban,
  Trash2,
  Plus,
  Workflow,
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

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { syncEmailsAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { Ticket, TicketStatus, User } from "@/lib/types";
import { initialStatuses } from "@/data/statuses";
import { allUsers as initialAllUsers } from "@/data/tickets";

const TICKETS_STORAGE_KEY = 'proflow-tickets';
const STATUSES_STORAGE_KEY = 'proflow-statuses';
const CURRENT_USER_STORAGE_KEY = 'proflow-current-user';
const USERS_STORAGE_KEY = 'proflow-users';

interface SettingsFormProps {
    imapUser: string;
}

export function SettingsForm({ imapUser }: SettingsFormProps) {
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
    const storedStatuses = localStorage.getItem(STATUSES_STORAGE_KEY);
    if (storedStatuses) {
      setStatuses(JSON.parse(storedStatuses));
    } else {
      setStatuses(initialStatuses);
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

  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STATUSES_STORAGE_KEY, JSON.stringify(statuses));
    }
  }, [statuses, isClient]);

  useEffect(() => {
    if (isClient && currentUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser, isClient]);

  const handleAddStatus = () => {
    if (newStatus.trim() && !statuses.includes(newStatus.trim())) {
      setStatuses([...statuses, newStatus.trim()]);
      setNewStatus("");
      toast({
        title: "Status added!",
        description: `"${newStatus.trim()}" has been added to your workflow.`,
      });
    }
  };

  const handleDeleteStatus = (statusToDelete: TicketStatus) => {
    if (statuses.length <= 1) {
        toast({
            variant: "destructive",
            title: "Cannot delete status",
            description: "You must have at least one status in your workflow.",
        });
        return;
    }
    // You might want to add logic here to handle tickets with the deleted status
    setStatuses(statuses.filter(status => status !== statusToDelete));
     toast({
        title: "Status removed!",
        description: `"${statusToDelete}" has been removed from your workflow.`,
      });
  };

  const handleSyncEmails = async () => {
    startSyncTransition(async () => {
      const result = await syncEmailsAction(allUsers);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: result.error,
        });
      } else {
        toast({
          title: "Sync Complete!",
          description: `${result.count} new ticket(s) created from emails.`,
        });
        if (result.count > 0 && result.tickets) {
            const storedTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
            const currentTickets = storedTickets ? JSON.parse(storedTickets) : [];
            const newTickets = [...result.tickets, ...currentTickets];
            localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(newTickets));
            router.push('/');
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
                  <SidebarMenuButton asChild isActive>
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
             <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <span className="font-semibold text-lg">Settings</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Email Integration</CardTitle>
                        <CardDescription>
                        Connect your support inbox to automatically create tickets from emails.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium">{imapUser}</p>
                            <p className="text-sm text-muted-foreground">Connected via IMAP</p>
                        </div>
                        <Button onClick={handleSyncEmails} disabled={isSyncing}>
                            <Mail className="mr-2 h-4 w-4" />
                            {isSyncing ? "Syncing..." : "Sync Emails"}
                        </Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Workflow /> Workflow Statuses</CardTitle>
                        <CardDescription>
                        Customize the columns on your ticket board.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {isClient && statuses.map(status => (
                                <div key={status} className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-sm">{status}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteStatus(status)}>
                                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <div className="flex w-full items-center gap-2">
                            <Input 
                                placeholder="Add new status" 
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                            />
                            <Button onClick={handleAddStatus}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
