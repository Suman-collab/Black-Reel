import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/variables.css';
import './styles/global.css';
import './styles/animations.css';
import './styles/buttons.css';
import './styles/forms.css';
import './styles/cards.css';
import './styles/badges.css';
import './styles/modals.css';
import './styles/toasts.css';
import './styles/plans.css';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
