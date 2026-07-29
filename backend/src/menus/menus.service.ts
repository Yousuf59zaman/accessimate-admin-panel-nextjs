import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MenuItem, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-request';
import { PrismaService } from '../prisma/prisma.service';

export type MenuInput = {
  id?: number;
  pid?: number;
  node_name?: string;
  route_name?: string | null;
  route_location?: string | null;
  icon?: string;
  status?: number | boolean;
  serials?: number;
  menus?: MenuInput[];
};

export type MenuNode = {
  id: number;
  node_name: string;
  route_name: string | null;
  route_location: string | null;
  pid: number;
  icon: string;
  status: number;
  serials: number;
  menus: MenuNode[];
};

export type NavigationNode = {
  id: number;
  name: string;
  route: string;
  icon: string;
  child: NavigationNode[];
};

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async build(activeOnly: boolean) {
    const rows = await this.prisma.menuItem.findMany({
      where: activeOnly ? { status: 1 } : undefined,
      orderBy: [{ serial: 'asc' }, { nodeName: 'asc' }],
    });
    const nodes = new Map<number, MenuNode>();
    rows.forEach((row) => nodes.set(row.id, this.nodeDto(row)));
    const roots: MenuNode[] = [];
    rows.forEach((row) => {
      const node = nodes.get(row.id);
      if (!node) return;
      const parent = row.parentId ? nodes.get(row.parentId) : undefined;
      if (parent) parent.menus.push(node);
      else roots.push(node);
    });
    return roots;
  }

  async navigation(): Promise<NavigationNode[]> {
    const tree = await this.build(true);
    const navigationNode = (node: MenuNode): NavigationNode => ({
      id: node.id,
      name: node.node_name,
      route:
        [node.route_name, node.route_location].find((value) =>
          value?.startsWith('/'),
        ) ?? '#',
      icon: node.icon,
      child: node.menus.map(navigationNode),
    });
    return tree.map(navigationNode);
  }

  async create(input: MenuInput, user: AuthenticatedUser) {
    this.assertOwner(user);
    const name = input.node_name?.trim();
    if (!name) throw new BadRequestException('node_name is required.');
    if (input.pid) await this.find(input.pid);

    const row = await this.prisma.menuItem.create({
      data: {
        parentId: input.pid || null,
        nodeName: name,
        routeName: this.nullable(input.route_name),
        routeLocation: this.nullable(input.route_location),
        icon: input.icon?.trim() || 'fa-solid fa-circle',
        status: this.status(input.status),
        serial: Number(input.serials ?? 0),
      },
    });
    return {
      status: true,
      message: 'Menu item created successfully.',
      data: this.nodeDto(row),
    };
  }

  async update(id: number, input: MenuInput, user: AuthenticatedUser) {
    this.assertOwner(user);
    await this.find(id);
    if (input.pid === id) {
      throw new BadRequestException('A menu item cannot be its own parent.');
    }
    if (input.pid) await this.find(input.pid);

    const row = await this.prisma.menuItem.update({
      where: { id },
      data: {
        ...(input.pid === undefined ? {} : { parentId: input.pid || null }),
        ...(input.node_name === undefined
          ? {}
          : { nodeName: input.node_name.trim() }),
        ...(input.route_name === undefined
          ? {}
          : { routeName: this.nullable(input.route_name) }),
        ...(input.route_location === undefined
          ? {}
          : { routeLocation: this.nullable(input.route_location) }),
        ...(input.icon === undefined ? {} : { icon: input.icon.trim() }),
        ...(input.status === undefined ? {} : { status: this.status(input.status) }),
        ...(input.serials === undefined ? {} : { serial: Number(input.serials) }),
      },
    });
    return {
      status: true,
      message: 'Menu item updated successfully.',
      data: this.nodeDto(row),
    };
  }

  async reorder(input: MenuInput[], user: AuthenticatedUser) {
    this.assertOwner(user);
    if (!Array.isArray(input)) throw new BadRequestException('Menu tree is required.');
    const updates: Prisma.PrismaPromise<MenuItem>[] = [];
    const visit = (items: MenuInput[], parentId: number | null) => {
      items.forEach((item, index) => {
        if (!item.id) throw new BadRequestException('Every menu item needs an id.');
        updates.push(
          this.prisma.menuItem.update({
            where: { id: item.id },
            data: { parentId, serial: index },
          }),
        );
        if (item.menus?.length) visit(item.menus, item.id);
      });
    };
    visit(input, null);
    await this.prisma.$transaction(updates);
    return { status: true, message: 'Menu order saved successfully.' };
  }

  async setStatus(
    id: number,
    status: number | boolean,
    user: AuthenticatedUser,
  ) {
    this.assertOwner(user);
    await this.find(id);
    await this.prisma.menuItem.update({
      where: { id },
      data: { status: this.status(status) },
    });
    return { status: true, message: 'Menu status updated successfully.' };
  }

  private async find(id: number) {
    const row = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Menu item not found.');
    return row;
  }

  private nullable(value: string | null | undefined) {
    const result = value?.trim();
    return result ? result : null;
  }

  private status(value: number | boolean | undefined) {
    return value === true || Number(value) === 1 ? 1 : 0;
  }

  private nodeDto(row: MenuItem): MenuNode {
    return {
      id: row.id,
      node_name: row.nodeName,
      route_name: row.routeName,
      route_location: row.routeLocation,
      pid: row.parentId ?? 0,
      icon: row.icon,
      status: row.status,
      serials: row.serial,
      menus: [],
    };
  }

  private assertOwner(user: AuthenticatedUser) {
    if (user.type !== 'ADMIN' || user.isDemo) {
      throw new ForbiddenException('This account cannot modify menu settings.');
    }
  }
}
