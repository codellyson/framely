import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerRoot } from './lib/registerRoot';
import { Root } from './Root';
import App from './App';

registerRoot(Root);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
