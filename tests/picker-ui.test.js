const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// Set up DOM environment
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

const $ = require('jquery');
const PickerUI = require('../picker-ui.js');

test('PickerUI uses getItemImageUrl callback when image is missing', () => {
  const elements = {
    evaluating: $('<ul></ul>'),
    pick: $('<button></button>'),
    pass: $('<button></button>'),
    undo: $('<button></button>'),
    redo: $('<button></button>')
  };

  const pickerUI = new PickerUI({}, {
    elements,
    getItemImageUrl: () => 'https://example.com/image.png'
  });

  const item = { id: '1', name: 'Item 1' }; // no image property
  const elem = pickerUI.getItemElem(item, {});
  const img = elem.find('img');

  assert.ok(img.length > 0, 'Image element should exist');
  assert.strictEqual(img.attr('src'), 'https://example.com/image.png');
});
