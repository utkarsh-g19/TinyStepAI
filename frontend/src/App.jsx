import { useState } from "react";

export default function App() {
  const [task, setTask] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  function toggleTask(index) {
    setPlan((currentPlan) => {
      if (!currentPlan) return currentPlan;

      return {
        ...currentPlan,
        tasks: currentPlan.tasks.map((task, i) =>
          i === index ? { ...task, completed: !task.completed } : task,
        ),
      };
    });
  }
  async function generatePlan(event) {
    event.preventDefault(); // to prevent normal behavior of form (event which triggered the function) through which they reload the page

    if (!task.trim()) return;

    setLoading(true);
    setError("");
    setPlan("");

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task }),
      });

      const raw = await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          `Backend returned invalid JSON. HTTP ${response.status}. Response: ${
            raw || "(empty response)"
          }`,
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate a plan.");
      }

      setPlan({
        ...data.plan,
        tasks: data.plan.tasks.map((task) => ({
          ...task,
          completed: false,
        })),
      });
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Your personal AI planner
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          TinyStep<span className="text-emerald-400"> AI</span>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Big goals can feel overwhelming. Break them into small, actionable
          steps with your own local AI.
        </p>

        <form
          onSubmit={generatePlan}
          className="mt-10 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8"
        >
          <label
            htmlFor="task"
            className="mb-3 block font-medium text-slate-200"
          >
            What do you want to accomplish?
          </label>

          <textarea
            id="task"
            rows={4}
            value={task}
            onChange={(event) => setTask(event.target.value)}
            placeholder="Example: Learn React and build a project in 7 days..."
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />

          <button
            type="submit"
            disabled={loading || !task.trim()}
            className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-4 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating your plan..." : "Break it into tiny steps →"}
          </button>
        </form>

        {loading && (
          <p className="mt-6 text-center text-slate-400">
            Gemma is thinking. This may take a little while...
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {plan && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-slate-900 p-6">
            <h2 className="mb-3 text-2xl font-bold text-emerald-400">
              {plan.title}
            </h2>

            <p className="mb-6 text-slate-300">{plan.description}</p>
            <div className="mb-6 mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">Your progress</span>
                <span className="text-emerald-400">
                  {plan.tasks.filter((task) => task.completed).length}
                  {" / "}
                  {plan.tasks.length} completed
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${
                      (plan.tasks.filter((task) => task.completed).length /
                        plan.tasks.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-4">
              {plan.tasks.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-xl border p-4 ${
                    item.completed
                      ? "border-emerald-500/50 bg-emerald-950/20"
                      : "border-slate-700"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleTask(index)}
                      className="mt-1 h-5 w-5 accent-emerald-500"
                    />

                    <div>
                      <h3
                        className={`font-semibold ${
                          item.completed
                            ? "text-slate-400 line-through"
                            : "text-white"
                        }`}
                      >
                        {index + 1}. {item.description}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        Estimated time: {item.duration_minutes} minutes
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-slate-800 p-4">
              <h3 className="font-semibold text-emerald-400">
                Your first action
              </h3>

              <p className="mt-2 text-slate-200">{plan.first_action}</p>
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-slate-500">
          Powered by Gemma running locally through Ollama.
        </footer>
      </div>
    </main>
  );
}
