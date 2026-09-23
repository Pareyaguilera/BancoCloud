import { useState, useEffect } from 'react';

export default function Dashboard({ token, role }) {
  const [transferencias, setTransferencias] = useState([]);
  
  // Estados para Transferencias
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [monto, setMonto] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  // Estados para Filtros de Admin
  const [filtroCuenta, setFiltroCuenta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // ⚠️ TU API GATEWAY
  const API_BASE = 'https://8ifqdhj41a.execute-api.us-east-1.amazonaws.com/Dev';

  const cargarTransferencias = async () => {
    setCargando(true);
    try {
      // Obtenemos las transferencias de la ruta correspondiente
      const url = role === 'Admin' 
        ? `${API_BASE}/api/trasferencias/admin` 
        : `${API_BASE}/api/trasferencias`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Error al obtener datos');
      const data = await res.json();
      let resultado = Array.isArray(data) ? data : [];

      // 🛑 AQUÍ ESTÁ LA MAGIA: FILTRAMOS DIRECTAMENTE EN EL FRONTEND 🛑
      if (role === 'Admin') {
        // Filtrar por Estado
        if (filtroEstado) {
          resultado = resultado.filter(item => 
            (item.estado || 'completada').toLowerCase() === filtroEstado
          );
        }
        // Filtrar por Número de Cuenta (busca en Origen o Destino)
        if (filtroCuenta) {
          const busqueda = filtroCuenta.toLowerCase().trim();
          resultado = resultado.filter(item => 
            String(item.origen || item.cuenta_origen || '').toLowerCase().includes(busqueda) || 
            String(item.destino || item.cuenta_destino || '').toLowerCase().includes(busqueda)
          );
        }
      }

      setTransferencias(resultado);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Recargar si cambian los filtros o el rol
  useEffect(() => {
    cargarTransferencias();
  }, [token, role, filtroEstado]);
  
  const handleCrearTransferencia = async (e) => {
    e.preventDefault();
    setMensaje({ texto: 'Procesando...', tipo: 'info' });
    try {
      const res = await fetch(`${API_BASE}/api/trasferencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
              origen: cuentaOrigen,       
              destino: destinatario,     
              monto: parseFloat(monto),   
              usuarioSub: "5428f418-8031-70bf-5c80-e78a45b4617f" 
        })
      });

      if (res.ok) {
        setMensaje({ texto: 'Transferencia realizada con éxito', tipo: 'success' });
        setCuentaOrigen('');
        setDestinatario('');
        setMonto('');
        cargarTransferencias();
      } else {
        setMensaje({ texto: 'Error al procesar la transferencia', tipo: 'error' });
      }
    } catch (err) {
      setMensaje({ texto: 'Error de conexión', tipo: 'error' });
    }
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  const handleAnular = async (id) => {
    if (!confirm(`¿Seguro que deseas anular la transacción ID ${id}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/trasferencias/admin/anular/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Transacción anulada correctamente');
        cargarTransferencias();
      } else {
        alert('Error al intentar anular');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Panel de Nueva Transferencia (Solo Clientes) */}
      {role !== 'Admin' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💸 Enviar Dinero</h3>
          
          {mensaje.texto && (
            <div style={{ ...styles.alert, backgroundColor: mensaje.tipo === 'success' ? '#d1fae5' : mensaje.tipo === 'error' ? '#fee2e2' : '#e0f2fe', color: mensaje.tipo === 'success' ? '#065f46' : mensaje.tipo === 'error' ? '#991b1b' : '#075985' }}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleCrearTransferencia} style={styles.formGroup}>
            <input 
              type="text" 
              placeholder="Cuenta Origen" 
              value={cuentaOrigen} 
              onChange={(e) => setCuentaOrigen(e.target.value)} 
              required 
              style={styles.input}
            />
            <input 
              type="text" 
              placeholder="Cuenta Destino" 
              value={destinatario} 
              onChange={(e) => setDestinatario(e.target.value)} 
              required 
              style={styles.input}
            />
            <input 
              type="number" 
              placeholder="Monto ($)" 
              value={monto} 
              onChange={(e) => setMonto(e.target.value)} 
              required 
              style={styles.input}
            />
            <button type="submit" style={styles.btnPrimary}>Transferir</button>
          </form>
        </div>
      )}

      {/* Panel de Historial (Ambos Roles) */}
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h3 style={styles.cardTitle}>
            {role === 'Admin' ? '🛡️ Auditoría General de Transferencias' : '📊 Mis Movimientos'}
          </h3>
          <button onClick={cargarTransferencias} style={styles.btnSecondary} disabled={cargando}>
            {cargando ? 'Actualizando...' : '↻ Refrescar'}
          </button>
        </div>

        {/* Filtros Administrativos */}
        {role === 'Admin' && (
          <div style={{ ...styles.formGroup, marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Buscar número de cuenta..." 
              value={filtroCuenta} 
              onChange={(e) => setFiltroCuenta(e.target.value)} 
              style={styles.input}
            />
            <button onClick={cargarTransferencias} style={styles.btnSecondary}>Buscar Cuenta</button>
            
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)} 
              style={{...styles.input, maxWidth: '200px'}}
            >
              <option value="">Todos los estados</option>
              <option value="completada">Completadas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>
        )}

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Origen</th>
                <th style={styles.th}>Destino</th>
                <th style={styles.th}>Monto</th>
                <th style={styles.th}>Estado</th>
                {role === 'Admin' && <th style={styles.th}>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {transferencias.length === 0 ? (
                <tr>
                  <td colSpan={role === 'Admin' ? 6 : 5} style={styles.emptyState}>
                    {cargando ? 'Cargando datos...' : 'No hay transacciones registradas o no coinciden con el filtro.'}
                  </td>
                </tr>
              ) : (
                transferencias.map((item) => {
                  const estadoActual = (item.estado || 'completada').toLowerCase();
                  
                  return (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>#{item.id}</td>
                      <td style={styles.td}>{item.origen || item.cuenta_origen || '-'}</td>
                      <td style={styles.td}>{item.destino || item.cuenta_destino || '-'}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>${item.monto}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: estadoActual === 'anulada' ? '#fee2e2' : '#d1fae5',
                          color: estadoActual === 'anulada' ? '#991b1b' : '#065f46'
                        }}>
                          {estadoActual === 'anulada' ? 'Anulada' : 'Completada'}
                        </span>
                      </td>
                      {role === 'Admin' && (
                        <td style={styles.td}>
                          {estadoActual !== 'anulada' && (
                            <button onClick={() => handleAnular(item.id)} style={styles.btnDanger}>
                              Anular
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- ESTILOS VISUALES ---
const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' },
  cardTitle: { margin: '0 0 20px 0', color: '#1a1a1a', fontSize: '18px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  formGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  input: { flex: '1', minWidth: '150px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },
  btnPrimary: { backgroundColor: '#002B5B', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  btnSecondary: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' },
  btnDanger: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '12px 16px', backgroundColor: '#f9fafb', color: '#4b5563', fontWeight: '600', fontSize: '13px', borderBottom: '2px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #e5e7eb' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#1f2937' },
  emptyState: { padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' },
  alert: { padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: '500' },
  badge: { padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' }
};