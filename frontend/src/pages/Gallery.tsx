import { useEffect, useRef, useState } from "react";
import { Trash2, ScanSearch, TrendingUp, Plus, Tag, Bell, X, Search, Download, Filter } from "lucide-react";
import {
  addToGroup, createGroup, deleteGroup, deleteRecord,
  getGroups, getGroupTimeline, getHistory, getTrend,
  removeFromGroup, saveNotes, getSettings, updateSettings, exportZip
} from "../api";
import { TrendChart } from "../components/TrendChart";
import type { ArtifactGroup, HistoryRecord, TimelinePoint, TrendPoint } from "../types";

const riskColor = { LOW: "#2d5a27", MEDIUM: "#b8860b", HIGH: "#8b1a1a" };

export function Gallery({ onOpen }: { onOpen: (id: string) => void }) {
  const [records, setRecords]       = useState<HistoryRecord[]>([]);
  const [trend,   setTrend]         = useState<TrendPoint[]>([]);
  const [groups,  setGroups]        = useState<ArtifactGroup[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showTrend, setShowTrend]   = useState(false);
  const [threshold, setThreshold]   = useState(70);
  const [editNotes, setEditNotes]   = useState<string | null>(null);
  const [notesVal,  setNotesVal]    = useState("");
  const [groupModal, setGroupModal] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [timeline, setTimeline]     = useState<{ group: ArtifactGroup; points: TimelinePoint[] } | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Search / filter state
  const [search,    setSearch]    = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  async function loadRecords() {
    const h = await getHistory({ search, risk_level: riskFilter, domain: domainFilter, date_from: dateFrom, date_to: dateTo });
    setRecords(h.reverse());
  }

  useEffect(() => {
    Promise.all([loadRecords(), getTrend(), getGroups(), getSettings()])
      .then(([, t, g, s]) => {
        setTrend(t);
        setGroups(g);
        setThreshold(s.alert_threshold ?? 70);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRecords(); }, [search, riskFilter, domainFilter, dateFrom, dateTo]);

  async function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteRecord(id);
    setRecords(r => r.filter(x => x.id !== id));
  }

  async function saveNote(id: string) {
    await saveNotes(id, notesVal);
    setRecords(r => r.map(x => x.id === id ? { ...x, notes: notesVal } : x));
    setEditNotes(null);
  }

  async function handleThreshold(val: number) {
    setThreshold(val);
    await updateSettings({ alert_threshold: val });
    loadRecords();
  }

  async function handleExportZip() {
    const ids = selected.size > 0 ? Array.from(selected) : records.map(r => r.id);
    if (!ids.length) return;
    setExporting(true);
    try {
      const blob = await exportZip(ids);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "heritage_export.zip"; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const g = await createGroup(newGroupName.trim());
    setGroups(gs => [...gs, g]);
    setNewGroupName("");
  }

  async function handleAddToGroup(groupId: string, recordId: string) {
    await addToGroup(groupId, recordId);
    setGroups(gs => gs.map(g => g.id === groupId
      ? { ...g, record_ids: [...new Set([...g.record_ids, recordId])] }
      : g));
    setGroupModal(null);
  }

  async function handleRemoveFromGroup(groupId: string, recordId: string) {
    await removeFromGroup(groupId, recordId);
    setGroups(gs => gs.map(g => g.id === groupId
      ? { ...g, record_ids: g.record_ids.filter(r => r !== recordId) }
      : g));
  }

  async function handleDeleteGroup(id: string) {
    await deleteGroup(id);
    setGroups(gs => gs.filter(g => g.id !== id));
    if (timeline?.group.id === id) setTimeline(null);
  }

  async function openTimeline(group: ArtifactGroup) {
    const points = await getGroupTimeline(group.id);
    setTimeline({ group, points });
  }

  if (loading) return <div className="galleryEmpty"><p>Loading archive…</p></div>;

  return (
    <div className="galleryPage">
      {/* Header */}
      <div className="galleryHeader">
        <div>
          <h2>Artifact Archive</h2>
          <p>{records.length} record{records.length !== 1 ? "s" : ""} stored</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="secondaryButton" onClick={() => setShowFilter(f => !f)}>
            <Filter size={16} />{showFilter ? "Hide Filters" : "Filter"}
          </button>
          <button type="button" className="secondaryButton" onClick={handleExportZip} disabled={exporting}>
            <Download size={16} />{exporting ? "Exporting…" : selected.size > 0 ? `ZIP (${selected.size})` : "ZIP All"}
          </button>
          <button type="button" className="secondaryButton" onClick={() => setShowTrend(t => !t)}>
            <TrendingUp size={16} />{showTrend ? "Hide Trend" : "Show Trend"}
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="gallerySearchRow">
        <div className="gallerySearchInput">
          <Search size={15} />
          <input
            placeholder="Search by domain, notes, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button type="button" onClick={() => setSearch("")}><X size={13} /></button>}
        </div>
      </div>

      {showFilter && (
        <div className="galleryFilters">
          <div className="filterGroup">
            <label>Risk Level</label>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
              <option value="">All</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div className="filterGroup">
            <label>Domain</label>
            <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
              <option value="">All</option>
              <option value="manuscript">Manuscript</option>
              <option value="monument">Monument</option>
            </select>
          </div>
          <div className="filterGroup">
            <label>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="filterGroup">
            <label>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button type="button" className="secondaryButton" style={{ alignSelf: "flex-end", minHeight: 36, fontSize: 12 }}
            onClick={() => { setRiskFilter(""); setDomainFilter(""); setDateFrom(""); setDateTo(""); }}>
            Clear
          </button>
        </div>
      )}

      {/* Alert threshold */}
      <div className="alertThreshold">
        <Bell size={15} />
        <span>Alert when risk score exceeds</span>
        <input
          type="number" min={0} max={100} value={threshold}
          onChange={e => handleThreshold(Number(e.target.value))}
          className="thresholdInput"
        />
        <span>/ 100</span>
        <span className="thresholdNote">Records above this threshold are highlighted in red.</span>
      </div>

      {/* Trend */}
      {showTrend && (
        <div className="panel trendPanel">
          <div className="panelHeader"><h3>Damage &amp; Risk Trend</h3></div>
          <div style={{ padding: "16px" }}><TrendChart points={trend} /></div>
        </div>
      )}

      {/* Artifact Groups */}
      <div className="groupsSection">
        <div className="groupsSectionHeader">
          <h3>Artifact Groups</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="groupNameInput"
              placeholder="New group name…"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreateGroup()}
            />
            <button type="button" className="primaryButton" style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
              onClick={handleCreateGroup}>
              <Plus size={14} /> Create
            </button>
          </div>
        </div>
        {groups.length === 0
          ? <p className="groupsEmpty">No groups yet. Create one to track the same artifact over time.</p>
          : (
            <div className="groupsList">
              {groups.map(g => (
                <div key={g.id} className="groupCard">
                  <div className="groupCardHeader">
                    <strong>{g.name}</strong>
                    <span>{g.record_ids.length} artifact{g.record_ids.length !== 1 ? "s" : ""}</span>
                    <button type="button" className="groupTimelineBtn" onClick={() => openTimeline(g)}>
                      Timeline
                    </button>
                    <button type="button" className="groupDeleteBtn" onClick={() => handleDeleteGroup(g.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {g.record_ids.length > 0 && (
                    <div className="groupThumbs">
                      {g.record_ids.map(rid => {
                        const rec = records.find(r => r.id === rid);
                        return rec ? (
                          <div key={rid} className="groupThumb">
                            <img src={rec.thumbnail} alt="" onClick={() => onOpen(rid)} />
                            <button type="button" onClick={() => handleRemoveFromGroup(g.id, rid)}>
                              <X size={10} />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Timeline modal */}
      {timeline && (
        <div className="timelineModal">
          <div className="timelineModalHeader">
            <h3>{timeline.group.name} — Deterioration Timeline</h3>
            <button type="button" onClick={() => setTimeline(null)}><X size={18} /></button>
          </div>
          {timeline.points.length < 2
            ? <p className="timelineEmpty">Add at least 2 analyses to this group to see a timeline.</p>
            : (
              <div className="timelineTrack">
                {timeline.points.map((p, i) => (
                  <div key={p.id} className="timelinePoint">
                    <img src={p.thumbnail} alt="" onClick={() => onOpen(p.id)} />
                    <div className="timelineMeta">
                      <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                      <strong style={{ color: riskColor[p.risk_level] }}>
                        {p.risk_level} {p.risk_score.toFixed(1)}
                      </strong>
                      <span>Sev: {p.severity.toFixed(1)}</span>
                    </div>
                    {i < timeline.points.length - 1 && (
                      <div className={`timelineArrow ${
                        timeline.points[i+1].severity > p.severity ? "worse" : "better"
                      }`}>›</div>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Gallery grid */}
      {records.length === 0 ? (
        <div className="galleryEmpty">
          <ScanSearch size={40} />
          <p>No analyses yet. Upload an artifact to begin.</p>
        </div>
      ) : (
        <div className="galleryGrid">
          {records.map(r => (
            <div key={r.id} className={`galleryCard ${r.alert ? "galleryAlert" : ""} ${selected.has(r.id) ? "gallerySelected" : ""}`}
              onClick={() => onOpen(r.id)}>
              <div className="galleryThumb">
                <img src={r.thumbnail} alt="Artifact thumbnail" />
                <span className="galleryRiskBadge"
                  style={{ background: riskColor[r.risk?.level ?? "LOW"] }}>
                  {r.risk?.level ?? "—"}
                </span>
                {r.alert && <span className="alertBadge">!</span>}
              </div>
              <div className="galleryCardBody">
                <p className="galleryDomain">{r.domain.toUpperCase()}</p>
                <p className="galleryEra">{r.age?.estimated_age ?? "—"}</p>
                <div className="galleryMeta">
                  <span>Severity: <strong>{r.severity?.toFixed(1)}</strong></span>
                  <span>Score: <strong>{r.risk?.score?.toFixed(1)}</strong></span>
                </div>
                {r.notes && <p className="galleryNotePreview">{r.notes}</p>}
                <p className="galleryDate">{new Date(r.timestamp).toLocaleString()}</p>
              </div>

              {/* Action buttons */}
              <div className="galleryActions" onClick={e => e.stopPropagation()}>
                <button type="button" title="Select for ZIP"
                  onClick={e => toggleSelect(r.id, e)}
                  style={{ color: selected.has(r.id) ? "var(--gold-bright)" : undefined }}>
                  {selected.has(r.id) ? "☑" : "☐"}
                </button>
                <button type="button" title="Add note"
                  onClick={() => { setEditNotes(r.id); setNotesVal(r.notes ?? ""); }}>
                  ✎
                </button>
                <button type="button" title="Add to group"
                  onClick={() => setGroupModal(r.id)}>
                  <Tag size={13} />
                </button>
                <button type="button" title="Delete" onClick={e => remove(r.id, e)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes editor */}
      {editNotes && (
        <div className="notesOverlay" onClick={() => setEditNotes(null)}>
          <div className="notesModal" onClick={e => e.stopPropagation()}>
            <h3>Conservator Notes</h3>
            <textarea
              ref={notesRef}
              autoFocus
              value={notesVal}
              onChange={e => setNotesVal(e.target.value)}
              placeholder="Write your field notes, observations, or conservation remarks…"
            />
            <div className="notesActions">
              <button type="button" className="secondaryButton" onClick={() => setEditNotes(null)}>Cancel</button>
              <button type="button" className="primaryButton" onClick={() => saveNote(editNotes)}>Save Notes</button>
            </div>
          </div>
        </div>
      )}

      {/* Group picker */}
      {groupModal && (
        <div className="notesOverlay" onClick={() => setGroupModal(null)}>
          <div className="notesModal" onClick={e => e.stopPropagation()}>
            <h3>Add to Artifact Group</h3>
            {groups.length === 0
              ? <p style={{ color: "var(--ink-muted)", fontStyle: "italic" }}>
                  No groups yet. Create one in the groups section above.
                </p>
              : (
                <div className="groupPickerList">
                  {groups.map(g => (
                    <button key={g.id} type="button" className="groupPickerItem"
                      onClick={() => handleAddToGroup(g.id, groupModal)}>
                      <strong>{g.name}</strong>
                      <span>{g.record_ids.length} artifact{g.record_ids.length !== 1 ? "s" : ""}</span>
                    </button>
                  ))}
                </div>
              )
            }
            <button type="button" className="secondaryButton" style={{ marginTop: 12 }}
              onClick={() => setGroupModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
