'use strict';

/**
 * Manual integration test - run against live Billboard.com
 * Usage: node tests/test.js
 */

const { getChart, listCharts } = require('../src/index');

async function runTests() {
  console.log('=== Billboard Top 100 Manual Test ===\n');

  try {
    // Test 1: Get current Hot 100
    console.log('Test 1: Fetching current Hot 100...');
    const currentChart = await getChart('hot-100');
    console.log(`  Week: ${currentChart.week}`);
    console.log(`  Songs: ${currentChart.songs.length}`);
    console.log(`  #1: "${currentChart.songs[0]?.title}" by ${currentChart.songs[0]?.artist}`);
    console.log('  PASSED\n');

    // Test 2: Get historical chart
    console.log('Test 2: Fetching historical Hot 100 (2016-11-19)...');
    const historicalChart = await getChart('hot-100', '2016-11-19');
    console.log(`  Week: ${historicalChart.week}`);
    console.log(`  Songs: ${historicalChart.songs.length}`);
    console.log(`  #1: "${historicalChart.songs[0]?.title}" by ${historicalChart.songs[0]?.artist}`);
    console.log('  PASSED\n');

    // Test 3: Get different chart
    console.log('Test 3: Fetching Billboard 200...');
    const billboard200 = await getChart('billboard-200');
    console.log(`  Week: ${billboard200.week}`);
    console.log(`  Items: ${billboard200.songs.length}`);
    console.log(`  #1: "${billboard200.songs[0]?.title}" by ${billboard200.songs[0]?.artist}`);
    console.log('  PASSED\n');

    // Test 4: List all charts
    console.log('Test 4: Listing all charts...');
    const charts = await listCharts();
    console.log(`  Found ${charts.length} charts`);
    console.log(`  First 5: ${charts.slice(0, 5).map((c) => c.name).join(', ')}`);
    console.log('  PASSED\n');

    // Test 5: Callback API
    console.log('Test 5: Testing callback API...');
    await new Promise((resolve, reject) => {
      getChart('hot-100', (err, chart) => {
        if (err) {
          reject(err);
        } else {
          console.log(`  Got ${chart.songs.length} songs via callback`);
          resolve();
        }
      });
    });
    console.log('  PASSED\n');

    console.log('=== All tests passed! ===');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

runTests();
