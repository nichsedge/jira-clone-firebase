
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
  ChevronLeft,
  FolderKanban,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { initialProjects, allUsers as initialAllUsers } from "@/data/tickets";
import { User, Project } from "@/lib/types";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { toast } from "@/hooks/use-toast";

const CURRENT_USER_STORAGE_KEY = 'proflow-current-user';
const USERS_STORAGE_KEY = 'proflow-users';
const PROJECTS_STORAGE_KEY = 'proflow-projects';

export default function ProjectsPage() {
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(undefined);
  const [projectToDelete, setProjectToDelete] = useState<Project | undefined>(undefined);


  useEffect(() => {
    setIsClient(true);
    
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : initialAllUsers;
    setAllUsers(users);

    const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if(storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else if (users.length > 0) {
      setCurrentUser(users[0]);
    }
    
    const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
    } else {
        setProjects(initialProjects);
    }
  }, []);

  useEffect(() => {
    if (isClient && currentUser) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser, isClient]);

  useEffect(() => {
    if (isClient) {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, isClient]);

  const handleProjectAdded = (newProject: Omit<Project, 'id'>) => {
    const newId = `PROJ-${Math.floor(1000 + Math.random() * 9000)}`;
    setProjects(prev => [...prev, { ...newProject, id: newId }]);
    toast({
        title: "Project created",
        description: `Project ${newProject.name} has been successfully created.`,
    });
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
     toast({
        title: "Project updated",
        description: `Project ${updatedProject.name} has been successfully updated.`,
    });
  };

  const handleProjectDeleted = () => {
    if (!projectToDelete) return;
    setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    toast({
        title: "Project deleted",
        description: `Project ${projectToDelete.name} has been deleted.`,
    });
    setProjectToDelete(undefined);
  };
  
  const openEditDialog = (project: Project) => {
    setProjectToEdit(project);
    setIsAddProjectDialogOpen(true);
  }

  const openAddDialog = () => {
    setProjectToEdit(undefined);
    setIsAddProjectDialogOpen(true);
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
              <SidebarMenuButton asChild isActive>
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
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="flex-1">
             <h1 className="font-semibold text-lg">Projects</h1>
          </div>
          <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isClient && projects.map(project => (
                <Card key={project.id}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription>{project.id}</CardDescription>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => openEditDialog(project)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setProjectToDelete(project)} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                    </CardContent>
                </Card>
            ))}
          </div>
        </main>
        {isClient && (
            <AddProjectDialog
                isOpen={isAddProjectDialogOpen}
                onOpenChange={setIsAddProjectDialogOpen}
                projectToEdit={projectToEdit}
                onProjectAdded={handleProjectAdded}
                onProjectUpdated={handleProjectUpdated}
            />
        )}
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(undefined)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project <span className="font-semibold">{projectToDelete?.name}</span>. Any associated tickets will not be deleted but will no longer be linked to this project.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleProjectDeleted}>
                    Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
