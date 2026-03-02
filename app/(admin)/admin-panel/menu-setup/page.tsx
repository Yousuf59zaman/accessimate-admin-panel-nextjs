"use client";

import React, { useState, useCallback, useEffect } from "react";
import { fetchAdmin } from "@/app/lib/fetchAdmin";
import NestedLayer from "@/app/components/admin-panel/menu-setup/NestedLayer";
import type { MenuNode } from "@/app/components/admin-panel/menu-setup/NestedLayer";
import AddNewMenu from "@/app/components/admin-panel/menu-setup/AddNewMenu";
import FloatingActionBtn from "@/app/components/admin-panel/menu-setup/FloatingActionBtn";
import ResponseModal from "@/app/components/ui/ResponseModal";

export default function MenuSetupPage() {
  const [menuData, setMenuData] = useState<MenuNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [responseModal, setResponseModal] = useState<Record<string, unknown>>(
    {},
  );

  // Load menu tree data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchAdmin<{ data: { data: MenuNode[] } }>(
        "admin/tree-entity/build-menu",
        {
          method: "GET",
        },
      );
      const items = result?.data?.data;
      setMenuData(Array.isArray(items) ? items : []);
    } catch (e: unknown) {
      const error = e as Error;
      console.log("Get Message", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save full reordered menu tree
  const saveMenu = useCallback(async () => {
    setIsSaving(true);
    setResponseModal({});
    try {
      const result = await fetchAdmin<{ status: boolean; message?: string }>(
        "admin/tree-entity/update-menu",
        {
          method: "POST",
          body: menuData as unknown as Record<string, unknown>[],
        },
      );
      if (result?.status === true) {
        setResponseModal(result as unknown as Record<string, unknown>);
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
      setIsSaving(false);
    }
  }, [menuData]);

  // Handle new menu item created
  const handleNewMenuCreated = useCallback(
    (newItem: MenuNode) => {
      setMenuData([...menuData, newItem]);
    },
    [menuData],
  );

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-3">
      <div className="container m-auto grid grid-cols-1">
        {isLoading ? (
          /* Skeleton loader */
          <div className="flex justify-center">
            <div className="w-full bg-white dark:bg-gray-800 rounded-md shadow p-5">
              <div className="w-full flex flex-wrap justify-end gap-4 mb-4">
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="ml-2 mb-1">
                  <div className="flex items-center gap-2 h-[30px] my-1 pr-3 rounded-full border border-gray-200 dark:border-gray-700">
                    <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-1" />
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                  {i % 3 === 0 && (
                    <div className="ml-6">
                      {Array.from({ length: 2 }).map((_, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 h-[30px] my-1 pr-3 rounded-full border border-gray-200 dark:border-gray-700 ml-2"
                        >
                          <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-1" />
                          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="w-full flex justify-end mt-3">
                <div className="w-[50px] h-[50px] bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          /* Loaded content */
          <div className="flex justify-center">
            <div className="w-full bg-white dark:bg-gray-800 rounded-md shadow p-5">
              <div className="w-full flex flex-wrap justify-end gap-4 mb-4">
                <button
                  onClick={() => setIsOpenModal(true)}
                  className="px-4 py-2 bg-sky-500 text-white text-sm rounded-md hover:bg-sky-600 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <i className="fa fa-plus" />
                  Add New
                </button>
              </div>

              <NestedLayer
                menus={menuData}
                setMenus={setMenuData}
                onReloadData={loadData}
              />

              <FloatingActionBtn
                icon="fa fa-check"
                loader={isSaving}
                onClick={saveMenu}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add New Menu Modal */}
      <AddNewMenu
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        onCreated={handleNewMenuCreated}
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
    </div>
  );
}
