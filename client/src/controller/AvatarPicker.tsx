import { useEffect, useId, useRef, type ChangeEvent } from "react";
import { FiUpload, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";

const imageTypes = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarPicker({ value, onChange, reading, onReadingChange, disabled }: {
  value: string | null;
  onChange: (value: string | null) => void;
  reading: boolean;
  onReadingChange: (reading: boolean) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<FileReader>(null);
  const helpId = useId();
  const busy = reading || disabled;

  useEffect(() => () => pending.current?.abort(), []);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!imageTypes.includes(file.type) || !file.size || file.size > 1024 * 1024) {
      toast.error("Chọn ảnh JPG, PNG hoặc WebP dung lượng tối đa 1 MB.");
      return;
    }

    const reader = new FileReader();
    pending.current = reader;
    onReadingChange(true);
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.onerror = () => toast.error("Không đọc được ảnh đã chọn.");
    reader.onloadend = () => {
      pending.current = null;
      onReadingChange(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-2xl text-brand">
        {value ? <img src={value} alt="Ảnh đại diện xem trước" className="size-full object-cover" /> : <FiUser aria-hidden="true" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Ảnh đại diện</p>
        <p id={helpId} className="my-1 text-sm text-slate-600">JPG, PNG hoặc WebP, tối đa 1 MB.</p>
        <input ref={input} type="file" accept={imageTypes.join(",")} onChange={selectImage} disabled={busy} hidden />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} aria-describedby={helpId}
            className="inline-flex items-center gap-2 rounded-lg border border-brand/30 bg-white px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-60">
            <FiUpload aria-hidden="true" />
            {reading ? "Đang đọc ảnh…" : value ? "Đổi ảnh" : "Chọn ảnh"}
          </button>
          {value && <button type="button" onClick={() => onChange(null)} disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">Xóa ảnh</button>}
        </div>
      </div>
    </div>
  );
}
