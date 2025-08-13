
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
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserNav() {
  return (
    <Avatar className="h-8 w-8">
        <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="user avatar" />
        <AvatarFallback>U</AvatarFallback>
    </Avatar>
  )
}
