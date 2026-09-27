import { NavLink } from 'react-router-dom';
import { IconCompass, IconHeart, IconMore, IconTarget, LeafMark } from './Icons';
import { useApp } from '@/state/AppState';

const items = [
  { to: '/', label: 'Explore', Icon: IconCompass, end: true },
  { to: '/hunt', label: 'Hunt', Icon: IconTarget, end: false },
  { to: '/watch', label: 'Watchlist', Icon: IconHeart, end: false },
  { to: '/more', label: 'More', Icon: IconMore, end: false },
];

export function BottomNav() {
  const { favorites } = useApp();
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="bottom-nav__inner">
        <NavLink to="/" className="bottom-nav__brand" aria-label="Leaf Hunter home">
          <LeafMark size={28} />
          LEAF HUNTER
        </NavLink>
        {items.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-nav__item" aria-label={label}>
            {({ isActive }) => (
              <>
                <Icon strokeWidth={isActive ? 2.4 : 2} />
                <span>{label}</span>
                {label === 'Watchlist' && favorites.length > 0 && <span className="bottom-nav__badge" aria-label={`${favorites.length} on watch`}>{favorites.length}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
