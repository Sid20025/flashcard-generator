import { useState, useEffect } from "react";
import { Plus, Sparkles, Trash2, X, ArrowLeft, Check, XCircle, Brain, Target, TrendingUp, Layers, BarChart2, RotateCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const COLORS = [
  { grad: "from-violet-500 to-purple-600", accent: "#8b5cf6", light: "bg-violet-50", text: "text-violet-700" },
  { grad: "from-pink-500 to-rose-600", accent: "#ec4899", light: "bg-pink-50", text: "text-pink-700" },
  { grad: "from-cyan-500 to-blue-600", accent: "#06b6d4", light: "bg-cyan-50", text: "text-cyan-700" },
  { grad: "from-amber-500 to-orange-600", accent: "#f59e0b", light: "bg-amber-50", text: "text-amber-700" },
  { grad: "from-emerald-500 to-green-600", accent: "#10b981", light: "bg-emerald-50", text: "text-emerald-700" },
];
const SUBJECTS = ["Mathematics","Science","History","Literature","Programming","Biology","Chemistry","Physics","Geography","Languages"];

const SAMPLE_DECKS = [
  { id:"d1", name:"React Hooks", subject:"Programming", colorIdx:0, createdAt: new Date().toISOString(), cards:[
    { id:"c1", question:"What is useState?", answer:"A Hook that adds state to functional components. Returns [state, setState].", explanation:"useState is the most basic hook. Example: const [count, setCount] = useState(0). The first value is current state, the second is a function to update it.", difficulty:"Easy", nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null },
    { id:"c2", question:"What is useEffect?", answer:"A Hook that runs side effects after rendering, like fetching data or updating the DOM.", explanation:"useEffect runs after every render by default. Pass [] as second arg to run only once on mount. Pass [dep] to run when dep changes.", difficulty:"Easy", nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null },
    { id:"c3", question:"What is useCallback?", answer:"A Hook that memoizes a function so it isn't recreated every render unless deps change.", explanation:"Useful when passing callbacks to child components to prevent unnecessary re-renders. Example: const fn = useCallback(() => {}, [deps]);", difficulty:"Medium", nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null },
    { id:"c4", question:"What does useMemo do?", answer:"Memoizes an expensive computed value so it only recalculates when dependencies change.", explanation:"Example: const val = useMemo(() => expensiveCalc(a, b), [a, b]). Only recomputes when a or b changes.", difficulty:"Medium", nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null },
  ]},
  { id:"d2", name:"World History", subject:"History", colorIdx:3, createdAt: new Date().toISOString(), cards:[
    { id:"c5", question:"When did World War II end?", answer:"September 2, 1945", explanation:"WWII ended when Japan formally surrendered aboard the USS Missouri. The war in Europe ended in May 1945 with Germany's surrender.", difficulty:"Easy", nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null },
    { id:"c6", question:"What was the Renaissance?", answer:"A cultural rebirth in Europe (14th-17th century) with advances in art, science, and philosophy.", explanation:"Started in Italy and spread across Europe. Key figures: Leonardo da Vinci, Michelangelo, Galileo. Marked transition from Medieval to Modern era.", difficulty:"Medium", nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null },
    { id:"c7", question:"What caused the French Revolution?", answer:"Financial crisis, social inequality, Enlightenment ideas, and weak leadership under Louis XVI.", explanation:"The French Revolution (1789-1799) was fueled by poverty, unfair taxes, and Enlightenment ideas about liberty. The storming of the Bastille on July 14, 1789 marked the start.", difficulty:"Hard", nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null },
  ]},
];

function sm2(card, quality) {
  let { easeFactor, interval, reps } = card;
  if (quality >= 3) {
    interval = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * easeFactor);
    reps += 1;
  } else { reps = 0; interval = 1; }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return { ...card, easeFactor, interval, reps, nextReview: new Date(Date.now() + interval * 86400000).toISOString(), lastResult: quality >= 3 ? "correct" : "incorrect" };
}

function getDue(cards) { return cards.filter(c => new Date(c.nextReview) <= new Date()); }

function load(key, fb) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fb; } catch { return fb; } }

