import { useRef, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type { Annotation } from "../types";

const COLORS = ["#e8b84b", "#8b1a1a", "#2d5a27", "#4a7fb5", "#8b5e3c"];

let _id = 0;
const uid = () => `ann-${++_id}`;

export function AnnotationTool({ imageSrc }: { imageSrc: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<Partial<Annotation> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [colorIdx, setColorIdx] = useState(0);

  function relPos(e: React.MouseEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    };
  }

  function onMouseDown(e: React.MouseEvent) {
    if (editId) return;
    const pos = relPos(e);
    setDrawing(pos);
    setCurrent({ x: pos.x, y: pos.y, w: 0, h: 0, color: COLORS[colorIdx] });
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drawing || !current) return;
    const pos = relPos(e);
    setCurrent(c => c ? {
      ...c,
      w: pos.x - drawing.x,
      h: pos.y - drawing.y,
    } : c);
  }

  function onMouseUp() {
    if (!current || !drawing) return;
    const w = current.w ?? 0;
    const h = current.h ?? 0;
    if (Math.abs(w) < 1 || Math.abs(h) < 1) { setDrawing(null); setCurrent(null); return; }
    const ann: Annotation = {
      id:    uid(),
      x:     w < 0 ? (current.x ?? 0) + w : (current.x ?? 0),
      y:     h < 0 ? (current.y ?? 0) + h : (current.y ?? 0),
      w:     Math.abs(w),
      h:     Math.abs(h),
      note:  "",
      color: current.color ?? COLORS[0],
    };
    setAnnotations(a => [...a, ann]);
    setEditId(ann.id);
    setDrawing(null);
    setCurrent(null);
  }

  const updateNote = useCallback((id: string, note: string) => {
    setAnnotations(a => a.map(ann => ann.id === id ? { ...ann, note } : ann));
  }, []);

  const remove = useCallback((id: string) => {
    setAnnotations(a => a.filter(ann => ann.id !== id));
    setEditId(null);
  }, []);

  return (
    <div className="annotationTool">
      <div className="annotationControls">
        <span>Colour:</span>
        {COLORS.map((c, i) => (
          <button
            key={c}
            type="button"
            className={`colorSwatch ${i === colorIdx ? "active" : ""}`}
            style={{ background: c }}
            onClick={() => setColorIdx(i)}
          />
        ))}
        <span className="annotationHint">Click and drag on the image to mark a region.</span>
      </div>

      <div
        ref={containerRef}
        className="annotationCanvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <img src={imageSrc} alt="Annotate" draggable={false} />

        {/* completed annotations */}
        {annotations.map(ann => (
          <div
            key={ann.id}
            className="annotationBox"
            style={{
              left:   `${ann.x}%`,
              top:    `${ann.y}%`,
              width:  `${ann.w}%`,
              height: `${ann.h}%`,
              borderColor: ann.color,
              boxShadow: `0 0 0 1px ${ann.color}44`,
            }}
            onClick={() => setEditId(ann.id === editId ? null : ann.id)}
          >
            {ann.note && (
              <span className="annotationLabel" style={{ background: ann.color }}>
                {ann.note}
              </span>
            )}
          </div>
        ))}

        {/* in-progress rect */}
        {current && drawing && (
          <div
            className="annotationBox drawing"
            style={{
              left:   `${Math.min(drawing.x, drawing.x + (current.w ?? 0))}%`,
              top:    `${Math.min(drawing.y, drawing.y + (current.h ?? 0))}%`,
              width:  `${Math.abs(current.w ?? 0)}%`,
              height: `${Math.abs(current.h ?? 0)}%`,
              borderColor: current.color,
            }}
          />
        )}
      </div>

      {/* note editor */}
      {editId && (() => {
        const ann = annotations.find(a => a.id === editId);
        if (!ann) return null;
        return (
          <div className="annotationEditor">
            <input
              autoFocus
              placeholder="Add a note for this region…"
              value={ann.note}
              onChange={e => updateNote(ann.id, e.target.value)}
            />
            <button type="button" onClick={() => remove(ann.id)}>
              <Trash2 size={15} />
            </button>
            <button type="button" className="doneBtn" onClick={() => setEditId(null)}>Done</button>
          </div>
        );
      })()}

      {annotations.length > 0 && (
        <ul className="annotationList">
          {annotations.map((ann, i) => (
            <li key={ann.id}>
              <span className="annDot" style={{ background: ann.color }} />
              <strong>Region {i + 1}</strong>
              {ann.note && <span> — {ann.note}</span>}
              <button type="button" onClick={() => remove(ann.id)}><Trash2 size={13} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
