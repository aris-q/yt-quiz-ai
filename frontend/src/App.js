import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API = 'http://127.0.0.1:8000';

function App() {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('quiz');

  const videoId = new URLSearchParams(window.location.search).get('v');

  useEffect(() => {
    if (!isAuthenticated || !videoId) return;
    setQuizLoading(true);
    fetch(`${API}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, num_questions: 5 })
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.detail || `Error ${r.status}. Please try again.`);
        } else if (data.questions) {
          setQuestions(data.questions);
        } else {
          setError(data.detail || 'Failed to load quiz.');
        }
        setQuizLoading(false);
      })
      .catch(() => { setError('Could not connect to backend. Make sure it is running on port 8000.'); setQuizLoading(false); });
  }, [isAuthenticated, videoId]);

  useEffect(() => {
    if (!isAuthenticated || !videoId) return;
    fetch(`${API}/quiz/history/${videoId}`)
      .then(r => r.json())
      .then(data => setHistory(data.attempts || []));
  }, [isAuthenticated, videoId, done]);

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
  };

  const handleNext = () => {
    const isCorrect = selected === questions[current].answer;
    const newScore = isCorrect ? score + 1 : score;

    if (current + 1 >= questions.length) {
      fetch(`${API}/quiz/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, score: newScore, total: questions.length, user_email: user.email })
      });
      setScore(newScore);
      setDone(true);
      return;
    }
    setScore(newScore);
    setCurrent(c => c + 1);
    setSelected(null);
  };

  const reset = () => { setCurrent(0); setSelected(null); setScore(0); setDone(false); setTab('quiz'); };

  if (isLoading) return <div style={s.center}><p>Loading...</p></div>;

  if (!isAuthenticated) return (
    <div style={s.center}>
      <div style={s.card}>
        <h2 style={{marginBottom:8}}>YT Quiz AI</h2>
        <p style={{color:'#666', marginBottom:24, fontSize:14}}>Sign in to take AI-generated quizzes on any YouTube video.</p>
        <button style={s.btn} onClick={() => loginWithRedirect()}>Sign in</button>
      </div>
    </div>
  );

  if (quizLoading) return (
    <div style={s.center}>
      <div style={s.card}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
          <span style={{fontSize:13, color:'#888'}}>Signed in as {user.email}</span>
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin }})} style={s.btnSmall}>Sign out</button>
        </div>
        <p>Generating quiz...</p>
      </div>
    </div>
  );

  if (error) return <div style={s.center}><p style={{color:'red'}}>{error}</p></div>;

  const q = questions[current];
  const keys = ['A','B','C','D'];

  return (
    <div style={s.center}>
      <div style={s.card}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
          <span style={{fontSize:13, color:'#888'}}>{user.email}</span>
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin }})} style={s.btnSmall}>Sign out</button>
        </div>

        <div style={s.tabs}>
          {['quiz','history'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{...s.tab, ...(tab===t ? s.tabActive : {})}}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'history' && (
          <div>
            <p style={{color:'#888',fontSize:13,marginBottom:12}}>Past attempts</p>
            {history.length === 0 && <p style={{color:'#aaa'}}>No attempts yet.</p>}
            {history.map((a, i) => (
              <div key={i} style={s.historyRow}>
                <span style={{fontSize:13}}>{new Date(a.created_at).toLocaleString()}</span>
                <span style={{fontWeight:600, color: a.score/a.total >= 0.7 ? '#0f9d58' : '#d93025'}}>
                  {a.score}/{a.total}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'quiz' && !done && q && (
          <>
            <p style={{color:'#888',fontSize:13,marginBottom:8}}>Question {current+1} of {questions.length}</p>
            <div style={s.progress}><div style={{...s.bar, width:`${(current/questions.length)*100}%`}}/></div>
            <p style={{fontWeight:600,fontSize:16,margin:'16px 0'}}>{q.question}</p>
            {q.options.map((opt, i) => {
              let bg = '#f5f5f5';
              if (selected !== null) {
                if (i === q.answer) bg = '#d4edda';
                else if (i === selected) bg = '#f8d7da';
              }
              return (
                <div key={i} onClick={() => handleSelect(i)} style={{...s.option, background: bg, cursor: selected ? 'default' : 'pointer'}}>
                  <span style={s.key}>{keys[i]}</span> {opt}
                </div>
              );
            })}
            {selected !== null && (
              <div style={s.explanation}>
                <strong>{selected === q.answer ? '✓ Correct!' : '✗ Incorrect.'}</strong> {q.explanation}
              </div>
            )}
            {selected !== null && (
              <button style={s.btn} onClick={handleNext}>
                {current + 1 >= questions.length ? 'Finish' : 'Next →'}
              </button>
            )}
          </>
        )}

        {tab === 'quiz' && done && (
          <div style={{textAlign:'center'}}>
            <h2>Quiz Complete</h2>
            <p style={{fontSize:32,fontWeight:600}}>{score}/{questions.length}</p>
            <p style={{color:'#666'}}>{score === questions.length ? 'Perfect!' : score >= questions.length/2 ? 'Good job!' : 'Keep practicing!'}</p>
            <button style={s.btn} onClick={reset}>Retry</button>
            <button style={{...s.btn, background:'#f5f5f5', color:'#333', marginTop:8}} onClick={() => setTab('history')}>View History</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  center: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f2f5', fontFamily:'sans-serif' },
  card: { background:'white', borderRadius:12, padding:28, width:'100%', maxWidth:560, boxShadow:'0 2px 12px rgba(0,0,0,0.1)' },
  tabs: { display:'flex', gap:8, marginBottom:20 },
  tab: { padding:'6px 16px', borderRadius:20, border:'1px solid #ddd', background:'none', cursor:'pointer', fontSize:13 },
  tabActive: { background:'#1a56db', color:'white', borderColor:'#1a56db' },
  progress: { height:4, background:'#eee', borderRadius:2, marginBottom:4 },
  bar: { height:4, background:'#1a56db', borderRadius:2, transition:'width .3s' },
  option: { padding:'10px 14px', borderRadius:8, marginBottom:8, border:'1px solid #ddd', display:'flex', alignItems:'center', gap:10 },
  key: { width:24, height:24, background:'#eee', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, flexShrink:0 },
  explanation: { background:'#f8f9fa', borderLeft:'3px solid #1a56db', padding:'10px 14px', borderRadius:'0 8px 8px 0', fontSize:14, margin:'12px 0' },
  btn: { width:'100%', padding:10, background:'#1a56db', color:'white', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer', marginTop:8 },
  btnSmall: { padding:'4px 12px', fontSize:12, background:'none', border:'1px solid #ddd', borderRadius:6, cursor:'pointer' },
  historyRow: { display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#f8f9fa', borderRadius:8, marginBottom:8 }
};

export default App;