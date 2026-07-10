const fs = require('fs');

const jsPath = 'script.js';
// We don't want to modify script.js to delete, we want to modify localStorage. But we can't do that from here!
// We can't access localStorage from Node.js!
