
import { getSalesOverTime } from '../src/lib/analytics';

async function testLib() {
  try {
    console.log("Calling getSalesOverTime...");
    const data = await getSalesOverTime(30);
    console.log("Result:", JSON.stringify(data, null, 2));

    // Check if any day has non-zero revenue
    const hasData = data.some(d => d.revenue > 0);
    console.log("Has non-zero revenue?", hasData);
  } catch (e) {
    console.error(e);
  }
}

testLib();
