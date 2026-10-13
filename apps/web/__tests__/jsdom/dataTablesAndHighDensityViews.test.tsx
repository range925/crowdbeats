/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AdminDataTable, Column } from '../../components/admin/AdminDataTable';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

interface TestItem {
  id: string;
  name: string;
  amount: number;
  status: string;
}

const testData: TestItem[] = [
  { id: '1', name: 'The Neon Shadows', amount: 1250.0, status: 'Active' },
  { id: '2', name: 'Electric Waves', amount: 480.5, status: 'Pending' },
  { id: '3', name: 'Lunar Echoes', amount: 3200.75, status: 'Completed' },
];

const testColumns: Column<TestItem>[] = [
  {
    key: 'name',
    header: 'Artist / Entity',
    cell: (item) => <span>{item.name}</span>,
    sortable: true,
  },
  {
    key: 'amount',
    header: 'Amount ($)',
    cell: (item) => <span className="cb-tabular-nums">${item.amount.toFixed(2)}</span>,
    numeric: true,
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <span className="cb-badge cb-badge-emerald">{item.status}</span>,
  },
];

describe('Phase 11: Data Tables & High-Density Views', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders table container with horizontal scroll containment and minWidth', () => {
    act(() => {
      root.render(
        <AdminDataTable
          data={testData}
          columns={testColumns}
          currentPage={1}
          totalPages={3}
        />
      );
    });

    const tableWrapper = container.querySelector('.admin-table-container') as HTMLElement;
    expect(tableWrapper).not.toBeNull();
    expect(tableWrapper.style.overflowX).toBe('auto');

    const table = container.querySelector('table') as HTMLTableElement;
    expect(table).not.toBeNull();
    expect(table.style.minWidth).toBe('640px');
  });

  it('renders tabular figures for financial values and high-contrast badges', () => {
    act(() => {
      root.render(
        <AdminDataTable
          data={testData}
          columns={testColumns}
          currentPage={1}
          totalPages={1}
        />
      );
    });

    const tabularSpans = container.querySelectorAll('.cb-tabular-nums');
    expect(tabularSpans.length).toBe(3);
    expect(tabularSpans[0].textContent).toBe('$1250.00');

    const badges = container.querySelectorAll('.cb-badge');
    expect(badges.length).toBe(3);
  });

  it('provides accessible sorting triggers on sortable column headers', () => {
    const handleSort = jest.fn();
    act(() => {
      root.render(
        <AdminDataTable
          data={testData}
          columns={testColumns}
          sortKey="amount"
          sortDirection="desc"
          onSort={handleSort}
        />
      );
    });

    const thElements = Array.from(container.querySelectorAll('th'));
    const amountHeader = thElements.find((th) => th.textContent?.includes('Amount ($)'));
    expect(amountHeader).not.toBeUndefined();
    expect(amountHeader?.getAttribute('aria-sort')).toBe('descending');

    act(() => {
      amountHeader?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handleSort).toHaveBeenCalledWith('amount');
  });

  it('ensures pagination buttons have accessible touch targets and proper aria labels', () => {
    const handlePageChange = jest.fn();
    act(() => {
      root.render(
        <AdminDataTable
          data={testData}
          columns={testColumns}
          currentPage={2}
          totalPages={5}
          onPageChange={handlePageChange}
        />
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const prevButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'Previous page');
    const nextButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'Next page');

    expect(prevButton).not.toBeUndefined();
    expect(nextButton).not.toBeUndefined();

    // Verify touch target styling (min height >= 40px)
    expect(prevButton?.style.minHeight).toBe('40px');
    expect(nextButton?.style.minHeight).toBe('40px');

    act(() => {
      nextButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });
});
