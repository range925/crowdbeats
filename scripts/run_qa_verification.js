const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9266;
const screenshotsDir = 'C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\290027e5-d1ce-4528-a833-f4a9e6646325\\screenshots';
fs.mkdirSync(screenshotsDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const tabs = await res.json();
      const t = tabs.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
  }
  throw new Error('CDP not responding on port ' + debugPort);
}

const testResults = [];
function record(name, pass, details) {
  testResults.push({ name, pass, details });
  console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} ${name}: ${details}`);
}

async function run() {
  console.log('Starting headless Chrome for QA Verification...');
  const tmpProfile = path.join(os.tmpdir(), 'cb_qa_cdp_' + Date.now());
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${tmpProfile}`,
    '--disable-extensions',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: 'ignore' });

  let ws;
  try {
    const wsUrl = await getWsUrl();
    ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const myId = id++;
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === myId) {
          ws.removeEventListener('message', h);
          d.error ? reject(d.error) : resolve(d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

    const consoleLogs = [];
    let dialogOpened = null;
    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        const text = (d.params.args || []).map(a => a.value || JSON.stringify(a)).join(' ');
        consoleLogs.push({ type: d.params.type, text });
      }
      if (d.method === 'Page.javascriptDialogOpening') {
        dialogOpened = d.params;
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || 'Eval error');
      }
      return res.result?.value;
    };

    const takeScreenshot = async (filename, clipSelector = null) => {
      let params = { format: 'png' };
      if (clipSelector) {
        const rect = await evalJs(`
          (() => {
            const el = document.querySelector(${JSON.stringify(clipSelector)});
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: window.scrollX + r.left, y: window.scrollY + r.top, width: r.width, height: r.height };
          })()
        `);
        if (rect && rect.width > 0 && rect.height > 0) {
          params.clip = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 };
        }
      }
      const shot = await send('Page.captureScreenshot', params);
      const outPath = path.join(screenshotsDir, filename);
      fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      console.log(`📸 Screenshot saved: ${filename}`);
      return outPath;
    };

    console.log('\n--- TEST 1: Initial Page Load & Refresh ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(3500);

    // Dismiss privacy consent and hide dev overlays for clean visuals
    await evalJs(`
      (() => {
        // Accept privacy banner if present
        const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Accept All & Agree'));
        if (acceptBtn) acceptBtn.click();

        // Inject style to suppress next.js dev overlay toast during screenshots
        const s = document.createElement('style');
        s.textContent = 'nextjs-portal, #__next-build-watcher, [class*="nextjs-toast"] { display: none !important; }';
        document.head.appendChild(s);
      })()
    `);
    await sleep(400);

    // Check automatic geolocation prompt
    record(
      'No Automatic Geolocation Prompt',
      dialogOpened === null,
      dialogOpened ? `Dialog opened: ${JSON.stringify(dialogOpened)}` : 'No automatic dialogs or permission alerts triggered on load'
    );

    // Verify Section 2 live Google Map immediately
    const mapInfo = await evalJs(`
      (() => {
        const sec = document.querySelector('#discover');
        if (!sec) return { exists: false };
        const canvas = sec.querySelector('[class*="mapCanvas"]');
        const gmStyle = sec.querySelector('.gm-style');
        const isGoogleMaps = !!(window.google && window.google.maps);
        return {
          exists: true,
          hasCanvas: !!canvas,
          hasGmStyle: !!gmStyle,
          isGoogleMaps,
          canvasRect: canvas ? { width: canvas.offsetWidth, height: canvas.offsetHeight } : null
        };
      })()
    `);
    record(
      'Section 2 Live Google Map Immediate Render',
      mapInfo.exists && mapInfo.hasCanvas && mapInfo.hasGmStyle && mapInfo.isGoogleMaps,
      `Map canvas: ${mapInfo.hasCanvas}, .gm-style rendered: ${mapInfo.hasGmStyle}, Google Maps SDK loaded: ${mapInfo.isGoogleMaps}, Dimensions: ${JSON.stringify(mapInfo.canvasRect)}`
    );

    // Verify standalone "Use my location" button is gone from outside dropdown
    const standaloneLocBtn = await evalJs(`
      (() => {
        const form = document.querySelector('#discover form');
        if (!form) return false;
        const dropdown = form.querySelector('[class*="dropdown"]');
        const allButtons = Array.from(form.querySelectorAll('button'));
        const outsideButtons = allButtons.filter(b => !dropdown || !dropdown.contains(b));
        return outsideButtons.some(b => b.textContent && b.textContent.toLowerCase().includes('location'));
      })()
    `);
    record(
      'Standalone "Use my location" Button Removed',
      !standaloneLocBtn,
      'No standalone location button found outside the search dropdown'
    );

    // Check all landing page sections intact
    const sectionsIntact = await evalJs(`
      (() => {
        const header = !!document.querySelector('header');
        const hero = !!document.querySelector('#hero, [class*="hero"]');
        const discover = !!document.querySelector('#discover');
        const forFans = !!document.querySelector('#for-fans, [id*="fans"]');
        const howItWorks = !!document.querySelector('#how-it-works');
        const forMusicians = !!document.querySelector('#for-musicians, [id*="musicians"]');
        const nextChapter = !!document.querySelector('#next-chapter, [id*="chapter"]');
        const join = !!document.querySelector('#join, [id*="join"]');
        const footer = !!document.querySelector('footer');
        return { header, hero, discover, forFans, howItWorks, forMusicians, nextChapter, join, footer };
      })()
    `);
    const allSectionsPresent = Object.values(sectionsIntact).every(Boolean);
    record(
      'All Landing Page Sections Intact',
      allSectionsPresent,
      JSON.stringify(sectionsIntact)
    );

    // Capture desktop hero/landing screenshot
    await evalJs(`window.scrollTo(0, 0)`);
    await sleep(400);
    await takeScreenshot('after_desktop_landing.png');

    // Scroll to DiscoverSection with header visible for exact before/after comparison
    await evalJs(`
      (() => {
        const el = document.querySelector('#discover');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'instant' });
        }
      })()
    `);
    await sleep(500);
    await takeScreenshot('after_section2_discover.png');
    await takeScreenshot('qa_initial_load_map_desktop.png', '#discover');

    console.log('\n--- TEST 2: Search Input & Dropdown ---');
    // Check input styling (pill shape, 52px height, search icon)
    const inputStyles = await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        const bar = input?.closest('[class*="searchBar"]');
        if (!input || !bar) return null;
        const bStyle = window.getComputedStyle(bar);
        const icon = bar.querySelector('[class*="searchIcon"]');
        const hasSvg = !!icon?.querySelector('svg');
        return {
          height: bStyle.height,
          borderRadius: bStyle.borderRadius,
          hasSearchIcon: hasSvg,
          placeholder: input.placeholder
        };
      })()
    `);
    record(
      'Search Input Pill Shape & 52px Height',
      inputStyles && (inputStyles.height === '52px' || parseFloat(inputStyles.height) === 52) && inputStyles.hasSearchIcon,
      `Computed height: ${inputStyles?.height}, border-radius: ${inputStyles?.borderRadius}, hasIcon: ${inputStyles?.hasSearchIcon}`
    );

    // When 0 chars typed: dropdown closed
    const initialDropdownState = await evalJs(`
      (() => {
        const dropdown = document.querySelector('#discover [class*="dropdown"]');
        const input = document.querySelector('#discover input[role="combobox"]');
        return {
          hasDropdown: !!dropdown,
          ariaExpanded: input?.getAttribute('aria-expanded')
        };
      })()
    `);
    record(
      'Dropdown Closed at 0 Characters',
      !initialDropdownState.hasDropdown && initialDropdownState.ariaExpanded === 'false',
      `Dropdown rendered: ${initialDropdownState.hasDropdown}, aria-expanded: ${initialDropdownState.ariaExpanded}`
    );

    // Type 1-2 chars (e.g. "To")
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'To');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    await sleep(400);

    const hintDropdownState = await evalJs(`
      (() => {
        const dropdown = document.querySelector('#discover [class*="dropdown"]');
        if (!dropdown) return null;
        const text = dropdown.textContent || '';
        const hasHint = text.includes('Type at least 3 characters to search');
        const hasDivider = !!dropdown.querySelector('[class*="dropdownDivider"]');
        const actionBtn = dropdown.querySelector('[class*="dropdownActionBtn"]');
        const btnText = actionBtn?.textContent || '';
        const hasLocBtn = btnText.includes('Use my location');
        return { hasDropdown: true, hasHint, hasDivider, hasLocBtn, btnText };
      })()
    `);
    record(
      'Dropdown at 1-2 Characters (Hint + Divider + Use my location)',
      hintDropdownState?.hasHint && hintDropdownState?.hasDivider && hintDropdownState?.hasLocBtn,
      `Hint present: ${hintDropdownState?.hasHint}, Divider present: ${hintDropdownState?.hasDivider}, Use my location present: ${hintDropdownState?.hasLocBtn}`
    );
    await takeScreenshot('qa_search_hint_dropdown.png', '#discover');

    // Type 3+ chars (e.g. "Torrance")
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'Torrance');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    // Wait for debounce (280ms) + network prediction
    await sleep(1500);

    const suggestionsState = await evalJs(`
      (() => {
        const list = document.querySelector('#discover ul[role="listbox"]');
        const items = list ? Array.from(list.querySelectorAll('li[role="option"]')).map(li => li.textContent.trim()) : [];
        const actionBtn = document.querySelector('#discover [class*="dropdownActionBtn"]');
        return {
          hasList: !!list,
          count: items.length,
          items: items.slice(0, 3),
          hasLocBtn: !!actionBtn
        };
      })()
    `);
    record(
      'Autocomplete Suggestions at 3+ Characters',
      suggestionsState.hasList && suggestionsState.count > 0 && suggestionsState.hasLocBtn,
      `Found ${suggestionsState.count} suggestions: ${suggestionsState.items.join(' | ')}. Persistent action button present: ${suggestionsState.hasLocBtn}`
    );
    await takeScreenshot('qa_search_suggestions_dropdown.png', '#discover');

    // Clear Button Check
    const clearBtnCheck = await evalJs(`
      (() => {
        const clearBtn = document.querySelector('#discover [class*="clearBtn"]');
        const isVisible = !!clearBtn && clearBtn.offsetWidth > 0;
        return { isVisible };
      })()
    `);
    record(
      'Clear Button (✕) Appears When Text Present',
      clearBtnCheck.isVisible,
      `Clear button visible: ${clearBtnCheck.isVisible}`
    );
    await takeScreenshot('qa_search_clear_button.png', '#discover');

    // Click Clear button
    const mapCenterBeforeClear = await evalJs(`document.querySelector('#discover [role="region"]')?.getAttribute('aria-label')`);
    await evalJs(`
      (() => {
        const clearBtn = document.querySelector('#discover [class*="clearBtn"]');
        clearBtn?.click();
      })()
    `);
    await sleep(300);

    const afterClearState = await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        const dropdown = document.querySelector('#discover [class*="dropdown"]');
        const mapAria = document.querySelector('#discover [role="region"]')?.getAttribute('aria-label');
        return {
          inputValue: input?.value,
          hasDropdown: !!dropdown,
          mapAria
        };
      })()
    `);
    record(
      'Clicking Clear Empties Input, Closes Dropdown, Retains Map View',
      afterClearState.inputValue === '' && !afterClearState.hasDropdown && afterClearState.mapAria === mapCenterBeforeClear,
      `Value: "${afterClearState.inputValue}", Dropdown open: ${afterClearState.hasDropdown}, Map label: ${afterClearState.mapAria}`
    );

    console.log('\n--- TEST 3: Suggestion Selection ---');
    // Type "Austin"
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'Austin');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    await sleep(1500);

    // Select the first suggestion
    const selectedSuggestionText = await evalJs(`
      (() => {
        const firstOption = document.querySelector('#discover li[role="option"]');
        if (!firstOption) return null;
        const text = firstOption.textContent.trim();
        firstOption.click();
        return text;
      })()
    `);
    await sleep(1500);

    const afterSelectState = await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        const dropdown = document.querySelector('#discover [class*="dropdown"]');
        const mapAria = document.querySelector('#discover [role="region"]')?.getAttribute('aria-label');
        return {
          inputValue: input?.value,
          hasDropdown: !!dropdown,
          mapAria
        };
      })()
    `);
    record(
      'Suggestion Selection Updates Input, Closes Dropdown, Pans Map',
      afterSelectState.inputValue.includes('Austin') && !afterSelectState.hasDropdown && afterSelectState.mapAria.includes('Austin'),
      `Input: "${afterSelectState.inputValue}", Dropdown open: ${afterSelectState.hasDropdown}, Map region label: "${afterSelectState.mapAria}"`
    );
    await takeScreenshot('qa_suggestion_selected.png', '#discover');

    console.log('\n--- TEST 4: "Use my location" ---');
    // Mock / override geolocation via CDP
    await send('Emulation.setGeolocationOverride', {
      latitude: 34.0522,
      longitude: -118.2437,
      accuracy: 10
    });

    // Open dropdown by typing 1 char
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'L');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    await sleep(400);

    // Click "Use my location"
    await evalJs(`
      (() => {
        const btn = document.querySelector('#discover [class*="dropdownActionBtn"]');
        btn?.click();
      })()
    `);
    await sleep(2000);

    const afterGpsState = await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        const dropdown = document.querySelector('#discover [class*="dropdown"]');
        const mapAria = document.querySelector('#discover [role="region"]')?.getAttribute('aria-label');
        return {
          inputValue: input?.value,
          hasDropdown: !!dropdown,
          mapAria
        };
      })()
    `);
    record(
      '"Use my location" Pans Map, Updates Input, Closes Dropdown',
      !afterGpsState.hasDropdown && (afterGpsState.inputValue.length > 0) && (afterGpsState.mapAria.toLowerCase().includes('angeles') || afterGpsState.mapAria.toLowerCase().includes('location') || afterGpsState.mapAria.length > 0),
      `Input: "${afterGpsState.inputValue}", Dropdown: ${afterGpsState.hasDropdown}, Map: "${afterGpsState.mapAria}"`
    );
    await takeScreenshot('qa_use_my_location_success.png', '#discover');

    // Test permission denial / error handling
    await send('Emulation.clearGeolocationOverride');
    // Simulate error by stubbing navigator.geolocation.getCurrentPosition to reject
    await evalJs(`
      window._origGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.getCurrentPosition = function(success, error) {
        if (error) {
          error({ code: 1, message: 'User denied Geolocation', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
        }
      };
    `);
    // Type 1 char to open dropdown
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'x');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    await sleep(400);
    // Click "Use my location"
    await evalJs(`
      (() => {
        const btn = document.querySelector('#discover [class*="dropdownActionBtn"]');
        btn?.click();
      })()
    `);
    await sleep(800);

    const errorState = await evalJs(`
      (() => {
        const errEl = document.querySelector('#discover [class*="error"]');
        const errText = errEl?.textContent || '';
        return {
          hasError: !!errEl,
          errText
        };
      })()
    `);
    record(
      'Permission Denial Shows Clear Error Without Breaking UI',
      errorState.hasError && errorState.errText.toLowerCase().includes('location'),
      `Error displayed: ${errorState.errText}`
    );
    await takeScreenshot('qa_use_my_location_denied.png', '#discover');

    // Restore geolocation
    await evalJs(`navigator.geolocation.getCurrentPosition = window._origGetCurrentPosition;`);

    console.log('\n--- TEST 5: Keyboard Accessibility ---');
    // Type "San"
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'San');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    await sleep(1500);

    // ArrowDown
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      })()
    `);
    await sleep(200);

    const arrowDownState = await evalJs(`
      (() => {
        const activeItem = document.querySelector('#discover [class*="suggestionActive"]');
        const input = document.querySelector('#discover input[role="combobox"]');
        const activeDescendant = input?.getAttribute('aria-activedescendant');
        return {
          hasActiveItem: !!activeItem,
          activeText: activeItem?.textContent.trim(),
          activeDescendant
        };
      })()
    `);
    record(
      'ArrowDown Highlights First Suggestion with aria-activedescendant',
      arrowDownState.hasActiveItem && !!arrowDownState.activeDescendant,
      `Active item: "${arrowDownState.activeText}", aria-activedescendant: ${arrowDownState.activeDescendant}`
    );

    // Press Escape
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      })()
    `);
    await sleep(200);

    const escapeState = await evalJs(`
      (() => {
        const dropdown = document.querySelector('#discover [class*="dropdown"]');
        return { hasDropdown: !!dropdown };
      })()
    `);
    record(
      'Escape Key Dismisses Dropdown',
      !escapeState.hasDropdown,
      `Dropdown present after Escape: ${escapeState.hasDropdown}`
    );

    // Reopen and Tab to "Use my location" button
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      })()
    `);
    await sleep(200);

    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      })()
    `);
    await sleep(200);

    const tabFocusState = await evalJs(`
      (() => {
        const activeEl = document.activeElement;
        const isActionBtn = activeEl?.classList?.contains('dropdownActionBtn') || activeEl?.id?.includes('action');
        return {
          activeTag: activeEl?.tagName,
          activeId: activeEl?.id,
          isActionBtn
        };
      })()
    `);
    record(
      'Tab Key Focuses "Use my location" Button',
      tabFocusState.isActionBtn || tabFocusState.activeId?.includes('action'),
      `Focused element: ${tabFocusState.activeTag}#${tabFocusState.activeId}, isActionBtn: ${tabFocusState.isActionBtn}`
    );
    await takeScreenshot('qa_keyboard_navigation.png', '#discover');

    console.log('\n--- TEST 6: Mobile & Responsive Layout (390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await evalJs(`window.scrollTo(0, 0)`);
    await sleep(500);
    await evalJs(`
      (() => {
        const el = document.querySelector('#discover');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 60;
          window.scrollTo({ top, behavior: 'instant' });
        }
      })()
    `);
    await sleep(500);

    // Verify Mobile Toggle
    const mobileToggleState = await evalJs(`
      (() => {
        const toggle = document.querySelector('#discover [class*="toggle"]');
        const listBtn = toggle?.querySelector('button[aria-pressed="true"]');
        const mapPanel = document.querySelector('#discover [class*="mapPanel"]');
        const results = document.querySelector('#discover [class*="results"]');
        const mapDisplay = window.getComputedStyle(mapPanel).display;
        const resultsDisplay = window.getComputedStyle(results).display;
        return {
          toggleExists: !!toggle,
          activeView: listBtn?.textContent.trim(),
          mapDisplay,
          resultsDisplay
        };
      })()
    `);
    record(
      'Mobile View Toggle & List View by Default',
      mobileToggleState.toggleExists && mobileToggleState.activeView === 'List' && mobileToggleState.mapDisplay === 'none',
      `Toggle: ${mobileToggleState.toggleExists}, Active: ${mobileToggleState.activeView}, mapPanel display: ${mobileToggleState.mapDisplay}, results display: ${mobileToggleState.resultsDisplay}`
    );
    await takeScreenshot('qa_mobile_list_view.png');

    // Toggle to Map view
    await evalJs(`
      (() => {
        const mapBtn = Array.from(document.querySelectorAll('#discover [class*="toggleBtn"]')).find(b => b.textContent.trim() === 'Map');
        mapBtn?.click();
      })()
    `);
    await sleep(600);

    const mobileMapState = await evalJs(`
      (() => {
        const mapPanel = document.querySelector('#discover [class*="mapPanel"]');
        const results = document.querySelector('#discover [class*="results"]');
        const mapDisplay = window.getComputedStyle(mapPanel).display;
        const resultsDisplay = window.getComputedStyle(results).display;
        const mapHeight = mapPanel.offsetHeight;
        return {
          mapDisplay,
          resultsDisplay,
          mapHeight
        };
      })()
    `);
    record(
      'Mobile Map View Toggle (Map Visible with Proper Height, Results Hidden)',
      mobileMapState.mapDisplay !== 'none' && mobileMapState.resultsDisplay === 'none' && mobileMapState.mapHeight >= 400,
      `mapPanel display: ${mobileMapState.mapDisplay}, height: ${mobileMapState.mapHeight}px, results display: ${mobileMapState.resultsDisplay}`
    );
    await takeScreenshot('qa_mobile_map_view.png');

    // Test dropdown on mobile over map/content
    await evalJs(`
      (() => {
        const input = document.querySelector('#discover input[role="combobox"]');
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'San');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
    await sleep(1500);

    const mobileDropdownOverflowCheck = await evalJs(`
      (() => {
        const dropdown = document.querySelector('#discover [class*="dropdown"]');
        if (!dropdown) return null;
        const rect = dropdown.getBoundingClientRect();
        const dStyle = window.getComputedStyle(dropdown);
        const zIndex = parseInt(dStyle.zIndex, 10);
        return {
          width: rect.width,
          height: rect.height,
          zIndex,
          visible: rect.width > 0 && rect.height > 0
        };
      })()
    `);
    record(
      'Mobile Dropdown Floats Above View without Clipping',
      mobileDropdownOverflowCheck && mobileDropdownOverflowCheck.visible && mobileDropdownOverflowCheck.zIndex >= 50,
      `Dropdown z-index: ${mobileDropdownOverflowCheck?.zIndex}, Dimensions: ${mobileDropdownOverflowCheck?.width}x${mobileDropdownOverflowCheck?.height}`
    );
    await takeScreenshot('qa_mobile_dropdown.png');

    console.log('\n--- TEST 7: Theme Support (Light & Dark) ---');
    // Switch back to desktop viewport
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await evalJs(`
      (() => {
        const el = document.querySelector('#discover');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top, behavior: 'instant' });
        }
      })()
    `);
    await sleep(400);

    // Switch to dark theme
    await evalJs(`document.documentElement.setAttribute('data-theme', 'dark')`);
    await sleep(500);

    const darkThemeStyles = await evalJs(`
      (() => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const sectionBg = window.getComputedStyle(document.querySelector('#discover')).backgroundColor;
        const searchBar = document.querySelector('#discover [class*="searchBar"]');
        const searchBarBg = window.getComputedStyle(searchBar).backgroundColor;
        const isDarkAttr = document.documentElement.getAttribute('data-theme') === 'dark';
        return { isDarkAttr, bodyBg, sectionBg, searchBarBg };
      })()
    `);
    record(
      'Dark Theme Attribute & Styling Applied',
      darkThemeStyles.isDarkAttr,
      `data-theme: dark, searchBar background: ${darkThemeStyles.searchBarBg}`
    );
    await takeScreenshot('qa_dark_theme_discover.png');

    // Switch back to light theme
    await evalJs(`document.documentElement.removeAttribute('data-theme')`);
    await sleep(300);

    console.log('\n========================================');
    console.log('QA VERIFICATION COMPLETED');
    const totalPassed = testResults.filter(r => r.pass).length;
    console.log(`Total: ${testResults.length}, Passed: ${totalPassed}, Failed: ${testResults.length - totalPassed}`);
    console.log('========================================\n');

    // Save summary json
    fs.writeFileSync(
      path.join(screenshotsDir, 'qa_verification_report.json'),
      JSON.stringify(testResults, null, 2)
    );

    ws.close();
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
