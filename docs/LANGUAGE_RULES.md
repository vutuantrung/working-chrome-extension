# LANGUAGE RULES — Quy chuẩn đa ngôn ngữ (i18n)

> **Áp dụng:** toàn bộ giao diện React/TypeScript thuộc `entrypoints/sidepanel/`.
>
> **Ngôn ngữ hỗ trợ:** `en` (English) và `vi` (Tiếng Việt).
>
> **Mục tiêu:** Khi chuyển Language trong Settings hoặc Gallery, **mọi nội dung UI do ứng dụng kiểm soát** phải được cập nhật nhất quán, không tải lại trang; không ảnh hưởng ID, API, dữ liệu lưu trữ hay logic nghiệp vụ.

## 1. Nguyên tắc bắt buộc

1. **Không hard-code câu chữ hiển thị trong JSX/TSX.** Bao gồm title, label, button, tab, badge, placeholder, tooltip, thông báo, empty state, loading state, lỗi, accessibility labels như `aria-label`, `title` và `alt` có ý nghĩa.
2. **Một nguồn bản dịch duy nhất:** `entrypoints/sidepanel/helpers/i18n.ts`. Mỗi khóa phải có ở cả `dictionary.en` và `dictionary.vi`.
3. **Dùng khóa có nghĩa, ổn định:** ví dụ `caseSaved`, `personaSwitchHint`, `login_err_no_cookie`. Không dùng nguyên câu làm key; không tạo hai key cho cùng một ý nghĩa nếu có thể tái sử dụng.
4. **Giữ nguyên các giá trị kỹ thuật:** ID, enum, route, API payload, error code, tên field, storage key, event name, protocol, CSS class và URL. Dịch **nhãn**, không dịch **giá trị**.
5. **Đổi ngôn ngữ phải phản ứng ngay:** component hiển thị sử dụng `useTranslation()` hoặc nhận text đã dịch từ component cha. Không gọi `getLanguage()` một lần ở module scope để tạo nhãn tĩnh.
6. **Không dùng câu tiếng Anh như fallback ngầm** cho khóa dịch không tồn tại. Thiếu khóa phải được bổ sung và kiểm tra trước khi merge/push.
7. **Không gọi React hooks trong `constants.ts`, callback thông thường, nhánh điều kiện, loop hoặc ngoài component/custom hook.**

## 2. Kiến trúc & nguồn dữ liệu

| Thành phần | Trách nhiệm |
| --- | --- |
| `helpers/i18n.ts` | `AppLanguage`, `TranslationKey`, dictionary, `translate()`, `setLanguage()`, `useTranslation()` |
| `helpers/constants.ts` | Các lựa chọn tĩnh với `id` và `label_id`, hàm `localizeOptions()` |
| `pages/settings/SettingsPage.tsx` | Thay đổi Language và lưu preferences |
| `gallery/StyleGallery.tsx` | Thử English/Vietnamese và Light/Dark trong Gallery |
| `localStorage["hydra:ui-preferences"]` | Lưu `language` cùng các UI preferences khác |

Các nhãn thường được tính lại khi component render bằng ngôn ngữ hiện tại; `setLanguage()` phát sự kiện `hydra:language-changed`. Không sửa trực tiếp DOM để dịch từng element.

## 3. Quy tắc khai báo constant: `{ id, label_id }`

**Bắt buộc** dùng `label_id` trỏ tới `TranslationKey` khi khai báo các collection chọn/lọc/tab trong constants.

✅ Đúng:

```ts
export const FB_GROUP_TYPE: LocalizedOption[] = [
  { id: "group", label_id: "group" },
  { id: "private_group", label_id: "private_group" },
];
```

❌ Sai:

```ts
export const FB_GROUP_TYPE = [
  { id: "group", label: "Nhóm công khai" },
  { id: "private_group", label: "Nhóm kín" },
];
```

**Giữ `id` không đổi** khi đổi Language. `label_id` là key trong dictionary, không phải bản dịch thực tế.

