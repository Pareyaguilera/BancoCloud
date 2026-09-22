import { useState } from 'react';
import { signIn } from 'aws-amplify/auth';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);

    try {
      const { isSignedIn } = await signIn({ username, password });
      if (isSignedIn) onLoginSuccess();
    } catch (err) {
      console.error("Error:", err);
      setError('Credenciales inválidas. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🏦</div>
          <h2 style={styles.title}>BancoCloud</h2>
          <p style={styles.subtitle}>Tu portal financiero seguro</p>
        </div>
        
        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              style={styles.input}
              placeholder="Ej: jperez"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={enviando}
            style={enviando ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          >
            {enviando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- ESTILOS VISUALES ---
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    padding: '40px 30px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    border: '1px solid #eaeaea',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  icon: {
    fontSize: '48px',
    margin: '0 0 10px 0',
  },
  title: {
    margin: '0 0 5px 0',
    color: '#1a1a1a',
    fontSize: '26px',
    fontWeight: '700',
  },
  subtitle: {
    margin: '0',
    color: '#666',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: '#f9fafb',
    outline: 'none',
  },
  button: {
    backgroundColor: '#002B5B', // Azul oscuro bancario
    color: '#ffffff',
    border: 'none',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    border: '1px solid #f87171',
    textAlign: 'center',
  }
};