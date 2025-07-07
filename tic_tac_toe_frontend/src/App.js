import React, { useState, useEffect } from 'react';
import './App.css';

// App color palette (also defined in CSS): primary: #1976d2, secondary: #424242, accent: #ffeb3b

// ---- Utility Functions ----
function getInitialBoard() {
  // 3x3 array with nulls
  return Array(3).fill(null).map(() => Array(3).fill(null));
}
function getNextPlayer(board) {
  // X always goes first, then alternate
  const flat = board.flat();
  const xCount = flat.filter(x => x === 'X').length;
  const oCount = flat.filter(x => x === 'O').length;
  return xCount <= oCount ? 'X' : 'O';
}
function calculateWinner(board) {
  // Returns 'X', 'O', 'draw', or null
  const lines = [
    [ [0,0], [0,1], [0,2] ],
    [ [1,0], [1,1], [1,2] ],
    [ [2,0], [2,1], [2,2] ],
    [ [0,0], [1,0], [2,0] ],
    [ [0,1], [1,1], [2,1] ],
    [ [0,2], [1,2], [2,2] ],
    [ [0,0], [1,1], [2,2] ],
    [ [0,2], [1,1], [2,0] ]
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      board[a[0]][a[1]] &&
      board[a[0]][a[1]] === board[b[0]][b[1]] &&
      board[a[0]][a[1]] === board[c[0]][c[1]]
    ) {
      return board[a[0]][a[1]];
    }
  }
  if (board.flat().every(cell => cell)) {
    return 'draw';
  }
  return null;
}

// ---- API Helpers (stubbed for now) ----
// Replace with real backend integration
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

