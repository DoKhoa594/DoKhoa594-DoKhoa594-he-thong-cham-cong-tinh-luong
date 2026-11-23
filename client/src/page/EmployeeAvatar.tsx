import { FiUser } from "react-icons/fi";

export default function EmployeeAvatar({ src, className = "", label }: {
  src?: string | null;
  className?: string;
  label?: string;
}) {
  const image = src && /^data:image\/(?:jpeg|png|webp);base64,/.test(src);
  return (
    <span className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-brand ${className}`}>
      {image ? <img src={src} alt={label ?? ""} className="h-full w-full object-cover" /> : <FiUser aria-hidden="true" />}
    </span>
  );
}
