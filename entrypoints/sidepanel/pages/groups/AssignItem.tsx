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
    const crawledTime = profile.crawled_time;
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
                    {crawledTime != null && <time className="group-task-card__updated" dateTime={new Date(crawledTime).toISOString()}>Thu thập: {new Date(crawledTime).toLocaleDateString("vi-VN")}</time>}
                </div>
            </div>
        </article>
    );
}
export default AssignItem;
