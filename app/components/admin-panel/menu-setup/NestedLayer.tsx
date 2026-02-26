"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import ConfirmModal from "@/app/components/ui/ConfirmModal";
import ResponseModal from "@/app/components/ui/ResponseModal";
import IconPicker from "@/app/components/ui/IconPicker";

export interface MenuNode {
  id: number;
  node_name: string;
  route_name: string | null;
  route_location: string | null;
  pid: number;
  icon: string;
  status: number;
  serials: number;
  menus: MenuNode[];
  showChild?: boolean;
}

interface NestedLayerProps {
  menus: MenuNode[];
  setMenus: (menus: MenuNode[]) => void;
  onReloadData: () => void;
}

// ─── Inline Edit Form ───
interface InlineEditFormProps {
  node: MenuNode;
  onUpdate: (data: MenuNode) => void;
  onReset: () => void;
  isLoading: boolean;
}

function InlineEditForm({
  node,
  onUpdate,
  onReset,
  isLoading,
}: InlineEditFormProps) {
  const [form, setForm] = useState({
    node_name: node.node_name || "",
    route_name: node.route_name || "",
    route_location: node.route_location || "",
    icon: node.icon || "fas fa-upload",
  });
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500";

  return (
    <div className="mr-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 mt-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="w-full">
          <label className="font-semibold text-sm text-gray-900 dark:text-white">
            Name
          </label>
          <input
            type="text"
            value={form.node_name}
            onChange={(e) => setForm({ ...form, node_name: e.target.value })}
            className={inputClass}
            placeholder="i.e Name"
          />
        </div>
        <div className="w-full">
          <label className="font-semibold text-sm text-gray-900 dark:text-white">
            Route
          </label>
          <input
            type="text"
            value={form.route_name}
            onChange={(e) => setForm({ ...form, route_name: e.target.value })}
            className={inputClass}
            placeholder="i.e Route"
          />
        </div>
        <div className="w-full">
          <label className="font-semibold text-sm text-gray-900 dark:text-white">
            Api Route Permission
          </label>
          <input
            type="text"
            value={form.route_location}
            onChange={(e) =>
              setForm({ ...form, route_location: e.target.value })
            }
            className={inputClass}
            placeholder="i.e Api Route Permission"
          />
        </div>
        <div className="w-full flex items-end gap-2">
          <div className="flex-1">
            <label className="font-semibold text-sm text-gray-900 dark:text-white">
              Icon
            </label>
            <input
              type="text"
              value={form.icon}
              className={`${inputClass} bg-gray-100 dark:bg-gray-700`}
              disabled
            />
          </div>
          <i
            className={`${form.icon} text-[25px] cursor-pointer text-orange-500 hover:text-orange-600 transition-colors mb-1`}
            onClick={() => setIsIconPickerOpen(true)}
          />
          <IconPicker
            isOpen={isIconPickerOpen}
            value={form.icon}
            onClose={() => setIsIconPickerOpen(false)}
            onChange={(icon) => setForm({ ...form, icon })}
          />
        </div>
        <div className="col-span-1 sm:col-span-2 w-full flex items-end justify-end gap-3">
          {isLoading ? (
            <button
              disabled
              className="px-4 py-1.5 bg-gray-400 text-white rounded-md cursor-not-allowed text-sm"
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onReset}
                className="px-3 py-1.5 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 hover:scale-105 text-sm flex items-center gap-1"
              >
                <i className="pi pi-refresh text-xs" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ ...node, ...form })}
                className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm flex items-center gap-1"
              >
                <i className="pi pi-check-circle text-xs" />
                Submit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Single Sortable Menu Item ───
interface SortableMenuItemProps {
  node: MenuNode;
  allMenus: MenuNode[];
  setAllMenus: (menus: MenuNode[]) => void;
  onReloadData: () => void;
}

