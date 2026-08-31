import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import App from './App';
import {initializeStableViewport} from './utils/stableViewport';

initializeStableViewport();
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize: true});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
