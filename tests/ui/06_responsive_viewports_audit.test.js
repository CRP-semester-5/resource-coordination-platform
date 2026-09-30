import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Responsive Screen Viewports & Breakpoint Rules', () => {

  const determineLayoutConfig = (viewportWidth) => {
    if (viewportWidth < 640) {
      return {
        deviceType: 'MOBILE',
        columns: 1,
        sidebarCollapsed: true,
        enableTableScroll: true,
        buttonSize: 'sm',
        showFullStats: false
      };
    } else if (viewportWidth < 1024) {
      return {
        deviceType: 'TABLET',
        columns: 2,
        sidebarCollapsed: true,
        enableTableScroll: true,
        buttonSize: 'md',
        showFullStats: true
      };
    } else {
      return {
        deviceType: 'DESKTOP',
        columns: 3,
        sidebarCollapsed: false,
        enableTableScroll: false,
        buttonSize: 'default',
        showFullStats: true
      };
    }
  };

  it('configures single-column stacked layout and collapsed sidebar for standard mobile (360x640)', () => {
    const layout = determineLayoutConfig(360);
    assert.strictEqual(layout.deviceType, 'MOBILE');
    assert.strictEqual(layout.columns, 1);
    assert.strictEqual(layout.sidebarCollapsed, true);
    assert.strictEqual(layout.enableTableScroll, true);
  });

  it('configures single-column stacked layout for large modern mobile (412x915)', () => {
    const layout = determineLayoutConfig(412);
    assert.strictEqual(layout.deviceType, 'MOBILE');
    assert.strictEqual(layout.columns, 1);
    assert.strictEqual(layout.sidebarCollapsed, true);
  });

  it('configures 2-column layout for tablet viewport (768x1024)', () => {
    const layout = determineLayoutConfig(768);
    assert.strictEqual(layout.deviceType, 'TABLET');
    assert.strictEqual(layout.columns, 2);
    assert.strictEqual(layout.showFullStats, true);
  });

  it('configures full expanded 3-column dashboard and visible sidebar for desktop (1920x1080)', () => {
    const layout = determineLayoutConfig(1920);
    assert.strictEqual(layout.deviceType, 'DESKTOP');
    assert.strictEqual(layout.columns, 3);
    assert.strictEqual(layout.sidebarCollapsed, false);
  });
});
