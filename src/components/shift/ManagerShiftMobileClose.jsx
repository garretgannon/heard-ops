import { Check, CheckCircle2, ClipboardCheck, MessageSquareText, Trophy, Camera, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManagerShiftMobileClose({
  debriefItems, debriefReviews, updateDebriefReview, debriefCompleteCount,
  handoffNotes, setHandoffNotes, submitting, completeHandoff,
  closeFilterTab, setCloseFilterTab,
}) {
  const closeTabDefs = [
    { id: 'all',                    label: 'All',       count: debriefItems.length },
    { id: 'Issues',                 label: 'Issues',    count: debriefItems.filter(i => i.group === 'Issues').length },
    { id: 'Logs Created This Shift',label: 'Logs',      count: debriefItems.filter(i => i.group === 'Logs Created This Shift').length },
    { id: "86'd Items",             label: '86 Items',  count: debriefItems.filter(i => i.group === "86'd Items").length },
  ];
  const visibleDebriefItems = closeFilterTab === 'all' ? debriefItems : debriefItems.filter(i => i.group === closeFilterTab);

  return (
    <div className="lg:hidden space-y-3">
      {/* Scorecard */}
      <div className="grid grid-cols-3 divide-x divide-border/20 overflow-hidden rounded-2xl border border-border/40"
        style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}>
        {[
          { label: "REQUIRED",   sub: "Items needing review",    value: debriefItems.length,                                                            color: debriefItems.length > 0 ? "text-primary" : "text-green-400" },
          { label: "REVIEWED",   sub: "Resolved or cleared",     value: `${debriefCompleteCount}/${debriefItems.length}`,                               color: debriefCompleteCount === debriefItems.length ? "text-green-400" : "text-foreground" },
          { label: "FOLLOW-UPS", sub: "Needs next-shift action", value: debriefItems.filter(i => debriefReviews[i.key]?.status === "follow_up").length, color: "text-amber-400" },
        ].map(({ label, sub, value, color }) => (
          <div key={label} className="flex flex-col items-center justify-center gap-0 px-1 py-3 text-center">
            <p className={cn("text-2xl font-black tabular-nums", color)}>{value}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground leading-tight mt-0.5">{label}</p>
            <p className="text-[9px] text-muted-foreground/60 leading-tight mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Required Close Review */}
      <div className="overflow-hidden rounded-2xl border border-border/40"
        style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}>
        <div className="flex items-start gap-2.5 px-4 pt-4 pb-3">
          <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-black text-foreground">Required Close Review</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Resolve or clear every item before completing sign-off.</p>
          </div>
        </div>
        <div className="border-t border-border/20 flex overflow-x-auto">
          {closeTabDefs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setCloseFilterTab(tab.id)}
              className={cn("flex-shrink-0 px-3 py-2 text-[10px] font-black whitespace-nowrap transition-colors",
                closeFilterTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground/60 border-b border-border/20"
              )}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className="divide-y divide-border/15">
          {visibleDebriefItems.length === 0 ? (
            <div className="px-4 py-4">
              <p className="text-sm font-black text-green-400">No items in this category.</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Clear to proceed to sign-off.</p>
            </div>
          ) : visibleDebriefItems.map(item => {
            const review = debriefReviews[item.key] || {};
            const needsNote = item.requiresNote || review.status === "follow_up";
            const noteLen = (review.note || "").length;
            return (
              <div key={item.key} className="px-4 py-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">{item.group}</p>
                    <p className="text-sm font-black text-foreground leading-snug">{item.title}</p>
                    {item.meta && <p className="text-xs text-muted-foreground mt-0.5">{item.meta}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] font-black border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground">Open</span>
                    {review.status && <CheckCircle2 className={cn("h-3.5 w-3.5", review.status === "follow_up" ? "text-amber-400" : "text-green-400")} />}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => updateDebriefReview(item.key, { status: "no_follow_up", requiresNote: item.requiresNote })}
                    className={cn("rounded-lg border px-3 py-2 text-xs font-black transition-all",
                      review.status === "no_follow_up" ? "border-green-500/40 bg-green-500/12 text-green-400" : "border-border/40 text-muted-foreground"
                    )}>No Follow-Up</button>
                  <button type="button"
                    onClick={() => updateDebriefReview(item.key, { status: "follow_up", requiresNote: true })}
                    className={cn("rounded-lg border px-3 py-2 text-xs font-black transition-all",
                      review.status === "follow_up" ? "border-amber-500/40 bg-amber-500/12 text-amber-400" : "border-border/40 text-muted-foreground"
                    )}>Follow-Up Needed</button>
                </div>
                {(review.status || item.requiresNote) && (
                  <div className="space-y-1.5">
                    <textarea
                      value={review.note || ""}
                      onChange={e => updateDebriefReview(item.key, { note: e.target.value, requiresNote: needsNote })}
                      rows={2} maxLength={500}
                      placeholder="Resolution or next action required..."
                      className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/50"><Camera className="h-3.5 w-3.5" /></button>
                        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/50"><Mic className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className={cn("text-[10px] font-bold", noteLen > 450 ? "text-amber-400" : "text-muted-foreground/50")}>{noteLen}/500</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Handoff notes */}
      <div className="overflow-hidden rounded-2xl border border-border/40"
        style={{ background: "linear-gradient(160deg, rgba(11,17,24,0.98) 0%, rgba(6,9,13,0.98) 100%)" }}>
        <div className="flex items-start gap-2.5 px-4 pt-4 pb-3">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-black text-foreground">Handoff to Next Manager</p>
            <p className="mt-0.5 text-xs text-muted-foreground">What does the next manager need to know? +50 XP on submit.</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <textarea
            value={handoffNotes}
            onChange={e => setHandoffNotes(e.target.value)}
            rows={5}
            placeholder="Open items, guest issues, staffing notes, anything to watch…"
            className="w-full rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <button type="button" onClick={completeHandoff} disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-white disabled:opacity-60 active:scale-[0.98] transition-all"
        style={{ background: "linear-gradient(135deg, hsl(22,76%,44%) 0%, hsl(22,76%,36%) 100%)", boxShadow: "0 0 0 1px rgba(230,106,31,0.35), 0 0 24px rgba(230,106,31,0.25), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
        <Trophy className="h-5 w-5" />
        {submitting ? "Saving…" : "Complete Sign-Off — +50 XP"}
      </button>
    </div>
  );
}