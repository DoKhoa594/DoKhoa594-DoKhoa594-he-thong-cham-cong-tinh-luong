import { useState } from "react";

const fieldClass = "mt-1.5 block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

const searchKey = (text: string) => text.toLowerCase().normalize("NFD")
  .replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").trim();

export default function SuggestionField({ label, name, value, options, onChange, maxLength = 80 }: {
  label: string;
  maxLength?: number;
  name: string;
  value: string;
  options: { label: string; keywords?: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = searchKey(value);
  const matches = options.filter(option =>
    searchKey(`${option.label} ${option.keywords ?? ""}`).includes(query),
  );
  const listId = `${name}-suggestions`;

  const choose = (label: string) => {
    onChange(label);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="relative min-w-0">
      <label htmlFor={name} className="text-sm font-semibold text-slate-600">{label}</label>
      <input
        id={name}
        name={name}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Gõ để tìm"
        maxLength={maxLength}
        value={value}
        className={fieldClass}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => { setOpen(false); setActive(-1); }}
        onChange={event => {
          onChange(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={event => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
            setActive(-1);
          }
          if (event.key === "Enter" && open && active >= 0 && matches[active]) {
            event.preventDefault();
            choose(matches[active].label);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            if (!matches.length) return;
            const next = event.key === "ArrowDown"
              ? Math.min(active + 1, matches.length - 1)
              : active < 0 ? matches.length - 1 : Math.max(0, active - 1);
            setActive(next);
            requestAnimationFrame(() => document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" }));
          }
        }}
      />
      {open && (
        <ul id={listId} role="listbox" aria-label={label}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-lg">
          {matches.map((option, index) => (
            <li key={option.label} id={`${listId}-${index}`} role="option" aria-selected={active === index}
              onMouseDown={event => event.preventDefault()} onClick={() => choose(option.label)}
              className={`cursor-pointer rounded-md px-2.5 py-2 hover:bg-brand-soft ${active === index ? "bg-brand-soft text-brand" : ""}`}>
              {option.label}
            </li>
          ))}
          {!matches.length && <li role="presentation" className="px-2.5 py-2 text-slate-600">Không có gợi ý</li>}
        </ul>
      )}
    </div>
  );
}
