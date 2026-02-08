import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * CAPTURE MISSING SCREENSHOTS - Manual Navigation
 * Navigate to actual create forms and capture real screenshots
 */

const BASE_URL = 'https://dev.firm.aiwyn-dev-multi.app/firm-portal';
const SCREENSHOT_DIR = '.captures/missing-forms/screenshots';

const WAIT_PAGE_LOAD = 4000;
const WAIT_MODAL = 2500;

let page, context;
let screenshotCounter = 0;

async function captureScreenshot(name) {
  const filename = `${String(screenshotCounter).padStart(4, '0')}-${name}.png`;
  const filepath = join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`📸 Captured: ${filename}`);
  screenshotCounter++;
  return filename;
}

async function init() {
  console.log('🚀 Capturing REAL screenshots from running software...\n');

  await mkdir(SCREENSHOT_DIR, { recursive: true });

  console.log('🌐 Opening browser...');
  context = await chromium.launchPersistentContext('.browser-profile', {
    headless: false,
    viewport: { width: 2560, height: 1440 },
  });

  page = context.pages()[0] || await context.newPage();
  await page.goto(BASE_URL);
  await page.waitForTimeout(WAIT_PAGE_LOAD);

  // Handle login if needed
  console.log('🔐 Checking authentication...');
  try {
    const loginButton = page.locator('button:has-text("Log in")');
    if (await loginButton.isVisible({ timeout: 3000 })) {
      console.log('   Need to log in - clicking button...');
      await loginButton.click();
      await page.waitForTimeout(WAIT_PAGE_LOAD);

      // Wait for auth to complete automatically
      console.log('   ⏸️  Please log in manually in the browser window...');
      console.log('   Waiting for authentication to complete (up to 2 minutes)...');

      // Wait for a known element that appears after login (e.g., Clients link in sidebar)
      try {
        await page.waitForSelector('a:has-text("Clients")', { timeout: 120000 });
        console.log('   ✓ Login detected!');
        await page.waitForTimeout(WAIT_PAGE_LOAD);
      } catch (e) {
        console.log('   ⚠️  Login timeout - continuing anyway (you may need to be faster next time)...');
        await page.waitForTimeout(WAIT_PAGE_LOAD);
      }
    }
  } catch (e) {
    console.log('   Already authenticated ✓');
  }

  console.log('\n📋 Capturing missing form screenshots...\n');

  // 1. CONTACTS
  try {
    console.log('1️⃣  Navigating to Contacts...');

    // Navigate to Clients & Contacts section
    const clientsContactsLink = page.locator('a:has-text("Clients & Contacts")').first();
    await clientsContactsLink.click();
    await page.waitForTimeout(WAIT_PAGE_LOAD);

    // Click the "Contacts" tab (not the Clients tab)
    const contactsTab = page.locator('button:has-text("Contacts"), a:has-text("Contacts")').nth(1); // nth(1) to skip sidebar link
    await contactsTab.click();
    await page.waitForTimeout(WAIT_PAGE_LOAD);

    await captureScreenshot('contacts-list-REAL');

    // Look for New Contact button (various possible text)
    const newContactBtn = page.locator('button:has-text("New Contact"), button:has-text("Add Contact"), button:has-text("+ Contact"), button:has-text("New")').first();

    if (await newContactBtn.isVisible({ timeout: 3000 })) {
      console.log('   Found new contact button - clicking...');
      await newContactBtn.click();
      await page.waitForTimeout(WAIT_MODAL);

      await captureScreenshot('contacts-create-form-REAL');
      console.log('   ✅ Contacts form captured!\n');

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️  Could not find new contact button\n');
    }
  } catch (e) {
    console.log(`   ❌ Error with Contacts: ${e.message}\n`);
  }

  // 2. TASKS
  try {
    console.log('2️⃣  Navigating to Tasks...');

    // Try different ways to find Tasks link
    let tasksLink = page.locator('a[href*="tasks"], a:has-text("Tasks")').first();

    if (await tasksLink.isVisible({ timeout: 5000 })) {
      await tasksLink.click();
      await page.waitForTimeout(WAIT_PAGE_LOAD);

      await captureScreenshot('tasks-list-REAL');

      // Look for New Task button
      const newTaskBtn = page.locator('button:has-text("New Task"), button:has-text("Add Task"), button:has-text("+ Task"), button:has-text("New"), button:has-text("Create")').first();

      if (await newTaskBtn.isVisible({ timeout: 3000 })) {
        console.log('   Found new task button - clicking...');
        await newTaskBtn.click();
        await page.waitForTimeout(WAIT_MODAL);

        await captureScreenshot('tasks-create-form-REAL');
        console.log('   ✅ Tasks form captured!\n');

        // Close dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log('   ⚠️  Could not find new task button\n');
      }
    } else {
      console.log('   ⚠️  Could not find Tasks link - may not be in navigation\n');
    }
  } catch (e) {
    console.log(`   ❌ Error with Tasks: ${e.message}\n`);
  }

  // 3. WIP (just capture what's actually there)
  try {
    console.log('3️⃣  Navigating to WIP...');

    const wipLink = page.locator('a:has-text("WIP")').first();
    await wipLink.click();
    await page.waitForTimeout(WAIT_PAGE_LOAD);

    await captureScreenshot('wip-main-view-REAL');
    console.log('   ✅ WIP view captured!\n');
  } catch (e) {
    console.log(`   ❌ Error with WIP: ${e.message}\n`);
  }

  // 4. Accounts Receivable (just capture what's actually there)
  try {
    console.log('4️⃣  Navigating to Accounts Receivable...');

    const arLink = page.locator('a:has-text("Accounts Receivable"), a:has-text("Collections")').first();
    await arLink.click();
    await page.waitForTimeout(WAIT_PAGE_LOAD);

    await captureScreenshot('accounts-receivable-main-view-REAL');
    console.log('   ✅ AR view captured!\n');
  } catch (e) {
    console.log(`   Error with AR: ${e.message}\n`);
  }

  // 5. Settings (just capture what's actually there)
  try {
    console.log('5️⃣  Navigating to Settings...');

    const settingsLink = page.locator('a:has-text("Settings")').first();
    await settingsLink.click();
    await page.waitForTimeout(WAIT_PAGE_LOAD);

    await captureScreenshot('settings-main-view-REAL');
    console.log('   ✅ Settings view captured!\n');
  } catch (e) {
    console.log(`   ❌ Error with Settings: ${e.message}\n`);
  }

  console.log('\n✅ Screenshot capture complete!');
  console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  await context.close();
}

init().catch(console.error);
