
"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User } from "@/lib/types";
import { LogOut, User as UserIcon } from "lucide-react";

interface UserNavProps {
    users: User[];
    currentUser: User;
    onUserChange: (user: User) => void;
}

export function UserNav({ users, currentUser, onUserChange }: UserNavProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 p-2 cursor-pointer">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                    <span className="font-semibold">{currentUser.name}</span>
                    <span className="text-muted-foreground">{`ID: ${currentUser.id}`}</span>
                </div>
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name || currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                {session?.user?.email || currentUser.email}
                </p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Switch User</p>
                <p className="text-xs leading-none text-muted-foreground">
                Select a user to act as.
                </p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {users.map(user => (
                     <DropdownMenuItem key={user.id} onSelect={() => onUserChange(user)} disabled={currentUser.id === user.id}>
                         {user.name}
                     </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
