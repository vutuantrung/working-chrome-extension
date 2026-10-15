import { FiUsers, FiUser, FiExternalLink, FiCopy, FiLock } from "../../assets/constants/icons";
import { getChannelIcon } from "../../helpers/helpers-ui";
import type { GroupProfile } from "../../types/types";

export const infiltrationLabels = {
    NOT_EXIST: 'Chưa rà soát',
    UNASSIGNED: 'Đã rà soát',
    ASSIGNED: 'Đã phân công',
} as const;

export type AssignmentStatus = keyof typeof infiltrationLabels;
export function getAssignmentStatus(profile: Pick<GroupProfile, "assign_status">): AssignmentStatus | undefined {
    return profile.assign_status?.find((status): status is AssignmentStatus =>
        Object.prototype.hasOwnProperty.call(infiltrationLabels, status)
    );
}

function AssignItem(profile: GroupProfile) {
    const status = getAssignmentStatus(profile);
    const profileType = profile.profileType;

    const url = profile.accountUrl;
    const copyUrl = async () => {
        if (!url) return;
        try { await navigator.clipboard.writeText(url); } catch { /* clipboard may not be available */ }
    };
    return (
        <article className="group-task-card">
            <div className="group-task-card__main">
                <div className="group-task-card__avatar">
                    {profile.avatarPath ? <img src={profile.avatarPath} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <FiUsers aria-hidden="true" />}
                    <span className="group-task-card__channel">{getChannelIcon(profile.channelName)}</span>
                </div>
                <div className="group-task-card__content">
                    <div className="group-task-card__title">
                        <FiLock className="group-task-card__lock" />
                        <strong title={profile.profileName}>{profile.profileName}</strong>
                    </div>
                    <div className="group-task-card__meta">
                        <span className={`group-task-card__${profile.active ? 'online' : 'offline'}`}><i />{profile.active ? 'Đang hoạt động' : 'Không hoạt động'}</span>
                        <span className="group-task-card__separator">•</span>
                        {
                            status
                                ? <span className={`group-task-card__state group-task-card__state--${status.toLowerCase()}`}>{infiltrationLabels[status]}</span>
                                : <span className="group-task-card__state group-task-card__state--neutral">{profile.assignedGroupId
                                    ? 'Đã phân công'
                                    : 'Đã rà soát'}</span>
                        }</div>
                </div>
                <div className="group-task-card__actions"><button type="button" title="Sao chép liên kết" aria-label={`Sao chép liên kết ${profile.profileName}`} onClick={copyUrl} disabled={!url}><FiCopy /></button><a href={url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`Mở ${profile.profileName}`} title="Mở hội nhóm" className={!url ? 'is-disabled' : ''} onClick={!url ? (e) => e.preventDefault() : undefined}><FiExternalLink /></a></div>
            </div>
            <div className="group-task-card__footer">
                {/* <span className="group-task-card__count"><FiUser aria-hidden="true" />{typeof accountCount === 'number' ? `${accountCount} vai ảo đã thâm nhập` : `${profile.totalMemberCount.toLocaleString('vi-VN')} thành viên`}</span> */}

                <span className="group-task-card__account">
                    <FiUser aria-hidden="true" />
                    {profile.accountDisplayName || profile.assignedUserName || 'Tài khoản'}:
                    <em className={status ? `state-${status.toLowerCase()}` : ''}>{status ? infiltrationLabels[status] : profile.assignedGroupId ? 'Đã phân công' : 'Chưa phân công'}
                    </em>
                </span>
            </div>
        </article>
    );
}
export default AssignItem;
