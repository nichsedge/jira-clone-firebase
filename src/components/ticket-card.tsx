import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-medium">{ticket.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex space-x-2 text-sm text-muted-foreground mb-4">
          <div className="font-medium">{ticket.id}</div>
          <div>•</div>
          <div>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={`https://placehold.co/32x32.png`}
                data-ai-hint="person avatar"
                alt="User avatar"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            {ticket.category && (
              <Badge variant="secondary">{ticket.category}</Badge>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              ticket.priority === "High" && "border-destructive/80 text-destructive",
              ticket.priority === "Medium" && "border-chart-4/80 text-chart-4",
              ticket.priority === "Low" && "border-chart-2/80 text-chart-2"
            )}
          >
            {ticket.priority}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
