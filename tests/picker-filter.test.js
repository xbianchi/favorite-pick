const test = require('node:test');
const assert = require('node:assert/strict');

// Stub localStorage for the Picker since it's used during initialization
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const Picker = require('../picker.js').Picker;

test('Picker filters items based on selected franchise and seasons', () => {
  const items = [
    { id: 'a', franchise: 'usa', season: 1 },
    { id: 'b', franchise: 'uk', season: 1 },
    { id: 'c', franchise: 'usa', season: 2 }
  ];

  const franchiseSeasons = {
    usa: [1, 2],
    uk: [1]
  };

  const picker = new Picker({
    items,
    defaultSettings: { franchise: 'all', seasons: [] },
    shouldIncludeItem: (item, settings) => {
      const franchise = settings.franchise || 'all';
      if (franchise !== 'all' && item.franchise !== franchise) {
        return false;
      }
      const seasons = settings.seasons || [];
      if (franchise === 'all' || seasons.length === 0 || seasons.length === (franchiseSeasons[franchise] || []).length) {
        return true;
      }
      return seasons.indexOf(item.season) !== -1;
    }
  });

  assert.deepStrictEqual(picker.state.items, ['a', 'b', 'c']);

  picker.setSettings({ franchise: 'usa', seasons: [2] });
  assert.deepStrictEqual(picker.state.items, ['c']);

  picker.setSettings({ franchise: 'uk', seasons: [] });
  assert.deepStrictEqual(picker.state.items, ['b']);

  picker.setSettings({ franchise: 'all', seasons: [] });
  assert.deepStrictEqual(picker.state.items, ['a', 'b', 'c']);
});
