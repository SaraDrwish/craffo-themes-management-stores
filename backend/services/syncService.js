import { fetchTmsThemesAndCategories } from './tmsApi.js';
import { importDiscordLinks } from './discordService.js';
import { backupDatabase } from './backupService.js';

// لا توجد مزامنة تلقائية - فقط دوال يمكن استدعاؤها يدوياً
export async function manualSync() {
  console.log('Manual sync started');
  await fetchTmsThemesAndCategories();
  await importDiscordLinks();
  backupDatabase();
  console.log('Manual sync completed');
}

// تشغيل أولي لجلب البيانات عند بدء السيرفر (مرة واحدة فقط)
setTimeout(async () => {
  await fetchTmsThemesAndCategories();
}, 3000);