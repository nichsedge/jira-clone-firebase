
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
  FolderKanban,
  PlusCircle,
  MoreHorizontal,
  Trash2,
  Pencil,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { User } from "@/lib/types";
import { allUsers as initialAllUsers } from "@/data/tickets";
import { AddUserDialog } from "@/components/add-user-dialog";
import { toast } from "@/hooks/use-toast";

const USERS_STORAGE_KEY = 'proflow-users';
const CURRENT_USER_STORAGE_KEY = 'proflow-current-user';

export default function UsersPage() {
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<User | undefined>(undefined);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : initialAllUsers;
    setAllUsers(users);

    const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    } else if (users.length > 0) {
        setCurrentUser(users[0]);
    }
  }, []);

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
  
  const handleUserAdded = (newUser: User) => {
    const newId = `USER-${Math.floor(1000 + Math.random() * 9000)}`;
    setAllUsers(prev => [...prev, { ...newUser, id: newId }]);
    toast({
        title: "User created",
        description: `User ${newUser.name} has been successfully created.`,
    });
  };

  const handleUserUpdated = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    toast({
        title: "User updated",
        description: `User ${updatedUser.name} has been successfully updated.`,
    });
  };

  const handleUserDeleted = () => {
    if (!userToDelete) return;

    if(userToDelete.id === currentUser?.id) {
        toast({
            variant: "destructive",
            title: "Cannot delete current user",
            description: "You cannot delete the user you are currently logged in as.",
        });
        setUserToDelete(undefined);
        return;
    }

    setAllUsers(prev => prev.filter(u => u.id !== userToDelete.id));
    toast({
        title: "User deleted",
        description: `User ${userToDelete.name} has been deleted.`,
    });
    setUserToDelete(undefined);
  }

  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setIsAddUserDialogOpen(true);
  }

  const openAddDialog = () => {
    setUserToEdit(undefined);
    setIsAddUserDialogOpen(true);
  }

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
              <SidebarMenuButton asChild isActive>
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
          <div className="w-full flex-1">
            <h1 className="font-semibold text-lg">User Management</h1>
          </div>
          <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="border rounded-lg w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isClient && allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar"/>
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => openEditDialog(user)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setUserToDelete(user)} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
        {isClient && (
          <AddUserDialog 
            isOpen={isAddUserDialogOpen}
            onOpenChange={setIsAddUserDialogOpen}
            userToEdit={userToEdit}
            onUserAdded={handleUserAdded}
            onUserUpdated={handleUserUpdated}
          />
        )}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(undefined)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user <span className="font-semibold">{userToDelete?.name}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUserDeleted}>
                    Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
