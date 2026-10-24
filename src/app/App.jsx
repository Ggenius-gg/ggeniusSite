import style from '../shared/styles/index.module.css';
import Header from '../widgets/Header/Header';
import Footer from '../widgets/Footer/Footer';
import { Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import LanguageProvider from '../shared/hooks/LanguageProvider';
import { AuthProvider } from '../domains/auth/useAuth';
import AOS from 'aos';
import "aos/dist/aos.css"
import { animated, useTransition } from '@react-spring/web';


const App = () => {

  useEffect(() => {
    AOS.init({
      duration: 1500, // длительность анимации (мс)
      once: true,     // анимация запускается один раз
    });
  }, []);


  const location = useLocation();

  const transitions = useTransition(location, {
    from: {
      opacity: 0,
      transform: 'translateY(100%)',
      position: 'relative',
      flexGrow: 1,
    },
    enter: {
      opacity: 1,
      transform: 'translateY(0)',
      flexGrow: 1,
    },
  })


  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [location]);

  // AuthProvider — только здесь. Второй аргумент ViteReactSSG в main.jsx —
  // это setup-функция, а не обёртка: JSX, который она возвращает, не рисуется.
  return (<>
    <AuthProvider>
      <div className={style.wrapper}>
        <Header />
        <main className={style.main}>
          <LanguageProvider />
          {transitions((style, location) => (
            <animated.div className={style.animated} style={style}>
              <Outlet location={location} />
            </animated.div>
          ))}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  </>
  );
};

export default App;
