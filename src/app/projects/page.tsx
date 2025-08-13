
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { initialProjects, allUsers as initialAllUsers } from "@/data/tickets";
import { User } from "@/lib/types";

const CURRENT_USER_STORAGE_KEY = 'proflow-current-user';

export default function ProjectsPage() {
  const [isClient, setIsClient] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>(initialAllUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialAllUsers[0]);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if(storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser, isClient]);

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
                <Link href="#">
                  <Users />
                  Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-2 p-2">
                {isClient && <UserNav users={allUsers} currentUser={currentUser} onUserChange={setCurrentUser} />}
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
             <div
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Button variant="outline" size="icon" className="h-8 w-8 as-child">
                <Link href="/">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <span className="font-semibold text-lg">Projects</span>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initialProjects.map(project => (
                <Card key={project.id}>
                    <CardHeader>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* We can add more project details here later */}
                    </CardContent>
                </Card>
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
