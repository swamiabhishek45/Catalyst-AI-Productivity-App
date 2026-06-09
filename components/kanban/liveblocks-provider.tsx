"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { LiveList } from "@liveblocks/client";

interface ProviderProps {
  children: ReactNode;
}

export function LiveblocksAppProvider({ children }: ProviderProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {children}
    </LiveblocksProvider>
  );
}

interface RoomProps {
  roomId: string;
  children: ReactNode;
}

export function KanbanRoomProvider({ roomId, children }: RoomProps) {
  // Seeds default columns (Todo, In Progress, Done) for new boards in room storage
  const defaultColumns = [
    { id: "col-1", name: "Todo", order: 1 },
    { id: "col-2", name: "In Progress", order: 2 },
    { id: "col-3", name: "Done", order: 3 },
  ];

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        isEditing: false,
      }}
      initialStorage={{
        columns: new LiveList(defaultColumns),
        tasks: new LiveList([]),
      }}
    >
      {children}
    </RoomProvider>
  );
}