// PUBLIC_INTERFACE
async function registerUser(username, password) {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  if (!response.ok) throw new Error('Registration failed');
  return await response.json();
}
// PUBLIC_INTERFACE
async function loginUser(username, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  if (!response.ok) throw new Error('Login failed');
  return await response.json();
}
// PUBLIC_INTERFACE
function saveAuth(auth) {
  localStorage.setItem('ttt_auth', JSON.stringify(auth));
}
function loadAuth() {
  try { return JSON.parse(localStorage.getItem('ttt_auth') || 'null'); }
  catch { return null; }
}
function clearAuth() {
  localStorage.removeItem('ttt_auth');
}
// PUBLIC_INTERFACE
async function startNewGame(token) {
  const response = await fetch(`${API_BASE}/games`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to start game');
  return await response.json();
}
// PUBLIC_INTERFACE
async function makeMove(gameId, row, col, token) {
  const response = await fetch(`${API_BASE}/games/${gameId}/move`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({row, col})
  });
  if (!response.ok) throw new Error('Invalid move');
  return await response.json();
}
// PUBLIC_INTERFACE
async function fetchGame(gameId, token) {
  const response = await fetch(`${API_BASE}/games/${gameId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch game');
  return await response.json();
}
// PUBLIC_INTERFACE
async function fetchMatchHistory(token) {
  const response = await fetch(`${API_BASE}/history`, {
    headers: {'Authorization': `Bearer ${token}`}
  });
  if (!response.ok) throw new Error('Failed to fetch history');
  return await response.json();
}

// ---- UI Components ----

function Header({user, onLogout}) {
  return (
    <header style={{
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', padding: '20px 32px 12px 32px', borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{fontWeight: 700, fontSize: 28, letterSpacing: 1, color: '#1976d2'}}>
        TictacTrack
      </div>
      <div>
        {user ? (
          <span style={{fontSize: 16}}>
            Hi, <b>{user.username}</b>
            <button onClick={onLogout} style={btnStyle({ml: 14, bg: '#424242'})}>Logout</button>
          </span>
        ): (<span style={{fontSize: 16, color: '#424242'}}>Not signed in</span>)}
      </div>
    </header>
  )
}
function btnStyle({ml=0, mt=0, bg='#1976d2', accent=false}={}) {
  return {
    marginLeft: ml, marginTop: mt,
    padding: '8px 22px',
    background: accent ? '#ffeb3b' : bg,
    color: accent ? '#282c34' : '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(25,118,210,0.06)',
    transition: 'background 0.2s'
  };
}
// PUBLIC_INTERFACE
function AuthForm({onLogin, onRegister, loading, error}) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (isLogin) onLogin(username, password);
    else onRegister(username, password);
  };

  return (
    <div style={{
      background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 14,
      padding: 32, margin: '64px auto', maxWidth: 350,
      boxShadow: '0 3px 24px rgba(66,66,66,0.06)'
    }}>
      <h2 style={{color:'#1976d2', marginBottom: 16, fontWeight: 700}}>{isLogin ? "Sign in" : "Register"}</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          type="text" required aria-label="Username"
          value={username}
          placeholder="Username"
          onChange={e => setUsername(e.target.value)}
          style={{width: '100%', marginBottom: 14, padding: 11, fontSize: 17, border: '1px solid #ddd', borderRadius: 8}}
        /><br />
        <input
          type="password" required aria-label="Password"
          value={password}
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
          style={{width: '100%', marginBottom: 19, padding: 11, fontSize: 17, border: '1px solid #ddd', borderRadius: 8}}
        /><br />
        <button style={btnStyle()} disabled={loading}>
          {loading ? "Please wait..." : (isLogin ? "Login" : "Create account")}
        </button>
        <button type="button" onClick={()=>setIsLogin(!isLogin)} style={btnStyle({ml:10, bg:'#ffeb3b', accent:true})} disabled={loading}>
          {isLogin ? "Register" : "Login"}
        </button>
      </form>
      {error && <div style={{marginTop: 16, color:'#c62828', fontWeight:500}}>{error}</div>}
    </div>
  );
}

// PUBLIC_INTERFACE
function GameBoard({board, onMove, disabled}) {
  // board: 3x3 array
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 84px)', gridGap: 0,
      background: '#ffeb3b10', border: '2px solid #ffeb3b', borderRadius: 13
    }}>
      {board.map((row, i) =>
        row.map((cell, j) => (
          <button
            key={i*10+j}
            style={{
              width: 84, height: 84,
              fontSize: 40,
              fontWeight: 700,
              background: 'var(--bg-primary)',
              color: cell === 'X' ? '#1976d2' : cell === 'O' ? '#424242' : '#888',
              border: '1px solid #e9ecef',
              cursor: (!cell && !disabled) ? 'pointer' : 'default'
            }}
            onClick={() => onMove(i, j)}
            disabled={!!cell || disabled}
            aria-label={`cell-${i}-${j}`}
          >
            {cell || ''}
          </button>
        ))
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function TurnIndicator({current, winner, username, youAre}) {
  let info = '';
  if (winner === 'draw') info = "It's a draw!";
  else if (winner) info = `${winner} wins!`;
  else info = current === youAre
      ? `Your turn (${youAre})`
      : `Waiting for ${current === 'X' ? 'X' : 'O'}`;
  return (
    <div style={{
      margin: '25px 0 8px 0', fontSize: 20, fontWeight: 600,
      color: '#1976d2'
    }}>
      {info}
    </div>
  );
}

// PUBLIC_INTERFACE
function OutcomeBanner({winner, youAre, onNew}) {
  let msg = "";
  if (!winner) return null;
  if (winner === 'draw') msg = "It's a draw!";
  else if (winner === youAre) msg = "Congratulations, you win!";
  else msg = (winner === 'X' || winner === 'O') ? `${winner} wins!` : 'Game finished.';
  return (
    <div style={{margin: '22px 0 8px', color:'#1976d2', fontWeight:600, fontSize:21}}>
      <span>{msg}</span>
      <button style={btnStyle({ml:16})} onClick={onNew}>New Game</button>
    </div>
  );
}

// PUBLIC_INTERFACE
function MatchHistory({matches, onClose}) {
  // matches: [{id, opponent, start_time, status, winner}, ...]
  return (
    <div style={{
      position: 'fixed', top:0, right: 0, height: '100vh', width:'100vw', background: 'rgba(255,255,255,0.86)',
      zIndex: 100, display:'flex', alignItems: 'center', justifyContent:'center'
    }}>
      <div style={{
        width:340, background:'#fff', borderRadius:20, boxShadow:'0 4px 32px #42424222', padding:'24px 30px'
      }}>
        <h3 style={{color:'#1976d2', margin:'0 0 18px', fontWeight:700}}>Match History</h3>
        <button style={{...btnStyle({bg:'#424242'}), fontSize:13, position:'absolute', right:40, top:25}} onClick={onClose}>Close</button>
        <div style={{maxHeight:360, overflowY:'auto'}}>
          {(!matches || matches.length === 0) 
            ? <p style={{color:'#424242'}}>No matches yet.</p>
            : <table style={{width:'100%', borderSpacing:8}}>
                <thead>
                  <tr style={{color:'#424242', fontWeight:600}}>
                    <th>Opponent</th><th>Status</th><th>Result</th>
                  </tr>
                </thead>
                <tbody>
                {matches.map((m,i) => (
                  <tr key={i}>
                    <td>{m.opponent || 'AI/Bot'}</td>
                    <td>{m.status}</td>
                    <td>{m.winner === null ? '' : (m.winner==='draw'?'Draw':(m.winner?'You':'Opponent'))}</td>
                  </tr>
                ))}
                </tbody>
              </table>
          }
        </div>
      </div>
    </div>
  );
}

// ---- Main App ----
function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null); // {username, token}
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [game, setGame] = useState(null); // {id, board, status, winner, ...}
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const auth = loadAuth();
    if (auth && auth.token) setUser(auth);
  }, [theme]);

  // Load match history when user logs in
  useEffect(() => {
    if (user && user.token) {
      fetchMatchHistory(user.token).then(result => setHistory(result.matches || []))
      .catch(()=>{});
    }
  }, [user]);

  // Handle registration
  const handleRegister = async (username, password) => {
    setLoading(true); setAuthError('');
    try {
      const result = await registerUser(username, password);
      setUser({username, token: result.token});
      saveAuth({username, token: result.token});
    } catch (e) {
      setAuthError("Registration failed: " + (e.message || ""));
    } finally { setLoading(false);}
  };

  // Handle login
  const handleLogin = async (username, password) => {
    setLoading(true); setAuthError('');
    try {
      const result = await loginUser(username, password);
      setUser({username, token: result.token});
      saveAuth({username, token: result.token});
    } catch (e) {
      setAuthError("Login failed: " + (e.message || ""));
    } finally { setLoading(false);}
  };

  const handleLogout = () => {
    setUser(null); setGame(null);
    clearAuth();
  };

  // Start new game
  const beginNewGame = async () => {
    if (!user?.token) return;
    setGame(null);
    try {
      const res = await startNewGame(user.token);
      // Typical response: { id, board, status, player_x, player_o, winner }
      setGame(res);
    } catch (err) {
      alert("Failed to start game");
    }
  };

  // Make move
  const handleMove = async (row, col) => {
    if (!game || !user?.token) return;
    try {
      const updated = await makeMove(game.id, row, col, user.token);
      setGame(updated);
    } catch (e) {
      alert("Invalid move: " + (e.message || ""));
    }
  };

  // General structure:
  // Header | if not logged in: AuthForm
  // else: NewGame Button, Board, TurnIndicator, OutcomeBanner; right: History Modal toggle

  return (
    <div className="App" style={{
      background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh'
    }}>
      <Header user={user} onLogout={handleLogout} />
      <button
        className="theme-toggle"
        style={{position:'fixed', top:24, right:28, zIndex:9999}}
        onClick={()=>setTheme(theme==='light'?'dark':'light')}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>

      {user ? (
        <>
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start', margin: '32px 0'
          }}>
            <div>
              <button style={btnStyle({bg:'#1976d2', accent:false})} onClick={beginNewGame} disabled={!!game && game.status==='active'}>
                {game && game.status === 'active' ? "Game In Progress" : "Start New Game"}
              </button>
              <button style={btnStyle({ml:22, bg:'#ffeb3b', accent:true})} onClick={()=>setShowHistory(true)}>
                Match History
              </button>
              {/* Game board */}
              {!game ? (
                <p style={{margin:'48px 0 0 0', fontSize:18, color:'#424242'}}>Start a new game to play Tic Tac Toe!</p>
              ) : (
                <div style={{marginTop:30}}>
                  <TurnIndicator
                    current={getNextPlayer(game.board)}
                    winner={game.winner}
                    username={user.username}
                    youAre={game.player_x === user.username ? 'X' : 'O'}
                  />
                  <GameBoard
                    board={game.board}
                    onMove={(row,col) => handleMove(row, col)}
                    disabled={!!game.winner || game.status !== 'active' || (getNextPlayer(game.board) !== (game.player_x === user.username ? 'X' : 'O'))}
                  />
                  <OutcomeBanner
                    winner={game.winner}
                    youAre={game.player_x === user.username ? 'X' : 'O'}
                    onNew={beginNewGame}
                  />
                </div>
              )}
            </div>
          </div>
          {showHistory && <MatchHistory matches={history} onClose={()=>setShowHistory(false)} />}
        </>
      ):(
        <AuthForm
          onLogin={handleLogin}
          onRegister={handleRegister}
          loading={loading}
          error={authError}
        />
      )}

      <footer style={{
        width: '100%', background:'var(--bg-secondary)', borderTop:'1px solid var(--border-color)',
        textAlign:'center', padding:'16px 0', fontSize:14, color:'#424242', marginTop:32
      }}>
        TictacTrack &copy; 2024 &ndash; Modern Minimal Tic Tac Toe
      </footer>
    </div>
  );
}

export default App;