function SortableMenuItem({
  node,
  allMenus,
  setAllMenus,
  onReloadData,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isOpenConModal, setIsOpenConModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<number>(0);
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>(
    {},
  );

  // Close all edit forms in the whole tree
  const closeAllEdits = useCallback((items: MenuNode[]) => {
    items.forEach((item) => {
      item.showChild = false;
      if (item.menus?.length > 0) closeAllEdits(item.menus);
    });
  }, []);

  const handleEdit = useCallback(() => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      // Close all others first
      closeAllEdits(allMenus);
      setAllMenus([...allMenus]);
      setIsEditing(true);
    }
  }, [isEditing, allMenus, setAllMenus, closeAllEdits]);

  const handleUpdate = useCallback(
    async (data: MenuNode) => {
      setIsUpdateLoading(true);
      setResponseModal({});
      try {
        const result = await fetchAdmin<{ status: boolean; message?: string }>(
          `admin/tree-entity/${data.id}`,
          { method: "PUT", body: data as unknown as Record<string, unknown> },
        );
        if (result?.status === true) {
          setResponseModal(result as unknown as Record<string, unknown>);
          setIsEditing(false);
          onReloadData();
        }
      } catch (e: unknown) {
        const error = e as {
          response?: Response;
          data?: { status?: boolean; message?: string };
        };
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 409
        ) {
          setResponseModal(error.data as Record<string, unknown>);
        }
      } finally {
        setIsUpdateLoading(false);
      }
    },
    [onReloadData],
  );

  const openDeleteModal = useCallback((status: number) => {
    setDeleteStatus(status);
    setIsOpenConModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
    setResponseModal({});
    try {
      const result = await fetchAdmin<{ status: boolean; message?: string }>(
        "admin/tree-entity/delete-menu",
        { method: "POST", body: { id: node.id, status: deleteStatus } },
      );
      if (result?.status === true) {
        setResponseModal(result as unknown as Record<string, unknown>);
        setTimeout(() => onReloadData(), 2000);
      }
    } catch (e: unknown) {
      const error = e as {
        response?: Response;
        data?: { status?: boolean; message?: string };
      };
      if (error?.response?.status === 404 || error?.response?.status === 409) {
        setResponseModal(error.data as Record<string, unknown>);
      }
    } finally {
      setIsOpenConModal(false);
    }
  }, [node.id, deleteStatus, onReloadData]);

  // Handle child reorder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleChildDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = node.menus.findIndex((m) => m.id === active.id);
        const newIndex = node.menus.findIndex((m) => m.id === over.id);
        const newMenus = arrayMove(node.menus, oldIndex, newIndex);
        // Update serials
        newMenus.forEach((m, i) => (m.serials = i + 1));
        node.menus = newMenus;
        setAllMenus([...allMenus]);
      }
    },
    [node, allMenus, setAllMenus],
  );

  const isActive = node.status === 1;

  return (
    <li ref={setNodeRef} style={style} className="menu-tree-item relative ml-2">
      <div
        className={`flex items-center gap-2 h-[30px] select-none my-1 pr-3 rounded-full border ${
          isActive
            ? "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-300"
        }`}
      >
        {/* Icon / drag handle */}
        <i
          className={`${node.icon} flex items-center justify-center w-7 h-7 text-[10px] rounded-full border border-gray-400 menu-tree-icon`}
        />
        <i
          className="fa fa-up-down-left-right flex items-center justify-center w-7 h-7 text-[10px] rounded-full border border-gray-400 cursor-move menu-tree-drag hidden"
          {...attributes}
          {...listeners}
        />

        {/* Name & route */}
        <span className="text-sm font-medium">{node.node_name}</span>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {node.route_name}
        </span>

        {/* Edit button */}
        {isActive && (
          <span
            className="flex items-center justify-center text-[10px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full h-[25px] w-[25px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            onClick={handleEdit}
          >
            <i className="fa fa-pencil text-green-700 dark:text-green-400" />
          </span>
        )}

        {/* Delete / Restore button */}
        <span
          className="flex items-center justify-center text-[10px] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full h-[25px] w-[25px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
          onClick={() => openDeleteModal(isActive ? 0 : 1)}
        >
          {isActive ? (
            <i className="fa fa-trash text-red-700 dark:text-red-400" />
          ) : (
            <i className="fa fa-undo text-green-700 dark:text-green-400" />
          )}
        </span>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className="ml-6 transition-all duration-300">
          <InlineEditForm
            node={node}
            onUpdate={handleUpdate}
            onReset={() => setIsEditing(false)}
            isLoading={isUpdateLoading}
          />
        </div>
      )}

      {/* Children */}
      {node.menus && node.menus.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChildDragEnd}
        >
          <SortableContext
            items={node.menus.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="menu-tree-children relative pl-6">
              {node.menus.map((child) => (
                <SortableMenuItem
                  key={child.id}
                  node={child}
                  allMenus={allMenus}
                  setAllMenus={setAllMenus}
                  onReloadData={onReloadData}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmModal
        isOpen={isOpenConModal}
        onConfirm={handleDelete}
        onClose={() => setIsOpenConModal(false)}
      />
      <ResponseModal
        data={
          responseModal as {
            status?: boolean;
            message?: string;
            error?: Record<string, string[]>;
          }
        }
        onClose={() => setResponseModal({})}
      />
    </li>
  );
}

// ─── Main NestedLayer Component ───
export default function NestedLayer({
  menus: rawMenus,
  setMenus,
  onReloadData,
}: NestedLayerProps) {
  const menus = React.useMemo(
    () => (Array.isArray(rawMenus) ? rawMenus : []),
    [rawMenus],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = menus.findIndex((m) => m.id === active.id);
        const newIndex = menus.findIndex((m) => m.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newMenus = arrayMove(menus, oldIndex, newIndex);
          newMenus.forEach((m, i) => (m.serials = i + 1));
          setMenus(newMenus);
        }
      }
    },
    [menus, setMenus],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={menus.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="menu-tree-root">
          {menus.map((item) => (
            <SortableMenuItem
              key={item.id}
              node={item}
              allMenus={menus}
              setAllMenus={setMenus}
              onReloadData={onReloadData}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
