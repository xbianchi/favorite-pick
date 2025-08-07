const test = require('node:test');
const assert = require('node:assert/strict');
// Stub localStorage for the Picker since it's used during initialization
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const Picker = require('../picker.js').Picker;

test('Picker filters items based on selected seasons', () => {
  const items = [
    { id: 'a', season: 1 },
    { id: 'b', season: 2 },
    { id: 'c', season: 3 }
  ];

  const allSeasons = [1, 2, 3];

  const picker = new Picker({
    items,
    defaultSettings: { seasons: allSeasons.slice() },
    shouldIncludeItem: (item, settings) => {
      const seasons = settings.seasons || [];
      if (seasons.length === 0 || seasons.length === allSeasons.length) {
        return true;
      }
      return seasons.indexOf(item.season) !== -1;
    }
  });

  assert.deepStrictEqual(picker.state.items, ['a', 'b', 'c']);

  picker.setSettings({ seasons: [2] });
  assert.deepStrictEqual(picker.state.items, ['b']);

  picker.setSettings({ seasons: [] });
  assert.deepStrictEqual(picker.state.items, ['a', 'b', 'c']);
});
