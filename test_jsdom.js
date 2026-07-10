const { JSDOM } = require("jsdom");
const dom = new JSDOM(`
  <select id="sel">
    <option value="0">Zero</option>
    <option value="1">One</option>
  </select>
`);
const sel = dom.window.document.getElementById("sel");
sel.value = 1; // Integer
console.log("Selected value:", sel.value);
