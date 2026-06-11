import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDefaultTab,
  saveDefaultTab,
  getActiveTab,
  saveActiveTab,
  getTabOrder,
  saveTabOrder,
  resetTabOrder,
} from '../userPreferences';

describe('userPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getDefaultTab / saveDefaultTab', () => {
    it('returns "qrcode" when no default is saved', () => {
      expect(getDefaultTab()).toBe('qrcode');
    });

    it('returns saved default tab', () => {
      saveDefaultTab('timestamp');
      expect(getDefaultTab()).toBe('timestamp');
    });

    it('returns "qrcode" for invalid saved value', () => {
      localStorage.setItem('app-default-tab', 'nonexistent');
      expect(getDefaultTab()).toBe('qrcode');
    });
  });

  describe('getActiveTab / saveActiveTab', () => {
    it('returns null when no active tab is saved', () => {
      expect(getActiveTab()).toBeNull();
    });

    it('returns saved active tab', () => {
      saveActiveTab('json');
      expect(getActiveTab()).toBe('json');
    });

    it('returns null for invalid saved value', () => {
      localStorage.setItem('app-active-tab', 'invalid-tab');
      expect(getActiveTab()).toBeNull();
    });
  });

  describe('getTabOrder / saveTabOrder / resetTabOrder', () => {
    it('returns default order when nothing is saved', () => {
      const order = getTabOrder();
      expect(order[0]).toBe('qrcode');
      expect(order).toContain('json');
      expect(order).toContain('asciiart');
    });

    it('preserves custom order', () => {
      const customOrder = getTabOrder();
      const reversed = [...customOrder].reverse();
      saveTabOrder(reversed);
      expect(getTabOrder()).toEqual(reversed);
    });

    it('appends missing tabs when new tabs are added', () => {
      saveTabOrder(['qrcode', 'json']);
      const order = getTabOrder();
      expect(order[0]).toBe('qrcode');
      expect(order[1]).toBe('json');
      expect(order.length).toBeGreaterThan(2);
      expect(order).toContain('timestamp');
    });

    it('resets to default order', () => {
      saveTabOrder(['json', 'qrcode']);
      resetTabOrder();
      const order = getTabOrder();
      expect(order[0]).toBe('qrcode');
    });
  });
});
