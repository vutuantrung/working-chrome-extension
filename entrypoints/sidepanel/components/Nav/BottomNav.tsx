import type { StorageChangeMap } from "../../types/BrowserPorts";
import { useEffect, useState } from "react";
import { extensionStorage } from "../../application/services/SidepanelServices";
import { FaRobot, FaChartLine } from "../../assets/constants/icons";
import { MdOutlineCollections } from "../../assets/constants/icons";
import { HiOutlineUserGroup } from "../../assets/constants/icons";
import type { MainTab } from "../../helpers/constants";

const NAV_ITEMS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <FaChartLine /> },
  { id: "automation", label: "Automation", icon: <FaRobot /> },
  { id: "group", label: "Group", icon: <HiOutlineUserGroup /> },
  { id: "eviden", label: "Eviden", icon: <MdOutlineCollections /> },
];

interface BottomNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const [hasApikey, setHasApikey] = useState(false);

  useEffect(() => {
    const checkApikey = async () => {
      try {
        const stored = await extensionStorage.get("apikey");
        setHasApikey(!!stored.apikey);
      } catch {
        setHasApikey(false);
      }
    };
    checkApikey();

    const handleStorageChange = (
      changes: StorageChangeMap,
      area: string
    ) => {
      if (area === "local" && changes.apikey) {
        setHasApikey(!!changes.apikey.newValue);
      }
    };
    const unsubscribeStorage = extensionStorage.subscribe(handleStorageChange);
    return unsubscribeStorage;
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) => item.id !== "group" || hasApikey);

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {visibleItems.map((item) => (
        <button
          key={item.id}
          id={`bottom-nav-${item.id}`}
          className={`bottom-nav__item ${activeTab === item.id ? "bottom-nav__item--active" : ""}`}
          onClick={() => onTabChange(item.id)}
          aria-label={item.label}
          aria-current={activeTab === item.id ? "page" : undefined}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;