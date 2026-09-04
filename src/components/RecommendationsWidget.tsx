"use client";

import { useState, useEffect } from "react";
import { getRecommendationsAction, applyRecommendationAction, dismissRecommendationAction } from "../app/actions/recommendations";
import { AutomatedRecommendation } from "../features/recommendations/domain/entities/automated-recommendation";

export default function RecommendationsWidget() {
  const [recommendations, setRecommendations] = useState<AutomatedRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const recs = await getRecommendationsAction();
      setRecommendations(recs);
    } catch (e) {
      console.error("Failed to load recommendations", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id: string, actionRef: string) => {
    try {
      await applyRecommendationAction(id);
      setRecommendations(recs => recs.filter(r => r.id !== id));
    } catch (e) {
      console.error("Failed to apply recommendation", e);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissRecommendationAction(id);
      setRecommendations(recs => recs.filter(r => r.id !== id));
    } catch (e) {
      console.error("Failed to dismiss recommendation", e);
    }
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 30) return "MEDIUM";
    return "LOW";
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-100 dark:bg-red-900/30";
    if (score >= 60) return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
    if (score >= 30) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
  };

  if (loading) {
    return <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse h-48"></div>;
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Recommendations & Alerts</h2>
        <p className="text-slate-500 dark:text-slate-400">You are all caught up! No active recommendations at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Recommendations & Alerts</h2>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {recommendations.map(rec => (
          <div key={rec.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${getPriorityColor(rec.priorityScore)}`}>
                  {getPriorityLabel(rec.priorityScore)}
                </span>
                <span className="text-xs font-medium px-2 py-1 ml-2 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase">
                  {rec.type}
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Priority: {rec.priorityScore}
              </span>
            </div>

            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{rec.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{rec.description}</p>

            <div className="flex gap-3">
              <button
                onClick={() => handleApply(rec.id, rec.recommendedAction?.actionRef)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {rec.recommendedAction?.label || "Apply Recommendation"}
              </button>
              <button
                onClick={() => handleDismiss(rec.id)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
