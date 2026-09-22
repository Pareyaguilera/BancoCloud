import { useState, useEffect } from 'react';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState('');
  const [cargando, setCargando] = useState(true);

  // Esta función revisa si el usuario ya inició sesión
  const checkSession = async () => {
    try {
      const { tokens } = await fetchAuthSession();
      if (tokens && tokens.idToken) {
        setToken(tokens.idToken.toString());
        
        // Extraemos el rol desde cognito:groups
        const groups = tokens.idToken.payload['cognito:groups'] || [];
        setRole(groups.includes('Admin') ? 'Admin' : 'Cliente');
      } else {
        setToken(null);
        setRole('');
      }
    } catch (err) {
      setToken(null);
      setRole('');
    } finally {
      setCargando(false);
    }
  };

  // Se ejecuta automáticamente al cargar la página
  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setToken(null);
    setRole('');
  };

  if (cargando) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sistema...</div>;
  }

  // Si no hay token, mostramos la pantalla de Login
  if (!token) {
    return <Login onLoginSuccess={checkSession} />;
  }

  // Si hay token, mostramos el Dashboard
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        <div>
          <h2>BancoCloud</h2>
          <small>Rol actual: <strong>{role}</strong></small>
        </div>
        <button 
          onClick={handleLogout}
          style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cerrar Sesión
        </button>
      </header>

      <main style={{ marginTop: '20px' }}>
        <Dashboard token={token} role={role} />
      </main>
    </div>
  );
}

export default App;
