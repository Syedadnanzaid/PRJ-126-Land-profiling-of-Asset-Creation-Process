import { getDashboardAnalytics } from './src/modules/analytics/analytics.service';
import prisma from './src/config/database';

async function test() {
  try {
    const apiResult = await getDashboardAnalytics();
    console.log("API DISTRIBUTION:");
    console.log(JSON.stringify(apiResult.distribution, null, 2));
    
    console.log("API TOTAL ASSETS:");
    console.log(apiResult.statistics.totalAssets);

    const dbResult = await prisma.landAsset.groupBy({
      by: ['asset_type'],
      _count: { _all: true }
    });
    console.log("DB DISTRIBUTION:");
    console.log(JSON.stringify(dbResult, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
