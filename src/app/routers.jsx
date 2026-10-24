import App from './App.jsx';


// -------------- DOMAINS --------------
import AuthCallback from     '../domains/auth/api/authCallback.jsx';
import Profile from          '../domains/profile/Profile.jsx';
import Tournaments from      '../domains/tournaments/Tournaments.jsx';
import TournamentPage from   '../domains/tournaments/TournamentPage.jsx';
import Leagues from          '../domains/leagues/Leagues.jsx';
import LeaguePage from       '../domains/leagues/LeaguePage.jsx';
import Devel from            '../domains/Devel/Devel.jsx';


// -------------- PAGES --------------
import Offer from          '../pages/Offer/Offer.jsx';
import Work from           '../pages/Work/Work.jsx';
import Privacy from        '../pages/Privacy/Privacy.jsx';
import About from          '../pages/About/About.jsx'
import Error from          '../pages/Error/Error.jsx';
import NotFound from       '../pages/Error/NotFound.jsx';
import Home from           '../pages/Home/Home.jsx';



export const routes = [
  {
    path: '/',
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        path: '',
        index: true,
        element: <Home />
      },
      {
        path: 'Home',
        index: true,
        element: <Home />
      },
      {
        path: 'About',
        element: <About />
      },
      {
        path: 'auth/callback',
        element: <AuthCallback />
      },
      {
        path: 'profile',
        element: <Profile />
      },
      {
        path: 'Tourn',
        element: <Tournaments />
      },
      {
        path: 'tournament/:id',
        element: <TournamentPage />
      },
      {
        path: 'leagues',
        element: <Leagues />
      },
      {
        path: 'league/:id',
        element: <LeaguePage />
      },
      {
        path: 'Our',
        element: <Devel />
      },
      {
        path: 'Privacy',
        element: <Privacy />
      },
      {
        path: 'Offer',
        element: <Offer />
      },
      {
        path: 'Work',
        element: <Work />
      },
      {
        // Сюда же попадают старые адреса магазина (/Donate, /Products/…, /payment-…):
        // NotFound отправляет их на главную. Магазина на сайте больше нет.
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
