
try {
  require('../src/lib/metafields');
  console.log('Syntax check passed');
} catch (e) {
  console.error('Syntax check failed:', e);
}
