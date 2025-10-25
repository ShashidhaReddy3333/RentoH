import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RealtimePresenceState } from "@supabase/supabase-js"; // Keep this import as it's used for type

export type ThreadPresence = {
  isTyping: boolean;
  lastSeen?: string;
  userId: string;
};

const TYPING_TIMEOUT = 3000; // 3 seconds

export function setupThreadPresence(threadId: string, currentUserId: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client not available");
  
  const channel = supabase.channel(`thread:${threadId}`);
  let typingTimeout: NodeJS.Timeout;

  const join = async () => {
    await channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<ThreadPresence>();
        handlePresenceSync(state);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const typedPresences = (newPresences as unknown) as ThreadPresence[];
        handlePresenceJoin(typedPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const typedPresences = (leftPresences as unknown) as ThreadPresence[];
        handlePresenceLeave(typedPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: currentUserId,
            isTyping: false,
            lastSeen: new Date().toISOString(),
          });
        }
      });
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    clearTimeout(typingTimeout);
    await channel.track({ 
      userId: currentUserId,
      isTyping,
      lastSeen: new Date().toISOString()
    });

    if (isTyping) {
      typingTimeout = setTimeout(async () => {
        await channel.track({
          userId: currentUserId,
          isTyping: false,
          lastSeen: new Date().toISOString()
        });
      }, TYPING_TIMEOUT);
    }
  };

  const updateReadStatus = async () => {
    await channel.track({
      userId: currentUserId,
      isTyping: false,
      lastSeen: new Date().toISOString()
    });
  };

  const leave = () => {
    clearTimeout(typingTimeout);
    channel.unsubscribe();
  };

  return {
    join,
    updateTypingStatus,
    updateReadStatus,
    leave,
  };
}

function handlePresenceSync(state: RealtimePresenceState<ThreadPresence>) {
  // Emit presence sync event for UI updates
  window.dispatchEvent(new CustomEvent("thread:presence:sync", { detail: state }));
}

function handlePresenceJoin(newPresences: ThreadPresence[]) {
  // Emit join event for UI updates
  window.dispatchEvent(new CustomEvent("thread:presence:join", { detail: newPresences }));
}

function handlePresenceLeave(leftPresences: ThreadPresence[]) {
  // Emit leave event for UI updates
  window.dispatchEvent(new CustomEvent("thread:presence:leave", { detail: leftPresences }));
}