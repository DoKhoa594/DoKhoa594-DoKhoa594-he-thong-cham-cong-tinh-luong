import EmployeeAvatar from "./EmployeeAvatar";
import { profileFields, profileLabels, type ProfileRequest } from "./portalData";

export default function ProfileChanges({ changes, passwordChange }: { changes: ProfileRequest["changes"]; passwordChange?: boolean }) {
  return (
    <dl className="space-y-2 text-sm">
      {profileFields.map(field => {
        const change = changes[field];
        return change && (
          <div key={field} className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="font-medium">{profileLabels[field]}</dt>
            <dd className="break-words"><span className="text-slate-600">{change.from || "Trống"}</span> → <span className="font-semibold text-brand">{change.to || "Trống"}</span></dd>
          </div>
        );
      })}
      {changes.avatar && <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="font-medium">Ảnh đại diện</dt>
        <dd className="flex flex-wrap items-center gap-2">
          <EmployeeAvatar src={changes.avatar.from} className="size-10" label="Ảnh trước khi đổi" />
          <span aria-hidden="true">→</span>
          <EmployeeAvatar src={changes.avatar.to} className="size-10" label="Ảnh đề xuất" />
        </dd>
      </div>}
      {passwordChange && <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="font-medium">Mật khẩu</dt><dd className="text-slate-600">Yêu cầu đổi mật khẩu đăng nhập.</dd>
      </div>}
    </dl>
  );
}
