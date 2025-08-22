
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
import { Ticket, TicketStatus, User } from "@/lib/types";
import { initialStatuses } from "@/data/statuses";
import { allUsers as initialAllUsers } from "@/data/tickets";
import { syncEmailsAction } from "@/app/actions";
import { EmailSettingsForm } from "./email-settings-form";
import { getEmailSettings } from "@/lib/email-settings";

const STATUSES_STORAGE_KEY = 'proflow-statuses';
const CURRENT_USER_STORAGE_KEY = 'proflow-current-user';
const USERS_STORAGE_KEY = 'proflow-users';
const TICKETS_STORAGE_KEY = 'proflow-tickets';


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
    const storedStatuses = localStorage.getItem(STATUSES_STORAGE_KEY);
    if (storedStatuses) {
      try {
        const parsedStatuses = JSON.parse(storedStatuses);
        if (Array.isArray(parsedStatuses)) {
            setStatuses(parsedStatuses);
        } else {
            setStatuses(initialStatuses);
        }
      } catch {
        setStatuses(initialStatuses);
      }
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
    const emailSettings = getEmailSettings();
    if (!emailSettings) {
        toast({
            variant: "destructive",
            title: "Email Sync Not Configured",
            description: "Please configure and save your email credentials to sync emails.",
        });
        return;
    }

    startSyncTransition(async () => {
        const result = await syncEmailsAction(allUsers, emailSettings);
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
            
            if (result.tickets && result.tickets.length > 0) {
                const storedTicketsRaw = localStorage.getItem(TICKETS_STORAGE_KEY);
                const storedTickets = storedTicketsRaw ? JSON.parse(storedTicketsRaw) : [];
                const updatedTickets = [...result.tickets, ...storedTickets];
                localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updatedTickets));
            }
            if (result.newUsers && result.newUsers.length > 0) {
                const updatedUsers = [...allUsers, ...result.newUsers];
                setAllUsers(updatedUsers);
                 localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
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
