import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Amplify } from 'aws-amplify';

// Configuración directa de Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_V9TxN0imj', // <-- IMPORTANTE: Cambia esto por tu User Pool ID real
      userPoolClientId: '3ofsq8ve6622qtdp10nk1tp2e9', // Este es tu App Client (ya lo dejé configurado)
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
