import { useEffect } from "react";
import { X } from "lucide-react";

export function ImageLightbox({
  src, title, onClose
}: { src: string; title: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="lightboxOverlay" onClick={onClose}>
      <div className="lightboxContent" onClick={e => e.stopPropagation()}>
        <div className="lightboxHeader">
          <span>{title}</span>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <img src={src} alt={title} />
      </div>
    </div>
  );
}
