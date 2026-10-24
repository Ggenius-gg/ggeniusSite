import './i18n.js'
// import { ViteSSG } from 'vite-plugin-ssg';
import { RouterProvider } from 'react-router-dom'
import { routes } from './app/routers.jsx';
import { ViteReactSSG } from 'vite-react-ssg';
const redirect = sessionStorage.getItem("redirect");

if (redirect) {
  sessionStorage.removeItem("redirect");
  window.history.replaceState(null, "", redirect);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) =>
      console.error("SW registration failed:", err)
    );
  });
}

// vite-react-ssg сам создаёт RouterProvider. Второй аргумент — setup-функция
// (её JSX не рисуется), поэтому AuthProvider живёт в app/App.jsx.
export const createApp = ViteReactSSG(
  { routes },
  () => {},
  { rootContainer: '#app' }
);