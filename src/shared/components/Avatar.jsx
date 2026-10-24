import ui from '../styles/site.module.css';

// Аватар по ссылке; если ссылки нет — первая буква имени.
const Avatar = ({ src, name, small = false }) => {
  const className = small ? ui.avatarSmall : ui.avatar;
  if (src) return <img className={className} src={src} alt="" loading="lazy" />;
  // Первая буква или цифра имени («[ПРОБА] Кубок» → «П»)
  const letter = ((name || '').match(/[\p{L}\p{N}]/u)?.[0] || '?').toUpperCase();
  return (
    <span className={className} aria-hidden="true">
      {letter}
    </span>
  );
};

export default Avatar;
