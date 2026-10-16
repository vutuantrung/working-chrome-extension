import { FiUsers, FiUser, FiExternalLink, FiCopy, FiLock, FaFolder, FaGlobe, FiKey } from "../../assets/constants/icons";
import { getChannelIcon } from "../../helpers/helpers-ui";
import type { GroupProfile } from "../../types/types";

/** Membership states returned by the profiles API. Do not infer a status when absent. */
export const infiltrationLabels = {
    requested: "Đã gửi yêu cầu",
    not_joined: "Chưa tham gia",
    joined: "Đã tham gia",
}

const typeLabels: Record<string, string> = {
    private_group: "Nhóm riêng tư",
    group: "Nhóm công khai",
    profile: "Trang cá nhân",
    fanpage: "Fanpage",
}

export type InfiltrationStatus = keyof typeof infiltrationLabels;
export function getInfiltrationStatus(profile: Pick<GroupProfile, "status">): InfiltrationStatus | undefined {
    return profile.status?.find((value): value is InfiltrationStatus =>
        Object.prototype.hasOwnProperty.call(infiltrationLabels, value)
    )
}

const typeIcons = {
    private_group: FiLock,
    group: FiUsers,
    profile: FiUser,
    fanpage: FaGlobe,
}

/** Format elapsed time from an API timestamp in milliseconds. */
function formatTimeSince(timestamp: number): string {
    const elapsed = Date.now() - timestamp;
    if (!Number.isFinite(elapsed)) return "";
    if (elapsed < 0) return "Trong tương lai";
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "Vừa cập nhật";
    const units: [number, Intl.RelativeTimeFormatUnit][] = [
        [365 * 24 * 60, "year"],
        [30 * 24 * 60, "month"],
        [7 * 24 * 60, "week"],
        [24 * 60, "day"],
        [60, "hour"],
        [1, "minute"],
    ];
    const formatter = new Intl.RelativeTimeFormat("vi-VN", { numeric: "always" });
    for (const [size, unit] of units) {
        if (minutes >= size) return formatter.format(-Math.floor(minutes / size), unit);
    }
    return "Vừa cập nhật";
}

function AssignItem(profile: any) {
    const status = getInfiltrationStatus(profile);
    const activity = profile.active === true || profile.active === "active" || profile.activity_status === "active"
        ? "active"
        : profile.active === false || profile.active === "inactive" || profile.activity_status === "inactive"
            ? "inactive"
            : null;
    const type = profile.type;
    const url = profile.url;
    const name = profile.name || "Không có tên";
    const id = profile.group_id;
    const updatedTime = typeof profile.updated_time === "number" ? profile.updated_time : Number(profile.updated_time);
    const updatedDate = Number.isFinite(updatedTime) && updatedTime > 0 ? new Date(updatedTime) : null;
    const validUpdatedDate = updatedDate && !Number.isNaN(updatedDate.getTime()) ? updatedDate : null;
    const TypeIcon = typeIcons[type as keyof typeof typeIcons] ?? FaFolder;
    const copyId = async () => {
        if (!id) return;
        try {
            await navigator.clipboard.writeText(id);
        }
        catch {
            /* Clipboard unavailable */
        }
    };

    return (
        <article className="group-task-card">
            <div className="group-task-card__main">
                <div className="group-task-card__avatar" aria-label={typeLabels[type] ?? type}>
                    <TypeIcon aria-hidden="true" />
                    <span className="group-task-card__channel" title={profile.channel_name || "Unknown channel"}>

                        {getChannelIcon(profile.channel_name)}
                    </span>
                </div>
                <div className="group-task-card__content">
                    <div className="group-task-card__title">
                    <TypeIcon aria-hidden="true" />
                        <strong title={name}>{name}</strong>
                    </div>
                    <div className="group-task-card__meta">
                        {/* <span className="group-task-card__type">
                            <TypeIcon aria-hidden="true" />{typeLabels[type] ?? type}
                        </span> */}
                        {activity && <span className={`group-task-card__activity group-task-card__activity--${activity}`}><i aria-hidden="true" />{activity === "active" ? "Đang hoạt động" : "Không hoạt động"}</span>}
                        {status && <span className={`group-task-card__state group-task-card__state--${status}`}>{infiltrationLabels[status]}</span>}
                    </div>
                </div>
                <div className="group-task-card__actions">
                    <a href={url || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở ${name}`}
                        title="Mở liên kết"
                        className={!url ? "is-disabled" : ""}
                        onClick={!url ? (event) => event.preventDefault() : undefined}>
                        <FiExternalLink />
                    </a>
                </div>
            </div>
            <div className="group-task-card__footer">
                <div className="group-task-card__footer-content">
                    <span className="group-task-card__source">
                        <FiKey aria-hidden="true" /> {profile.group_id || "Unknown id"}
                    </span>

                    <button type="button"
                        title="Sao chép ID"
                        aria-label={`Sao chép ID ${name}`}
                        onClick={copyId}
                        disabled={!id}>
                        <FiCopy />
                    </button>
                </div>
                <div>
                    {validUpdatedDate && <time className="group-task-card__updated" dateTime={validUpdatedDate.toISOString()} title={validUpdatedDate.toLocaleString("vi-VN")}>Cập nhật: {validUpdatedDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ({formatTimeSince(updatedTime)})</time>}
                </div>
            </div>
        </article>
    );
}
export default AssignItem;
