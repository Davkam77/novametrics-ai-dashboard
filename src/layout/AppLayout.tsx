import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import ModeChooserModal from "../components/common/ModeChooserModal";
import { useAppMode } from "../context/ModeContext";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { mode, setMode, setPendingMode } = useAppMode();
  const { status } = useAuth();

  useEffect(() => {
    if (mode !== "real") {
      return;
    }

    if (status === "loading" || status === "authenticated") {
      return;
    }

    setMode("demo");
    setPendingMode("real");
  }, [mode, setMode, setPendingMode, status]);

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </div>
        <ModeChooserModal />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
