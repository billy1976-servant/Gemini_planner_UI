/**
 * Diagnostic script to trace Gibson products pipeline
 * Run with: node diagnose-products.js
 */

const path = require('path');
const fs = require('fs');

// Import the compiler functions
const { loadProducts } = require('./src/lib/siteCompiler/loaders.ts');
const { normalizeSiteData } = require('./src/lib/siteCompiler/normalize.ts');

console.log('=== GIBSON PRODUCTS DIAGNOSTIC ===\n');

const domain = 'gibson-com';

// Step 1: Load products
console.log('1. Loading products...');
const productGraph = loadProducts(domain);

if (!productGraph) {
  console.log('❌ FAILED: loadProducts returned null');
  process.exit(1);
}

// Step 2: Extract products (simulate normalizeSiteData)
console.log('\n2. Extracting products...');
// We need to manually call extractProducts since it's not exported
// For now, just check the structure
const rawCount = productGraph?.products?.length || 0;
console.log(`Raw products in graph: ${rawCount}`);

// Step 3: Check final model
console.log('\n3. Checking final compiled model...');
// We'd need to call compileSite, but that requires all loaders
// Instead, let's just verify the file structure

const filePath = path.join(process.cwd(), 'src', 'content', 'compiled', 'sites', domain, 'product.graph.json');
console.log(`Product file: ${filePath}`);
console.log(`File exists: ${fs.existsSync(filePath)}`);

if (fs.existsSync(filePath)) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Products array exists: ${Array.isArray(content?.products)}`);
  console.log(`Products count: ${content?.products?.length || 0}`);
  
  if (content?.products?.length > 0) {
    console.log('\nFirst 3 products:');
    content.products.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i + 1}. Name: ${p.name || p.title || 'N/A'}, Category: ${p.category || p.type || 'N/A'}`);
    });
  }
}

console.log('\n=== DIAGNOSTIC COMPLETE ===');
console.log('\nTo see full trace, check server console when accessing:');
console.log('http://localhost:3000/api/sites/gibson-com');
