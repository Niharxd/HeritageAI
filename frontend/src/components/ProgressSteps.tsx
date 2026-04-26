import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

const STEPS = ["Detecting", "Enhancing", "Interpreting", "Predicting", "Explaining"];
const STEP_MS = 1800;

export function ProgressSteps({ active }: { active: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) { setCurrent(0); return; }
    setCurrent(0);
    const interval = setInterval(() => {
      setCurrent(c => {
        if (c >= STEPS.length - 1) { clearInterval(interval); return c; }
        return c + 1;
      });
    }, STEP_MS);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="progressSteps">
      {STEPS.map((step, i) => (
        <div key={step} className={`progressStep ${i < current ? "done" : i === current ? "active" : ""}`}>
          <div className="progressIcon">
            {i < current
              ? <CheckCircle size={14} />
              : i === current
              ? <Loader2 size={14} className="spin" />
              : <span className="progressDot" />
            }
          </div>
          <span>{step}</span>
          {i < STEPS.length - 1 && <div className="progressLine" />}
        </div>
      ))}
    </div>
  );
}
