"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import type { Message, Property, PropertyFilter, PropertyType, User } from "@/lib/mock";
import {
  filterProperties,
  getPropertyById,
  landlordProperties,
  messages as initialMessages,
  properties as initialProperties,
  users as initialUsers
} from "@/lib/mock";

type CreatePropertyInput = Omit<Property, "id" | "verified" | "availability"> & {
  availability?: Property["availability"];
  verified?: boolean;
};

type AppContextValue = {
  properties: Property[];
  users: User[];
  messages: Message[];
  favorites: string[];
  filteredProperties: (filters: PropertyFilter) => Property[];
  landlordListings: (landlordId: string) => Property[];
  getProperty: (id: string) => Property | undefined;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  createProperty: (input: CreatePropertyInput) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  setUserVerified: (id: string, verified: boolean) => void;
  sendMessage: (input: {
    propertyId: string;
    senderId: string;
    recipientId: string;
    body: string;
  }) => Message;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);
const FAVORITES_KEY = "rento:favorites";

function deriveNewId(prefix: string, idx: number): string {
  return `${prefix}${idx}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(() => initialProperties);
  const [users, setUsers] = useState<User[]>(() => initialUsers);
  const [messages, setMessages] = useState<Message[]>(() => initialMessages);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(FAVORITES_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handle = setTimeout(() => {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }, 100);
    return () => clearTimeout(handle);
  }, [favorites]);

  const filteredProperties = useCallback(
    (filters: PropertyFilter) => filterProperties(properties, filters),
    [properties]
  );

  const landlordListings = useCallback(
    (landlordId: string) => landlordProperties(landlordId, properties),
    [properties]
  );

  const getProperty = useCallback(
    (id: string) => getPropertyById(properties, id),
    [properties]
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const createProperty = useCallback(
    (input: CreatePropertyInput) => {
      const nextIndex = properties.length + 1;
      const newProperty: Property = {
        ...input,
        id: deriveNewId("p", nextIndex),
        availability: input.availability ?? "available",
        verified: input.verified ?? false
      };
      setProperties((prev) => [newProperty, ...prev]);
      return newProperty;
    },
    [properties]
  );

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((property) => (property.id === id ? { ...property, ...updates } : property))
    );
  }, []);

  const deleteProperty = useCallback((id: string) => {
    setProperties((prev) => prev.filter((property) => property.id !== id));
    setFavorites((prev) => prev.filter((favId) => favId !== id));
  }, []);

  const setUserVerified = useCallback((id: string, verified: boolean) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, verified } : user))
    );
  }, []);

  const sendMessage = useCallback(
    (input: {
      propertyId: string;
      senderId: string;
      recipientId: string;
      body: string;
    }) => {
      const message: Message = {
        id: deriveNewId("m", messages.length + 1),
        createdAt: new Date().toISOString(),
        ...input
      };
      setMessages((prev) => [...prev, message]);
      return message;
    },
    [messages.length]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      properties,
      users,
      messages,
      favorites,
      filteredProperties,
      landlordListings,
      getProperty,
      toggleFavorite,
      isFavorite,
      createProperty,
      updateProperty,
      deleteProperty,
      setUserVerified,
      sendMessage
    }),
    [
      properties,
      users,
      messages,
      favorites,
      filteredProperties,
      landlordListings,
      getProperty,
      toggleFavorite,
      isFavorite,
      createProperty,
      updateProperty,
      deleteProperty,
      setUserVerified,
      sendMessage
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return ctx;
}

export function propertyTypes(): PropertyType[] {
  return ["apartment", "house", "studio"];
}
