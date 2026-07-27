import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import './index.css'
import App from './App.jsx'
import { store, persistor } from './redux/store.js'
import { SocketProvider } from './context/SocketContext.jsx'
import { CallProvider } from './context/CallContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketProvider>
          <CallProvider>
            <App />
          </CallProvider>
        </SocketProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
)