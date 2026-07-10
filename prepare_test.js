const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

const mockDOM = `
class MockElement {
  constructor(id) { this.id = id; this.style = {}; this.classList = { add: ()=>{}, remove: ()=>{}, toggle: ()=>{} }; this.options = []; this.value = ''; }
  addEventListener() {}
  appendChild() {}
  querySelector() { return new MockElement(); }
  querySelectorAll() { return [new MockElement()]; }
  dispatchEvent() {}
}

global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = {
  localStorage: global.localStorage,
  addEventListener: () => {},
  editingTransactionIndex: null
};
global.document = {
  getElementById: (id) => new MockElement(id),
  querySelectorAll: () => [new MockElement()],
  createElement: () => new MockElement(),
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') {
      try {
        cb();
        console.log('Finished DOMContentLoaded successfully!');
      } catch(e) {
        console.error('CRASH in DOMContentLoaded:', e);
      }
    }
  }
};
global.Event = class {};
global.alert = () => {};
`;

fs.writeFileSync('test_run.js', mockDOM + js);
