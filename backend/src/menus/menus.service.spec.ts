import type { PrismaService } from '../prisma/prisma.service';
import { MenusService } from './menus.service';

describe('MenusService', () => {
  const prisma = {
    menuItem: { findMany: jest.fn() },
  };
  const service = new MenusService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('keeps the menu editor tree contract while producing the sidebar contract', async () => {
    prisma.menuItem.findMany.mockResolvedValue([
      {
        id: 1,
        parentId: null,
        nodeName: 'Content',
        routeName: null,
        routeLocation: null,
        icon: 'fa-solid fa-folder',
        status: 1,
        serial: 0,
      },
      {
        id: 2,
        parentId: 1,
        nodeName: 'News',
        routeName: '/admin-panel/news',
        routeLocation: 'news',
        icon: 'fa-solid fa-newspaper',
        status: 1,
        serial: 0,
      },
    ]);

    await expect(service.navigation()).resolves.toEqual([
      {
        id: 1,
        name: 'Content',
        route: '#',
        icon: 'fa-solid fa-folder',
        child: [
          {
            id: 2,
            name: 'News',
            route: '/admin-panel/news',
            icon: 'fa-solid fa-newspaper',
            child: [],
          },
        ],
      },
    ]);
  });
});
