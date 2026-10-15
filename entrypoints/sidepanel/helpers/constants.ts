import { AutomationSubTab, PlatformId, Tab } from "../types/types";

export const SELECTED_PLATFORM_KEY = "selectedPlatform";

export const TASK_STATES = {
    PENDING: "pending",
    RUNNING: "running",
    FINISHED: "finished",
    CANCELED: "canceled",
};

export const PRIORITY_LABELS: { [key: number]: string } = {
    3: "Urgent",
    2: "High",
    1: "Medium",
    0: "Low",
};

export const STATUS_KEY = {
    ALL: "all",
    DA_RA_SOAT: "da-ra-soat",
    DA_PHAN_CONG: "da-phan-cong",
}

export const STATUS_FILTERS: { id: string; label: string }[] = [
    { id: "all", label: "Tất cả" },
    { id: "da-ra-soat", label: "Đã rà soát" },
    { id: "da-phan-cong", label: "Đã phân công" },
];

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    "all": { label: "Tất cả", className: "" },
    "da-ra-soat": { label: "Đã rà soát", className: "group-status--reviewed" },
    "da-phan-cong": { label: "Đã phân công", className: "group-status--assigned" },
};

export const AUTOMATION_TABS: Tab<AutomationSubTab>[] = [
    { id: "config", label: "Config" },
    { id: "monitor", label: "Monitor" },
];

export const PLATFORM_OPTIONS = [
    { id: "facebook", label: "Facebook" },
    { id: "youtube", label: "Youtube" },
    { id: "tiktok", label: "Tiktok" },
    { id: "threads", label: "Threads" },
    { id: "telegram", label: "Telegram" },
    { id: "twitter", label: "Twitter" },
    { id: "discord", label: "Discord" },
];

export const TYPE_OPTIONS = [
    { id: "group", label: "Nhóm công khai" },
    { id: "private_group", label: "Nhóm kín" },
    { id: "person", label: "Cá nhân" },
    { id: "fanpage", label: "Trang" },
];

export const PLATFORM_LABELS: Record<PlatformId, string> = {
    facebook: "Facebook",
    tiktok: "TikTok",
    x: "X (Twitter)",
    threads: "Threads",
    youtube: "Youtube"
};

export const PLATFORM_URLS: Record<string, string> = {
    x: "https://x.com/",
    facebook: "https://www.facebook.com/",
    tiktok: "https://www.tiktok.com/",
    threads: "https://www.threads.com/",
    youtube: "https://www.youtube.com/",
};

const PLATFORM_URL_PATTERNS: Record<PlatformId, RegExp> = {
    facebook: /^https?:\/\/(www\.|web\.)?facebook\.com\//i,
    tiktok: /^https?:\/\/(www\.)?(m\.)?(vt\.)?(vm\.)?tiktok\.com\/*.*$/i,
    threads: /^https?:\/\/(www\.)?threads\.com\/*.*$/i,
    x: /^https?:\/\/x\.com\/*.*$/i,
    youtube: /^https?:\/\/(www\.)?youtube\.com\/*.*$/i,
};

export function detectPlatformByPattern(url: string | undefined | null): PlatformId | null {
    if (!url) return null;
    const platformParterns = Object.entries(PLATFORM_URL_PATTERNS) as [PlatformId, RegExp][];
    for (const [platform, re] of platformParterns) {
        if (re.test(url)) return platform;
    }
    return null;
}

export const DEFAULT_SCROLLING_URL = [
    "https://www.facebook.com/",
    "https://www.facebook.com/groups/feed/",
    "https://www.facebook.com/?filter=groups&sk=h_chr",
];


export type MainTab = "dashboard" | "automation" | "group" | "eviden";

export const DEFAULT_CASE_ID = 'new';
export const DEFAULT_PAGE_SIZE = 10;

export const PLATFORM_CHANGED_EVENT = "hydra:login-success-redirectplatform-changed";