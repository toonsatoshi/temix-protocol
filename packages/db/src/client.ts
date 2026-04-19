// Mock Prisma Client for Termux/Android environment where binary engines may fail
const mockEvents: any[] = [];

export const prisma: any = {
  user: {
    findUnique: async ({ where }: any) => {
      console.log(`[Mock DB] Finding user: ${where.telegramId}`);
      return { id: 'mock-user-id', telegramId: where.telegramId, projects: [] };
    },
    create: async ({ data }: any) => {
      console.log(`[Mock DB] Creating user: ${data.telegramId}`);
      return { id: 'mock-user-id', telegramId: data.telegramId, projects: [] };
    }
  },
  project: {
    findFirst: async ({ where }: any) => {
      console.log(`[Mock DB] Finding project for owner: ${where.ownerId}`);
      return { id: 'mock-project-id', name: 'Default Project', ownerId: where.ownerId };
    },
    create: async ({ data }: any) => {
      console.log(`[Mock DB] Creating project: ${data.name}`);
      return { id: 'mock-project-id', name: data.name, ownerId: data.ownerId };
    }
  },
  mutationEvent: {
    findFirst: async ({ where, orderBy }: any) => {
      if (orderBy.timestamp === 'desc') {
        return mockEvents.length > 0 ? mockEvents[mockEvents.length - 1] : null;
      }
      return mockEvents[0] || null;
    },
    findMany: async ({ where, orderBy }: any) => {
      return [...mockEvents];
    },
    create: async ({ data }: any) => {
      console.log(`[Mock DB] Appending event: ${data.hash}`);
      const newEvent = { ...data, timestamp: Number(data.timestamp) };
      mockEvents.push(newEvent);
      return newEvent;
    }
  }
};
