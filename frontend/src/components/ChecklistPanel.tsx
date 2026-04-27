import { useEffect, useState } from "react";
import { CheckSquare, Square, Plus, Trash2 } from "lucide-react";
import { getChecklist, updateChecklist } from "../api";

type Task = { task: string; done: boolean };

export function ChecklistPanel({ recordId }: { recordId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    getChecklist(recordId).then(setTasks).catch(() => {});
  }, [recordId]);

  async function toggle(i: number) {
    const updated = tasks.map((t, idx) => idx === i ? { ...t, done: !t.done } : t);
    setTasks(updated);
    await updateChecklist(recordId, updated);
  }

  async function addTask() {
    if (!newTask.trim()) return;
    const updated = [...tasks, { task: newTask.trim(), done: false }];
    setTasks(updated);
    setNewTask("");
    await updateChecklist(recordId, updated);
  }

  async function removeTask(i: number) {
    const updated = tasks.filter((_, idx) => idx !== i);
    setTasks(updated);
    await updateChecklist(recordId, updated);
  }

  const done = tasks.filter(t => t.done).length;

  return (
    <div className="checklistPanel">
      <div className="checklistProgress">
        <div className="checklistProgressBar">
          <div style={{ width: tasks.length ? `${(done / tasks.length) * 100}%` : "0%" }} />
        </div>
        <span>{done} / {tasks.length} complete</span>
      </div>
      <ul className="checklistItems">
        {tasks.map((t, i) => (
          <li key={i} className={t.done ? "checklistDone" : ""}>
            <button type="button" onClick={() => toggle(i)} className="checklistToggle">
              {t.done ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            <span>{t.task}</span>
            <button type="button" onClick={() => removeTask(i)} className="checklistDelete">
              <Trash2 size={12} />
            </button>
          </li>
        ))}
      </ul>
      <div className="checklistAdd">
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
          placeholder="Add task…"
        />
        <button type="button" onClick={addTask}><Plus size={14} /></button>
      </div>
    </div>
  );
}
