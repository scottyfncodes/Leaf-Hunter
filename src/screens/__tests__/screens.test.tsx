import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/state/AppState';
import { ToastProvider } from '@/components/Toast';
import { ExploreScreen } from '../Explore';
import { ReportScreen } from '../Report';
import { WatchlistScreen } from '../Watchlist';
import { LocationDetailScreen } from '../LocationDetail';
import { HuntScreen } from '../Hunt';
import { LocalReportStore, LocalFavoriteStore } from '@/storage/local';

const NOW = new Date(2026, 8, 27, 10);

function renderAt(path: string, now: Date = NOW) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider initialNow={now}>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<ExploreScreen />} />
            <Route path="/report" element={<ReportScreen />} />
            <Route path="/watch" element={<WatchlistScreen />} />
            <Route path="/spot/:id" element={<LocationDetailScreen />} />
            <Route path="/hunt" element={<HuntScreen />} />
          </Routes>
        </ToastProvider>
      </AppProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // ResizeObserver is not in jsdom; the map component uses it.
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
});

describe('Explore', () => {
  it('shows a dataset-driven headline and the location list', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: /PEAK COLOR IS HAPPENING/ })).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBeGreaterThan(10);
    expect(screen.getByText(/40 spots/)).toBeInTheDocument();
  });
  it('filters the list by search and shows an empty state for nonsense', () => {
    renderAt('/');
    const box = screen.getByRole('searchbox');
    fireEvent.change(box, { target: { value: 'Kenosha' } });
    expect(screen.getByRole('link', { name: /Kenosha Pass/ })).toBeInTheDocument();
    expect(screen.getByText(/1 spot matching/)).toBeInTheDocument();
    fireEvent.change(box, { target: { value: 'zzqx' } });
    expect(screen.getByText(/No spot by that name/)).toBeInTheDocument();
  });
  it('shows offseason messaging in summer instead of peak claims', () => {
    renderAt('/', new Date(2026, 5, 15, 10));
    expect(screen.getByRole('heading', { name: /THE LEAVES ARE RESTING/ })).toBeInTheDocument();
    expect(screen.queryByText(/PEAK COLOR IS HAPPENING/)).not.toBeInTheDocument();
  });
});

describe('Report flow', () => {
  it('saves a local report and it appears on the location page', () => {
    renderAt('/report?spot=kenosha-pass');
    expect(screen.getByText('Kenosha Pass')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Peak$/ }));
    fireEvent.change(screen.getByRole('textbox', { name: /Note/ }), { target: { value: 'Gold everywhere.' } });
    fireEvent.click(screen.getByRole('button', { name: /Save leaf check/ }));

    const stored = new LocalReportStore().list();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ locationId: 'kenosha-pass', status: 'peak', note: 'Gold everywhere.', source: 'local' });
    expect(stored[0]!.colorPercent).toBeGreaterThanOrEqual(70);

    // Navigated to the detail page; the report is listed and labelled as on-device.
    expect(screen.getByRole('heading', { name: 'Kenosha Pass' })).toBeInTheDocument();
    expect(screen.getByText('Your leaf check')).toBeInTheDocument();
    expect(screen.getAllByText(/on this device/).length).toBeGreaterThan(0);
  });
});

describe('Watchlist', () => {
  it('shows the empty state, then a watched spot after toggling', () => {
    const { unmount } = renderAt('/watch');
    expect(screen.getByText('Nothing on watch.')).toBeInTheDocument();
    unmount();

    renderAt('/spot/guanella-pass');
    fireEvent.click(screen.getByRole('button', { name: /^Watch$/ }));
    expect(new LocalFavoriteStore().list().map((f) => f.locationId)).toEqual(['guanella-pass']);
  });
  it('lists watched spots with change since last look', () => {
    const store = new LocalFavoriteStore();
    store.add({ locationId: 'guanella-pass', addedAt: new Date(2026, 8, 20).toISOString(), lastSeenPercent: 61, lastSeenAt: new Date(2026, 8, 20).toISOString() });
    renderAt('/watch');
    expect(screen.getByText(/1 spot on watch/)).toBeInTheDocument();
    expect(screen.getByText(/61% →/)).toBeInTheDocument();
    expect(screen.getByText(/Color is accelerating/)).toBeInTheDocument();
  });
});

describe('Hunt', () => {
  it('produces explained matches for a time budget', () => {
    renderAt('/hunt');
    fireEvent.click(screen.getByRole('radio', { name: /Half a day/ }));
    const list = screen.getByRole('heading', { name: /matches for half a day/i });
    expect(list).toBeInTheDocument();
    const reasons = screen.getAllByRole('list', { name: /Why it fits/ });
    expect(reasons.length).toBeGreaterThan(0);
    expect(within(reasons[0]!).getAllByRole('listitem').length).toBeGreaterThanOrEqual(2);
  });
});
