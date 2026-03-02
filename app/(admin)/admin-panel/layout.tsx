"use client";

import React from "react";
import { useSidebar } from "@/app/contexts/SidebarContext";
import AdminSidebar from "@/app/components/layout/AdminSidebar";
import AdminHeader from "@/app/components/layout/AdminHeader";
import withAuth from "@/app/hoc/withAuth";

const AdminPanelLayout = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen">
      <AdminSidebar />
      <div
        className={`relative transition-all duration-500 ease-in-out min-h-screen ${
          isOpen ? "ml-0 md:ml-[250px]" : "ml-0 md:ml-[70px]"
        }`}
      >
        <AdminHeader />
        <main>{children}</main>
      </div>
    </div>
  );
};

export default withAuth(AdminPanelLayout, ["Admin"]);
