import { useState, useEffect } from "react";
import { FiFilter, FiRefreshCw, FiAlertCircle, FiLayers, FiList } from "../../assets/constants/icons";
import { FaChevronLeft, FaChevronRight } from "../../assets/constants/icons";

import { appStorage } from "../../../../entrypoints/sidepanel/application/services/SidepanelServices";
import { useAuth } from "../../contexts/AuthContext";
import { GroupProfile, User } from "../../types/types";

import { TYPE_OPTIONS, PLATFORM_OPTIONS } from "../../helpers/constants";
import { MultiSelectFilter, SearchInput } from "../../components/ui";
import { getPageNumbers } from "../../helpers/helpers";
import AssignItem, { getAssignmentStatus, infiltrationLabels, type AssignmentStatus } from "./AssignItem";
import { getMemberSourcesApi } from "../../infrastructure/api/source-member.api";


const PAGE_SIZE = 10;

// ─── Component ───────────────────────────────────────────────────────────────
export type GroupPageDataSource = typeof getMemberSourcesApi;

export interface GroupPageProps {
  dataSource?: GroupPageDataSource;
}

function GroupPage({ dataSource = getMemberSourcesApi }: GroupPageProps = {}) {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<GroupProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AssignmentStatus>("all");
  const [page, setPage] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  async function fetchProfiles() {
    if (authLoading) return;

    setLoading(true);
    setError(null);
    try {
      let assigneeId = user?.id;
      if (!assigneeId) {
        const storedUser = await appStorage.getItem<User>("local:user");
        assigneeId = storedUser?.id;
      }

      const limit = PAGE_SIZE;
      const offset = (page - 1) * PAGE_SIZE;

      const res = await dataSource(
        assigneeId,
        undefined,
        debouncedSearch || undefined,
        offset,
        limit,
        selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
        selectedTypes.length > 0 ? selectedTypes : undefined,
      );

      const dataList = res?.data || res?.memberSources || (Array.isArray(res) ? res : []);
      console.log("Fetched data list:", dataList);
      const count = typeof res?.total === "number" ? res.total : dataList.length;
      console.log("Total count:", count);

      setProfiles(dataList);
      setTotalCount(count);
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách hội nhóm:", err);
      setError("Không thể tải danh sách hội nhóm từ máy chủ.");
      setProfiles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfiles();
    }
  }, [
    user?.id,
    authLoading,
    page,
    debouncedSearch,
    selectedPlatforms,
    selectedTypes,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // Counts are based on the currently loaded API page; no missing status is inferred.
  const taskStatusCounts: Record<"all" | AssignmentStatus, number> = {
    all: totalCount,
    NOT_EXIST: profiles.filter((item) => getAssignmentStatus(item) === "NOT_EXIST").length,
    UNASSIGNED: profiles.filter((item) => getAssignmentStatus(item) === "UNASSIGNED").length,
    ASSIGNED: profiles.filter((item) => getAssignmentStatus(item) === "ASSIGNED").length,
  };
  const visibleProfiles = statusFilter === "all"
    ? profiles
    : profiles.filter((item) => getAssignmentStatus(item) === statusFilter);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleStatusFilter = (s: any) => { setStatusFilter(s); };


  return (
    <div className="group-page">
      <header className="group-page__header">
        <h1>Danh sách nhiệm vụ</h1>
      </header>

      <div className="group-page__toolbar">
        <SearchInput
          id="group-search" value={search} onChange={handleSearch}
          placeholder="Tìm kiếm tên nhóm, ID..."
          wrapperClassName="group-page__search-wrapper"
          iconClassName="group-page__search-icon"
          inputClassName="group-page__search"
        />
        <div className="group-page__filter-row">
          <div className="group-page__advanced-filters">
            <MultiSelectFilter label="Kênh" leftIcon={<FiLayers />} options={PLATFORM_OPTIONS} selectedValues={selectedPlatforms} onChange={(values) => { setSelectedPlatforms(values); setPage(1); }} />
            <MultiSelectFilter label="Loại nhóm" leftIcon={<FiList />} options={TYPE_OPTIONS} selectedValues={selectedTypes} onChange={(values) => { setSelectedTypes(values); setPage(1); }} />
          </div>
          <button className="group-page__filter-icon" type="button" title="Xóa các bộ lọc" aria-label="Xóa các bộ lọc" onClick={() => { setSelectedPlatforms([]); setSelectedTypes([]); setStatusFilter("all"); setPage(1); }}><FiFilter /><span className="group-page__filter-dot" aria-hidden="true">{selectedPlatforms.length + selectedTypes.length + (statusFilter === 'all' ? 0 : 1) || ''}</span></button>
        </div>
      </div>

      <nav className="group-page__status-tabs" aria-label="Lọc trạng thái nhiệm vụ">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'NOT_EXIST', label: infiltrationLabels.NOT_EXIST },
          { id: 'UNASSIGNED', label: infiltrationLabels.UNASSIGNED },
          { id: 'ASSIGNED', label: infiltrationLabels.ASSIGNED },
        ].map((item) => (
          <button key={item.id} type="button"
            className={`group-page__status-tab ${statusFilter === item.id ? 'is-active' : ''}`}
            onClick={() => handleStatusFilter(item.id)}
            aria-current={statusFilter === item.id ? 'page' : undefined}>
            <span className="group-page__tab-label">{item.label}</span><span className="group-page__tab-count">{taskStatusCounts[item.id as keyof typeof taskStatusCounts]}</span>
          </button>
        ))}
      </nav>

      <section className="group-page__results" aria-label="Danh sách nhóm">
        <div className="group-page__results-header">
          <h2>Nhiệm vụ <span>({totalCount.toLocaleString('vi-VN')} nhiệm vụ)</span></h2>
          <button type="button" onClick={() => fetchProfiles()} disabled={loading} className="group-page__refresh"><FiRefreshCw aria-hidden="true" /> Làm mới dữ liệu</button>
        </div>
        <div className="group-table-body">
          {loading ? (
            <div className="group-empty"><FiRefreshCw className="group-empty__icon group-empty__icon--spin" /><strong>Đang tải danh sách...</strong></div>
          ) : error || visibleProfiles.length === 0 ? (
            <div className="group-empty"><FiAlertCircle className="group-empty__icon" /><strong>{error ? 'Không thể tải danh sách' : 'Không tìm thấy hội nhóm'}</strong><span>{error ?? 'Thử thay đổi từ khóa hoặc bộ lọc.'}</span>{error && <button type="button" onClick={() => fetchProfiles()}>Thử lại</button>}</div>
          ) : visibleProfiles.map((profile) => <AssignItem key={profile.id} {...profile} />)}
        </div>
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="group-pagination">
          <button
            className="group-pagination__btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Trang trước"
          >
            <FaChevronLeft />
          </button>

          {getPageNumbers(page, totalPages)
            .map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="group-pagination__ellipsis"                >
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={p}
                  className={`group-pagination__btn group-pagination__num ${page === p ? "group-pagination__num--active" : ""}`}
                  onClick={() => setPage(p as number)}
                  aria-current={page === p ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}

          <button
            className="group-pagination__btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Trang sau"
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

export default GroupPage;
