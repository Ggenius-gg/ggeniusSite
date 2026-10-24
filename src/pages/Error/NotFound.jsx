import { Navigate, useLocation } from 'react-router-dom';
import Error from './Error.jsx';

// Старые адреса магазина. Магазин с сайта убран (сайт ничего не продаёт),
// поэтому сохранённые ссылки и закладки ведём на главную, а не на 404.
const RETIRED_SHOP_PATHS = /^\/(donate|products|payment-success|payment-fail)(\/|$)/i;

const NotFound = () => {
  const { pathname } = useLocation();
  if (RETIRED_SHOP_PATHS.test(pathname)) return <Navigate to="/" replace />;
  return <Error />;
};

export default NotFound;