Các cấu hình không có dạng danh sách có thể chứa `label_id` riêng:

```ts
export const STATUS_CONFIG = {
  "da-ra-soat": {
    label_id: "reviewedStatus",
    className: "group-status--reviewed",
  },
};
```

Nếu constant là tên kỹ thuật/định danh không dùng làm UI label (ví dụ URL, protocol, tên nền tảng cần truyền nguyên văn), **không đổi kiểu thành `TranslationKey` nếu caller đang cần string thật**. Xác minh mọi nơi tham chiếu trước khi refactor.

## 4. Quy tắc `localizeOptions()`

Hàm hiện có trong `helpers/constants.ts` nhận **2 tham số**:

```ts
localizeOptions(options, t)
```

Hàm nhận `{ id, label_id }`, dùng `t(label_id)` và tạo bản hiển thị `{ id, label }` cho các control đã sử dụng `label`. Hàm **không** cần bảng map theo ID thứ hai.

✅ Đúng:

```tsx
import { FB_GROUP_TYPE, localizeOptions } from "../../helpers/constants";
import { useTranslation } from "../../helpers/i18n";

function TypeFilter() {
  const { t } = useTranslation();
  const options = localizeOptions(FB_GROUP_TYPE, t);

  return <MultiSelectFilter
    label={t("groupType")}
    options={options}
    selectedValues={[]}
    onChange={() => {}}
  />;
}
```

❌ Sai:

```tsx
localizeOptions(FB_GROUP_TYPE, TYPE_OPTION_KEYS, t); // API cũ
```

```ts
const options = localizeOptions(FB_GROUP_TYPE, translate(getLanguage(), ...));
```

**Không cache options đã dịch ở module scope.** Nếu memoize trong component, dependency phải bao gồm `language` hoặc `t` (cẩn thận `t` có thể được tạo lại mỗi render).

Với bảng tra cứu theo error code:

```tsx
const key = LOGIN_ERROR_MESSAGES.find(item => item.id === reason)?.label_id
  ?? "login_err_unknown";
const message = t(key);
```

Không hiển thị `label_id` trực tiếp trên giao diện và không gửi label đã dịch lên backend.

## 5. Quy tắc trong React component

### Text cố định

✅ Đúng:

```tsx
function CaseActions() {
  const { t } = useTranslation();
  return (
    <>
      <button aria-label={t("createCase")}>{t("createCaseAction")}</button>
      <span role="status">{t("caseSaved")}</span>
    </>
  );
}
```

❌ Sai:

```tsx
<button title="Create case">Create case</button>
<span>Saved</span>
```

### Component con

- Component **tự quyết định** một text (ví dụ `ConfirmModal` có default confirm/cancel) thì tự sử dụng `useTranslation()`.
- Component **nhận label từ props** (ví dụ `TopTabs`, `SidebarItem`) thì caller phải truyền label đã dịch.
- Không yêu cầu tất cả component đều import i18n: component hoàn toàn thuần trình bày/không sinh text có thể không cần hook.

### Trạng thái, badge, option

Tách `status`/enum gốc khỏi nhãn:

```tsx
const status = "joined"; // API value — giữ nguyên
const label = t("joined"); // UI label
```

Nếu component nhận `label` tùy chỉnh thì coi đó là dữ liệu hiển thị của caller; caller chịu trách nhiệm dịch, hoặc chuyển API component sang nhận `label_id` nếu phù hợp.

## 6. Text động, ngày giờ và số

- Không ghép câu đa ngôn ngữ bằng các mảnh cố định khi thứ tự từ có thể khác nhau. Ưu tiên mẫu câu nguyên vẹn với placeholder và thay giá trị động sau khi dịch.
- Số, ngày giờ và relative time phải có locale theo `language` (`vi-VN` hoặc `en-US`).
- Không dịch tên riêng, URL, username, dữ liệu do người dùng nhập hoặc text do bên ngoài cung cấp.
- API error: ưu tiên map `error.code`/`reason` sang key dịch. Với thông báo raw không có mã, hiển thị trung thực và không đoán ý nghĩa.

