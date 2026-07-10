function test() {
  const currentPortals = [{ name: 'Test' }];
  
  window.renderPortals = () => {
    console.log('Rendering...');
    try {
      ledger.forEach(() => {});
      console.log('Ledger works');
    } catch (e) {
      console.error('Error:', e.message);
    }
  };

  const ledger = [1, 2, 3];
}

test();
window.renderPortals();
