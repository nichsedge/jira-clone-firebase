

"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  GripVertical,
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

import { useToast } from "@/hooks/use-toast";

import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { Ticket, TicketStatus, User, EmailSettings } from "@/lib/types";

import { syncEmailsAction } from "@/app/actions";
import { EmailSettingsForm } from "./email-settings-form";
import { getEmailSettings } from "@/lib/email-settings";




interface SortableStatusItemProps {
    id: string;
    onDelete: (id: string) => void;
}

function SortableStatusItem({ id, onDelete }: SortableStatusItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-2 bg-background p-2 rounded-md border">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab h-7 w-7">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
                <span className="font-medium text-sm">{id}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(id)}>
                <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
        </div>
    );
}

export function SettingsForm() {
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  useEffect(() => {
    setIsClient(true);
    const loadData = async () => {
      try {
        // Load statuses from API
        const statusesRes = await fetch('/api/statuses');
        if (statusesRes.ok) {
          const statusesData = await statusesRes.json();
          setStatuses(statusesData.map(s => s.id));
        }

        // Load users from API
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const users = await usersRes.json();
          setAllUsers(users);
          if (users.length > 0) {
            setCurrentUser(users[0]);
          }
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
      }
    };

    loadData();
  }, []);

  

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
    setStatuses(statuses.filter(status => status !== statusToDelete));
     toast({
        title: "Status removed!",
        description: `"${statusToDelete}" has been removed from your workflow.`,
      });
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (active.id !== over?.id) {
      setStatuses((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSyncEmails = async () => {
      console.log('handleSyncEmails: Starting sync process');
      
      // Use saved settings from DB instead of client-side call to avoid hydration issues
      const [result, setResult] = useState<any>(null);
      
      startSyncTransition(async () => {
          try {
              console.log('handleSyncEmails: Calling syncEmailsAction with', allUsers.length, 'users');
              const syncResult = await syncEmailsAction(allUsers, { imap: { host: '', port: 0, user: '', pass: '', tls: false }, smtp: { host: '', port: 0, user: '', pass: '', tls: false } });
              console.log('handleSyncEmails: Sync result:', syncResult);
              
              if (syncResult.error) {
                  console.error('handleSyncEmails: Sync failed:', syncResult.error);
                  toast({
                      variant: "destructive",
                      title: "Sync Failed",
                      description: syncResult.error,
                  });
                  // Also log to console for easy copying
                  console.error('EMAIL SYNC ERROR - COPY THIS:\n', syncResult.error);
              } else {
                  const ticketCount = syncResult.count || 0;
                  const userCount = syncResult.newUsers?.length || 0;
  
                  let description = `${ticketCount} new ticket(s) created.`;
                  if (userCount > 0) {
                      description += ` ${userCount} new user(s) created.`;
                  }
  
                  toast({
                      title: "Sync Complete!",
                      description: description,
                  });
                  
                  console.log('EMAIL SYNC SUCCESS - COPY THIS:\nProcessed:', ticketCount, 'tickets,', userCount, 'new users');
                  
                  if (syncResult.tickets && syncResult.tickets.length > 0) {
                      const storedTicketsRaw = localStorage.getItem('tickets');
                      const storedTickets = storedTicketsRaw ? JSON.parse(storedTicketsRaw) : [];
                      const updatedTickets = [...syncResult.tickets, ...storedTickets];
                      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
                  }
                  if (syncResult.newUsers && syncResult.newUsers.length > 0) {
                      const updatedUsers = [...allUsers, ...syncResult.newUsers];
                      setAllUsers(updatedUsers);
                      localStorage.setItem('users', JSON.stringify(updatedUsers));
                  }
              }
          } catch (error) {
              console.error('handleSyncEmails: Unexpected error:', error);
              toast({
                  variant: "destructive",
                  title: "Sync Error",
                  description: "An unexpected error occurred during sync. Check console for details.",
              });
              console.error('EMAIL SYNC UNEXPECTED ERROR - COPY THIS:\n', error);
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
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            <EmailSettingsForm onSync={handleSyncEmails} isSyncing={isSyncing} />
            <div className="grid grid-cols-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Workflow /> Workflow Statuses</CardTitle>
                        <CardDescription>
                        Customize and reorder the columns on your ticket board.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                             {isClient && (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={statuses} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2">
                                            {statuses.map(status => (
                                                <SortableStatusItem key={status} id={status} onDelete={handleDeleteStatus} />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
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
