"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { User, Project } from "@/lib/types";
import { AddProjectDialog } from "@/components/add-project-dialog";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(undefined);
  const [projectToDelete, setProjectToDelete] = useState<Project | undefined>(undefined);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        // No currentUser state needed for production

        const projectsRes = await fetch('/api/projects');

        if (projectsRes.ok) {
          const prjs = await projectsRes.json();
          setProjects(prjs);
        } else {
          toast({
            variant: "destructive",
            title: "Error loading projects",
            description: "Failed to load projects.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Failed to load data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [status, session?.user?.id, router]); // Add router to dependencies

  const refetchProjects = async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const prjs = await res.json();
      setProjects(prjs);
    }
  };

  const handleProjectAdded = async (newProject: Omit<Project, 'id'>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        toast({
          title: "Project created",
          description: `Project ${newProject.name} has been successfully created.`,
        });
        await refetchProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error creating project",
          description: "Failed to create project.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: "Failed to create project.",
      });
    }
  };

  const handleProjectUpdated = async (updatedProject: Project) => {
    try {
      const res = await fetch(`/api/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });
      if (res.ok) {
        toast({
          title: "Project updated",
          description: `Project ${updatedProject.name} has been successfully updated.`,
        });
        await refetchProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error updating project",
          description: "Failed to update project.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating project",
        description: "Failed to update project.",
      });
    }
  };

  const handleProjectDeleted = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({
          title: "Project deleted",
          description: `Project ${projectToDelete.name} has been deleted.`,
        });
        await refetchProjects();
      } else {
        toast({
          variant: "destructive",
          title: "Error deleting project",
          description: "Failed to delete project.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting project",
        description: "Failed to delete project.",
      });
    }
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

  if (isLoading || status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null; // Will redirect via useEffect
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
            {projects.map(project => (
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
        <AddProjectDialog
            isOpen={isAddProjectDialogOpen}
            onOpenChange={setIsAddProjectDialogOpen}
            projectToEdit={projectToEdit}
            onProjectAdded={handleProjectAdded}
            onProjectUpdated={handleProjectUpdated}
        />
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