Ví dụ:

```tsx
const { language, t } = useTranslation();
const dateLabel = new Intl.DateTimeFormat(
  language === "vi" ? "vi-VN" : "en-US",
  { dateStyle: "medium" }
).format(new Date());
```

## 7. Rule khi thêm hoặc sửa tính năng

Với **mỗi PR/commit thay đổi UI**:

1. Tìm mọi nội dung mới hiển thị cho người dùng (bao gồm dialog, tooltip, placeholder, alt, aria-label, toast và empty state).
2. Kiểm tra dictionary trước khi tạo key mới; tái sử dụng key tương đương.
3. Thêm/sửa key **ở cả English và Vietnamese** trong cùng thay đổi.
4. Với option/tab/filter tĩnh, khai báo `{ id, label_id }` và dịch ở ranh giới render bằng `localizeOptions(options, t)`.
5. Kiểm tra tất cả caller nếu chỉnh sửa chữ ký API, key hoặc kiểu dữ liệu.
6. Chuyển Language khi trang đang mở; đảm bảo label cập nhật ngay và lựa chọn/filter không bị reset.
7. Kiểm tra Light và Dark, đặc biệt độ dài text tiếng Việt.
8. Chạy TypeScript/build và kiểm tra tối thiểu các trang hoặc component vừa thay đổi trước khi xác nhận hoàn tất.

## 8. Checklist kiểm thử tối thiểu

- [ ] 100% key mới có trong cả `en` và `vi`.
- [ ] Không phát sinh duplicate keys.
- [ ] Không có UI text mới hard-code ngoài các ngoại lệ đã nêu.
- [ ] Chuyển ngôn ngữ **không reload** vẫn cập nhật đầy đủ.
- [ ] Reload vẫn giữ ngôn ngữ đã chọn.
- [ ] Tabs, dropdown, filter, badge giữ nguyên `id` và behavior.
- [ ] Dialog, button, toast, tooltip, placeholder, aria-label đều đúng ngôn ngữ.
- [ ] Ngày/giờ/số theo locale.
- [ ] TypeScript/build thành công, không còn callsite của API `localizeOptions(options, keys, t)` cũ.
- [ ] Không vô tình đổi backend error codes, route names, storage fields hoặc API payload.

## 9. Anti-patterns cần tránh

| Anti-pattern | Cách làm đúng |
| --- | --- |
| `{ id, label: "Đã rà soát" }` | `{ id, label_id: "reviewedStatus" }` |
| Dùng `label_id` để hiển thị trực tiếp | `t(label_id)` |
| Map key theo ID ở ngoài constant | Khai báo `label_id` ngay tại constant |
| `localizeOptions(options, map, t)` | `localizeOptions(options, t)` |
| Dịch ID `joined` thành `Đã tham gia` trong payload | Chỉ dịch display label |
| Lưu bản dịch thành biến ở module scope | Dịch khi component render |
| Chỉ dịch header, bỏ dialog/loading/tooltip | Kiểm tra toàn bộ text có thể nhìn thấy |
| Ghi đè toàn bộ preferences khi đổi Language | Giữ nguyên các thuộc tính preferences khác |

## 10. Definition of Done

Một thay đổi liên quan đến Language **chỉ được coi là hoàn tất** khi:

- UI mới hoặc UI được sửa hoạt động đúng với cả `en` và `vi`.
- Định danh kỹ thuật và logic nghiệp vụ không đổi.
- Không tồn tại text hard-code có thể dịch trong phạm vi thay đổi.
- Build/typecheck và các thao tác chính được xác minh, hoặc ghi rõ phần chưa kiểm thử.

---

**Lưu ý hiện trạng:** Đây là **rules chuẩn hóa**, không phải chứng nhận codebase hiện đã tuân thủ 100%. Khi phát hiện phần code cũ chưa tuân thủ, nên sửa theo phạm vi rõ ràng và kiểm thử để tránh regression.
