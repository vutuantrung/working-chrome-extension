import { useSyncExternalStore } from "react";

export type AppLanguage = "en" | "vi";
const STORAGE_KEY = "hydra:ui-preferences";
const EVENT = "hydra:language-changed";

export function getLanguage(): AppLanguage {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return saved.language === "vi" ? "vi" : "en";
  } catch {
    return "en";
  }
}

export function setLanguage(language: AppLanguage) {
  try {
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...old, language }));
  } catch { /* Storage unavailable: still update the active UI */ }
  document.documentElement.lang = language;
  window.dispatchEvent(new Event(EVENT));
}

const dictionary = {
  en: {
    navDashboard:"Dashboard", navAutomation:"Automation", navGroup:"Groups", navEviden:"Evidence", navigation:"Main navigation",
    back:"Back", settings:"Settings", preferences:"PREFERENCES", settingsHint:"Customize your workspace and how the interface behaves.",
    platform:"Platform", platformHint:"Choose a social network and manage its connection.",
    appearance:"Appearance", appearanceHint:"Choose a comfortable layout for your workflow.",
    colorMode:"Color mode", colorModeHint:"Choose a light or dark appearance across the application.",
    light:"Light", dark:"Dark", density:"Interface density", densityHint:"Control spacing within the application.",
    comfortable:"Comfortable", compact:"Compact", behavior:"Behavior", behaviorHint:"Adjust interface animations.",
    reduceMotion:"Reduce motion", reduceMotionHint:"Minimize decorative animation and transitions.",
    saved:"Preferences saved automatically", saveFailed:"Unable to save preferences in this browser",
    restore:"Restore defaults", language:"Language", languageHint:"Choose the display language for the application.",
    english:"English", vietnamese:"Vietnamese",
    tasksTitle:"Task list", searchGroups:"Search group name, ID...", channel:"Channel", groupType:"Group type",
    clearFilters:"Clear filters", all:"All", joinedFilter:"Joined", notJoinedFilter:"Not joined", requestedFilter:"Requested",
    filterStatus:"Filter task status", groupsList:"Group list", tasks:"Tasks", refresh:"Refresh data",
    loadingGroups:"Loading...", failedGroups:"Unable to load groups", noGroups:"No groups found",
    retry:"Try again", retryHint:"Try another keyword or filter.", failedGroupsHint:"Unable to load groups from server.",
    previous:"Previous page", next:"Next page", active:"Active", inactive:"Inactive",
    joined:"Joined", not_joined:"Not joined", requested:"Requested", unknownName:"Unnamed",
    private_group:"Private group", group:"Public group", profile:"Profile", fanpage:"Fanpage",
    openLink:"Open link", copyId:"Copy ID", unknownId:"Unknown ID", updated:"Updated",
    justUpdated:"just now", inFuture:"in the future"
  },
  vi: {
    navDashboard:"Tổng quan", navAutomation:"Tự động hóa", navGroup:"Hội nhóm", navEviden:"Bằng chứng", navigation:"Điều hướng chính",
    back:"Quay lại", settings:"Cài đặt", preferences:"TÙY CHỌN", settingsHint:"Tùy chỉnh không gian làm việc và giao diện ứng dụng.",
    platform:"Nền tảng", platformHint:"Chọn mạng xã hội và quản lý kết nối.",
    appearance:"Giao diện", appearanceHint:"Chọn cách hiển thị phù hợp với bạn.",
    colorMode:"Chế độ màu", colorModeHint:"Chọn giao diện sáng hoặc tối cho ứng dụng.",
    light:"Sáng", dark:"Tối", density:"Mật độ giao diện", densityHint:"Điều chỉnh khoảng cách các thành phần.",
    comfortable:"Thoải mái", compact:"Gọn", behavior:"Hành vi", behaviorHint:"Điều chỉnh hiệu ứng giao diện.",
    reduceMotion:"Giảm chuyển động", reduceMotionHint:"Giảm các hiệu ứng và chuyển cảnh không cần thiết.",
    saved:"Đã tự động lưu tùy chọn", saveFailed:"Không thể lưu tùy chọn trong trình duyệt",
    restore:"Khôi phục mặc định", language:"Ngôn ngữ", languageHint:"Chọn ngôn ngữ hiển thị cho ứng dụng.",
    english:"Tiếng Anh", vietnamese:"Tiếng Việt",
    tasksTitle:"Danh sách nhiệm vụ", searchGroups:"Tìm kiếm tên nhóm, ID...", channel:"Kênh", groupType:"Loại nhóm",
    clearFilters:"Xóa các bộ lọc", all:"Tất cả", joinedFilter:"Đã thâm nhập", notJoinedFilter:"Chưa thâm nhập", requestedFilter:"Đã gửi yêu cầu",
    filterStatus:"Lọc trạng thái nhiệm vụ", groupsList:"Danh sách nhóm", tasks:"Nhiệm vụ", refresh:"Làm mới dữ liệu",
    loadingGroups:"Đang tải danh sách...", failedGroups:"Không thể tải danh sách", noGroups:"Không tìm thấy hội nhóm",
    retry:"Thử lại", retryHint:"Thử thay đổi từ khóa hoặc bộ lọc.", failedGroupsHint:"Không thể tải danh sách hội nhóm từ máy chủ.",
    previous:"Trang trước", next:"Trang sau", active:"Đang hoạt động", inactive:"Không hoạt động",
    joined:"Đã tham gia", not_joined:"Chưa tham gia", requested:"Đã gửi yêu cầu", unknownName:"Không có tên",
    private_group:"Nhóm riêng tư", group:"Nhóm công khai", profile:"Trang cá nhân", fanpage:"Fanpage",
    openLink:"Mở liên kết", copyId:"Sao chép ID", unknownId:"Không rõ ID", updated:"Cập nhật",
    justUpdated:"vừa cập nhật", inFuture:"trong tương lai"
  }
} as const;

export type TranslationKey = keyof typeof dictionary.en;
export function translate(language: AppLanguage, key: TranslationKey): string {
  return dictionary[language][key];
}
const subscribe = (callback: () => void) => {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
};
export function useTranslation() {
  const language = useSyncExternalStore(subscribe, getLanguage, () => "en" as AppLanguage);
  return { language, t: (key: TranslationKey) => translate(language, key) };
}
