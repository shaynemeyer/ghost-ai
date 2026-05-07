declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // useLiveblocksFlow writes the React Flow graph under "__liveblocksFlow" at runtime.
    // It manages that key internally; never read it via useStorage directly.
    Storage: {};

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        cursorColor: string;
      };
    };

    RoomEvent: {
      type: "AI_STATUS";
      message: string;
    };
    ThreadMetadata: {};
    RoomInfo: {};
  }
}

export {};
