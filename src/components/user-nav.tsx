
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
import { LogOut, User as UserIcon } from "lucide-react";


export function UserNav({ session }: { session: any }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                className="flex items-center gap-3 px-2 py-1.5 h-auto rounded-md hover:bg-accent hover:text-accent-foreground"
                size="sm"
            >
                <Avatar className="h-7 w-7">
                    <AvatarImage src={session?.user?.image} alt={session?.user?.name || 'User'} />
                    <AvatarFallback className="text-xs font-medium">
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                    <span className="font-medium text-sm truncate">
                        {session?.user?.name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                        {session?.user?.email || 'user@example.com'}
                    </span>
                </div>
                <UserIcon className="h-4 w-4 opacity-50" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="px-1.5 py-1.5">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                        {session?.user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate max-w-[200px]">
                        {session?.user?.email}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
