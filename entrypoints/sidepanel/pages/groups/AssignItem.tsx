import { FiUsers, FiUser, FiExternalLink, FiCopy, FiLock, FaFolder, FaGlobe } from "../../assets/constants/icons";
import { getChannelIcon } from "../../helpers/helpers-ui";
import type { GroupProfile } from "../../types/types";

/** Membership states returned by the profiles API. Do not infer a status when absent. */
export const infiltrationLabels = {
    requested: "Đã gửi yêu cầu",
    not_joined: "Chưa tham gia",
    joined: "Đã tham gia",
} as const;

export type InfiltrationStatus = keyof typeof infiltrationLabels;
export function getInfiltrationStatus(profile: Pick<GroupProfile, "status">): InfiltrationStatus | undefined {
    return profile.status?.find((value): value is InfiltrationStatus =>
        Object.prototype.hasOwnProperty.call(infiltrationLabels, value)
    );
}

const typeLabels: Record<string, string> = {
    private_group: "Nhóm riêng tư",
    group: "Nhóm công khai",
    profile: "Trang cá nhân",
    fanpage: "Fanpage",
};
const typeIcons = {
    private_group: FiLock,
    group: FiUsers,
    profile: FiUser,
    fanpage: FaGlobe,
} as const;

function AssignItem(profile: GroupProfile) {
    const status = getInfiltrationStatus(profile);
    const type = profile.profileType || profile.type || (profile.is_profile ? "profile" : "group");
    const TypeIcon = typeIcons[type as keyof typeof typeIcons] ?? FaFolder;
    const url = profile.accountUrl;
    const name = profile.profileName || profile.socialId || "Không có tên";
    const copyUrl = async () => {
        if (!url) return;
        try { await navigator.clipboard.writeText(url); } catch { /* Clipboard unavailable */ }
    };

    return (
        <article className="group-task-card">
            <div className="group-task-card__main">
                <div className="group-task-card__avatar" aria-label={typeLabels[type] ?? type}>
                    <TypeIcon aria-hidden="true" />
                    <span className="group-task-card__channel" title={profile.channelName || "Unknown channel"}>
                        {getChannelIcon(profile.channelName)}
                    </span>
                </div>
                <div className="group-task-card__content">
                    <div className="group-task-card__title"><strong title={name}>{name}</strong></div>
                    <div className="group-task-card__meta">
                        <span className="group-task-card__type"><TypeIcon aria-hidden="true" />{typeLabels[type] ?? type}</span>
                        {status && <span className={`group-task-card__state group-task-card__state--${status}`}>{infiltrationLabels[status]}</span>}
                    </div>
                    <div className="group-task-card__identifier">ID: {profile.socialId || profile.id}</div>
                </div>
                <div className="group-task-card__actions">
                    <button type="button" title="Sao chép liên kết" aria-label={`Sao chép liên kết ${name}`} onClick={copyUrl} disabled={!url}><FiCopy /></button>
                    <a href={url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`Mở ${name}`} title="Mở liên kết" className={!url ? "is-disabled" : ""} onClick={!url ? (event) => event.preventDefault() : undefined}><FiExternalLink /></a>
                </div>
            </div>
            <div className="group-task-card__footer">
                <span className="group-task-card__source">
                    <FiUser aria-hidden="true" /> {profile.channelName || "Unknown channel"}
                </span>
                {profile.crawled_time != null && <time className="group-task-card__updated" dateTime={new Date(profile.crawled_time).toISOString()}>Thu thập: {new Date(profile.crawled_time).toLocaleDateString("vi-VN")}</time>}
            </div>
        </article>
    );
}
export default AssignItem;