export default function FlashMind() {
  const [decks, setDecks] = useState(() => load("fm-decks", SAMPLE_DECKS));
  const [view, setView] = useState("home");
  const [deck, setDeck] = useState(null);
  const [quizMode, setQuizMode] = useState("flip");
  const [quizCards, setQuizCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showExp, setShowExp] = useState(false);
  const [mcOpts, setMcOpts] = useState([]);
  const [mcPicked, setMcPicked] = useState(null);
  const [showGen, setShowGen] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genNotes, setGenNotes] = useState("");
  const [genMode, setGenMode] = useState("topic");
  const [genCount, setGenCount] = useState(5);
  const [genDeckId, setGenDeckId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubject, setNewSubject] = useState(SUBJECTS[0]);
  const [suggested, setSuggested] = useState([]);

  useEffect(() => { localStorage.setItem("fm-decks", JSON.stringify(decks)); }, [decks]);

  const updateDeck = (id, fn) => setDecks(p => p.map(d => d.id === id ? fn(d) : d));

  const makeMC = (card, allCards) => {
    const wrong = allCards.filter(c => c.id !== card.id).sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.answer);
    setMcOpts([...wrong, card.answer].sort(() => Math.random() - 0.5));
  };

  const startQuiz = (d, mode) => {
    const due = getDue(d.cards);
    const cards = due.length > 0 ? due : [...d.cards].sort(() => Math.random() - 0.5);
    setQuizCards(cards); setIdx(0); setFlipped(false); setShowExp(false); setMcPicked(null);
    setDeck(d); setQuizMode(mode);
    if (mode === "mc") makeMC(cards[0], d.cards);
    setView("quiz");
  };

  const next = (quality) => {
    const updated = sm2(quizCards[idx], quality);
    updateDeck(deck.id, d => ({ ...d, cards: d.cards.map(c => c.id === updated.id ? updated : c) }));
    const next = idx + 1;
    if (next < quizCards.length) {
      setIdx(next); setFlipped(false); setShowExp(false); setMcPicked(null);
      if (quizMode === "mc") makeMC(quizCards[next], decks.find(d => d.id === deck.id).cards);
    } else { setView("deck"); setDeck(decks.find(d => d.id === deck.id)); }
  };

  const generate = async () => {
    setGenLoading(true);
    const input = genMode === "topic" ? `Generate ${genCount} flashcard Q&A pairs about "${genTopic}".` : `Generate ${genCount} flashcard Q&A pairs from these notes:\n${genNotes}`;
    const prompt = input + ` Also suggest 3 related topics. Reply ONLY with JSON, no markdown:\n{"cards":[{"question":"...","answer":"...","explanation":"...","difficulty":"Easy|Medium|Hard"}],"suggestedTopics":["a","b","c"]}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:2000, messages:[{role:"user",content:prompt}] }) });
      const data = await res.json();
      const text = data.content.map(i => i.type === "text" ? i.text : "").join("").replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(text);
      const newCards = parsed.cards.map(c => ({ ...c, id: Date.now().toString()+Math.random().toString(36).slice(2), nextReview: new Date().toISOString(), interval:1, easeFactor:2.5, reps:0, lastResult:null }));
      if (genDeckId) { updateDeck(genDeckId, d => ({ ...d, cards:[...d.cards, ...newCards] })); }
      else { setDecks(p => [...p, { id: Date.now().toString(), name: genTopic || "New Deck", subject: newSubject, colorIdx: Math.floor(Math.random()*COLORS.length), createdAt: new Date().toISOString(), cards: newCards }]); }
      setSuggested(parsed.suggestedTopics || []);
      setShowGen(false); setGenTopic(""); setGenNotes("");
    } catch(e) { alert("Error generating. Try again."); }
    setGenLoading(false);
  };

  const stats = { total: decks.reduce((s,d)=>s+d.cards.length,0), mastered: decks.reduce((s,d)=>s+d.cards.filter(c=>c.reps>=3).length,0), due: decks.reduce((s,d)=>s+getDue(d.cards).length,0) };
  stats.accuracy = stats.total > 0 ? Math.round((decks.reduce((s,d)=>s+d.cards.filter(c=>c.lastResult==="correct").length,0)/stats.total)*100) : 0;

  // ─── QUIZ VIEW ───
  if (view === "quiz") {
    const card = quizCards[idx];
    const c = COLORS[deck.colorIdx % COLORS.length];
    const progress = ((idx) / quizCards.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6 flex flex-col items-center">
        <div className="w-full max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setView("deck")} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
            <span className="text-sm text-gray-500">{idx+1} / {quizCards.length}</span>
            <div className="flex gap-2">
              <button onClick={() => { setQuizMode("flip"); setFlipped(false); setShowExp(false); setMcPicked(null); }} className={"px-3 py-1 rounded-lg text-xs font-medium " + (quizMode==="flip" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500")}>Flip</button>
              <button onClick={() => { setQuizMode("mc"); setFlipped(false); setShowExp(false); setMcPicked(null); makeMC(card, decks.find(d=>d.id===deck.id).cards); }} className={"px-3 py-1 rounded-lg text-xs font-medium " + (quizMode==="mc" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500")}>Multiple Choice</button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6"><div className={"h-1.5 rounded-full bg-gradient-to-r " + c.grad} style={{ width: progress+"%" }} /></div>

          {/* Flip Mode */}
          {quizMode === "flip" && (
            <div>
              <div onClick={() => setFlipped(!flipped)} className={"bg-white rounded-2xl shadow-lg border border-gray-100 p-8 cursor-pointer min-h-64 flex flex-col items-center justify-center text-center transition-all hover:shadow-xl"}>
                <span className={"text-xs font-semibold px-2 py-0.5 rounded-full mb-4 " + (flipped ? "bg-green-100 text-green-700" : c.light + " " + c.text)}>{flipped ? "Answer" : "Question"}</span>
                <p className={flipped ? "text-lg text-gray-800 font-medium" : "text-xl font-bold text-gray-800"}>{flipped ? card.answer : card.question}</p>
                {!flipped && <p className="text-gray-400 text-sm mt-6">Tap to reveal answer</p>}
                <span className={"text-xs mt-4 px-2 py-0.5 rounded " + (card.difficulty === "Easy" ? "bg-green-100 text-green-600" : card.difficulty === "Medium" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")}>{card.difficulty}</span>
              </div>
              {flipped && (
                <div className="mt-4">
                  <button onClick={() => setShowExp(!showExp)} className="w-full text-sm text-violet-600 hover:text-violet-800 mb-3 flex items-center justify-center gap-1">
                    <Brain className="w-4 h-4" /> {showExp ? "Hide" : "Show"} Explanation
                  </button>
                  {showExp && <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-800 mb-4">{card.explanation}</div>}
                  <div className="flex gap-3">
                    <button onClick={() => next(1)} className="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 font-medium flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> Didn't Know</button>
                    <button onClick={() => next(4)} className="flex-1 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-green-600 font-medium flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Got It</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MC Mode */}
          {quizMode === "mc" && (
            <div>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-4">
                <p className="text-xl font-bold text-gray-800 text-center">{card.question}</p>
                <span className={"text-xs mt-3 block text-center px-2 py-0.5 rounded w-fit mx-auto " + (card.difficulty === "Easy" ? "bg-green-100 text-green-600" : card.difficulty === "Medium" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")}>{card.difficulty}</span>
              </div>
              <div className="grid gap-3">
                {mcOpts.map((opt, i) => {
                  let cls = "bg-white border border-gray-200 hover:border-violet-400";
                  if (mcPicked !== null) {
                    if (opt === card.answer) cls = "bg-green-50 border-green-400";
                    else if (opt === mcPicked) cls = "bg-red-50 border-red-400";
                    else cls = "bg-white border border-gray-200 opacity-50";
                  }
                  return (
                    <button key={i} disabled={mcPicked !== null} onClick={() => { setMcPicked(opt); }} className={"rounded-xl p-4 text-left text-sm font-medium transition-all " + cls}>
                      <span className="text-gray-400 mr-2">{String.fromCharCode(65+i)}.</span> {opt}
                    </button>
                  );
                })}
              </div>
              {mcPicked !== null && (
                <div className="mt-4">
                  <button onClick={() => setShowExp(!showExp)} className="w-full text-sm text-violet-600 hover:text-violet-800 mb-3 flex items-center justify-center gap-1">
                    <Brain className="w-4 h-4" /> {showExp ? "Hide" : "Show"} Explanation
                  </button>
                  {showExp && <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm text-violet-800 mb-4">{card.explanation}</div>}
                  <button onClick={() => next(mcPicked === card.answer ? 4 : 1)} className={"w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r " + c.grad}>Next Card →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DECK DETAIL VIEW ───
  if (view === "deck" && deck) {
    const c = COLORS[deck.colorIdx % COLORS.length];
    const mastered = deck.cards.filter(cd => cd.reps >= 3).length;
    const due = getDue(deck.cards).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div className={"bg-gradient-to-r " + c.grad + " rounded-2xl p-6 text-white shadow-lg mb-6"}>
            <h2 className="text-2xl font-bold">{deck.name}</h2>
            <p className="opacity-80 text-sm mt-1">{deck.subject} • {deck.cards.length} cards</p>
            <div className="flex gap-4 mt-4">
              <div className="bg-white bg-opacity-20 rounded-xl px-4 py-2 text-center"><p className="text-xl font-bold">{mastered}</p><p className="text-xs opacity-80">Mastered</p></div>
              <div className="bg-white bg-opacity-20 rounded-xl px-4 py-2 text-center"><p className="text-xl font-bold">{due}</p><p className="text-xs opacity-80">Due</p></div>
              <div className="bg-white bg-opacity-20 rounded-xl px-4 py-2 text-center"><p className="text-xl font-bold">{deck.cards.length - mastered}</p><p className="text-xs opacity-80">Learning</p></div>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            <button onClick={() => startQuiz(deck, "flip")} className={"flex-1 py-2.5 text-white font-medium rounded-xl bg-gradient-to-r " + c.grad}>Flip Quiz {due > 0 ? `(${due} due)` : ""}</button>
            <button onClick={() => startQuiz(deck, "mc")} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50">Multiple Choice</button>
          </div>
          <div className="space-y-3">
            {deck.cards.map((card, i) => (
              <div key={card.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-gray-800 text-sm">{card.question}</p>
                  <span className={"text-xs px-2 py-0.5 rounded " + (card.difficulty === "Easy" ? "bg-green-100 text-green-600" : card.difficulty === "Medium" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")}>{card.difficulty}</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">{card.answer}</p>
                <div className="flex gap-2 mt-2">
                  <span className={"text-xs px-2 py-0.5 rounded-full " + (card.reps >= 3 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{card.reps >= 3 ? "Mastered" : "Learning"}</span>
                  <span className="text-xs text-gray-400">Next: {new Date(card.nextReview).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── STATS VIEW ───
  if (view === "stats") {
    const chartData = decks.map(d => ({ name: d.name, Mastered: d.cards.filter(c=>c.reps>=3).length, Learning: d.cards.filter(c=>c.reps<3).length }));
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Progress</h2>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { icon:<Layers className="w-5 h-5 text-violet-600"/>, label:"Total Cards", val:stats.total, bg:"bg-violet-50" },
              { icon:<Check className="w-5 h-5 text-green-600"/>, label:"Mastered", val:stats.mastered, bg:"bg-green-50" },
              { icon:<Target className="w-5 h-5 text-pink-600"/>, label:"Due Today", val:stats.due, bg:"bg-pink-50" },
              { icon:<TrendingUp className="w-5 h-5 text-cyan-600"/>, label:"Accuracy", val:stats.accuracy+"%", bg:"bg-cyan-50" },
            ].map((s,i) => (
              <div key={i} className={"rounded-2xl p-4 shadow-sm border border-white " + s.bg}>
                <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
                <p className="text-2xl font-bold text-gray-800">{s.val}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Deck Progress</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Mastered" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Learning" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
            <h3 className="font-semibold text-gray-700 mb-4">Cards by Difficulty</h3>
            <div className="flex gap-4">
              {["Easy","Medium","Hard"].map(d => {
                const count = decks.reduce((s,dk) => s + dk.cards.filter(c=>c.difficulty===d).length, 0);
                return (
                  <div key={d} className="flex-1 rounded-xl p-4 text-center" style={{ background: d==="Easy"?"#f0fdf4":d==="Medium"?"#fffbeb":"#fef2f2" }}>
                    <p className="text-2xl font-bold" style={{ color: d==="Easy"?"#16a34a":d==="Medium"?"#d97706":"#dc2626" }}>{count}</p>
                    <p className="text-xs text-gray-500 mt-1">{d}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── HOME VIEW ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text" style={{ WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FlashMind</h1>
            <p className="text-gray-500 mt-1">AI-powered flashcards with spaced repetition</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView("stats")} className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-600 shadow-sm"><BarChart2 className="w-4 h-4" /> Stats</button>
            <button onClick={() => setShowGen(true)} className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl hover:opacity-90 flex items-center gap-2 text-sm font-medium shadow-md"><Sparkles className="w-4 h-4" /> AI Generate</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { icon:<Layers className="w-5 h-5 text-violet-600"/>, label:"Total Cards", val:stats.total, bg:"bg-violet-50" },
            { icon:<Check className="w-5 h-5 text-green-600"/>, label:"Mastered", val:stats.mastered, bg:"bg-green-50" },
            { icon:<Target className="w-5 h-5 text-pink-600"/>, label:"Due Today", val:stats.due, bg:"bg-pink-50" },
            { icon:<TrendingUp className="w-5 h-5 text-cyan-600"/>, label:"Accuracy", val:stats.accuracy+"%", bg:"bg-cyan-50" },
          ].map((s,i) => (
            <div key={i} className={"rounded-2xl p-4 shadow-sm border border-white " + s.bg}>
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
              <p className="text-2xl font-bold text-gray-800">{s.val}</p>
            </div>
          ))}
        </div>

        {suggested.length > 0 && (
          <div className="bg-white rounded-2xl border border-purple-100 p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-purple-500" /><span className="text-sm font-semibold text-purple-600">AI Suggested Topics</span></div>
            <div className="flex gap-2 flex-wrap">
              {suggested.map((t,i) => (
                <button key={i} onClick={() => { setGenTopic(t); setGenMode("topic"); setShowGen(true); }} className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm rounded-lg border border-purple-200">{t} →</button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Your Decks</h2>
          <button onClick={() => setShowNewDeck(true)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 flex items-center gap-1 shadow-sm"><Plus className="w-4 h-4" /> New Deck</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(d => {
            const c = COLORS[d.colorIdx % COLORS.length];
            const due = getDue(d.cards).length;
            const mastered = d.cards.filter(cd => cd.reps >= 3).length;
            const progress = d.cards.length > 0 ? (mastered / d.cards.length) * 100 : 0;
            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className={"h-3 bg-gradient-to-r " + c.grad} />
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{d.name}</h3>
                      <span className={"text-xs px-2 py-0.5 rounded-full " + c.light + " " + c.text}>{d.subject}</span>
                    </div>
                    <button onClick={() => setDecks(p => p.filter(dk => dk.id !== d.id))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>{d.cards.length} cards</span>
                    <span>{mastered} mastered</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                    <div className={"h-2 rounded-full bg-gradient-to-r " + c.grad} style={{ width: progress+"%" }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setDeck(d); setView("deck"); }} className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-600 font-medium">View</button>
                    <button onClick={() => startQuiz(d, "flip")} className={"flex-1 px-3 py-2 text-white rounded-lg text-xs font-medium bg-gradient-to-r " + c.grad}>{due > 0 ? `Quiz (${due} due)` : "Quiz"}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Modal */}
      {showGen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowGen(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /><h2 className="text-lg font-bold text-gray-800">AI Generate Flashcards</h2></div>
              <button onClick={() => setShowGen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setGenMode("topic")} className={"flex-1 py-2 rounded-lg text-sm font-medium border " + (genMode==="topic" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500")}>By Topic</button>
                <button onClick={() => setGenMode("notes")} className={"flex-1 py-2 rounded-lg text-sm font-medium border " + (genMode==="notes" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500")}>From Notes</button>
              </div>
              {genMode === "topic" && (
                <div><label className="block text-xs text-gray-500 mb-1">Topic</label><input type="text" value={genTopic} onChange={e => setGenTopic(e.target.value)} placeholder="e.g. React Hooks, World War II..." className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500" /></div>
              )}
              {genMode === "notes" && (
                <div><label className="block text-xs text-gray-500 mb-1">Paste Your Notes</label><textarea value={genNotes} onChange={e => setGenNotes(e.target.value)} placeholder="Paste notes here..." rows={4} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none" /></div>
              )}
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Number of Cards</label>
                  <select value={genCount} onChange={e => setGenCount(Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500">
                    {[3,5,8,10,15].map(n => <option key={n} value={n}>{n} cards</option>)}
                  </select>
                </div>
                <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Add to Deck</label>
                  <select value={genDeckId} onChange={e => setGenDeckId(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500">
                    <option value="">Create New Deck</option>
                    {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              {!genDeckId && (
                <div><label className="block text-xs text-gray-500 mb-1">Subject</label>
                  <select value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowGen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
                <button onClick={generate} disabled={genLoading || (genMode==="topic" && !genTopic.trim()) || (genMode==="notes" && !genNotes.trim())} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {genLoading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Deck Modal */}
      {showNewDeck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowNewDeck(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">New Deck</h2>
              <button onClick={() => setShowNewDeck(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Deck Name</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Biology 101" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Subject</label>
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-violet-500">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewDeck(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
                <button onClick={() => { if(newName.trim()) { setDecks(p => [...p, { id: Date.now().toString(), name: newName.trim(), subject: newSubject, colorIdx: Math.floor(Math.random()*COLORS.length), createdAt: new Date().toISOString(), cards:[] }]); setNewName(""); setShowNewDeck(false); } }} className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-lg text-sm font-medium">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}