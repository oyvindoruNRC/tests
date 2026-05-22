import { test, expect } from '@playwright/test';
import { loginUrl, TIMEOUTS } from '../../../env';





test.describe('HCM New Employee Generation', () => {
  test('User can generate a new employee', async ({ page }) => {
    // Go to a known post-login HCM landing page
    await page.goto(loginUrl('HCM_BASE_URL'));

    //Ensure that you have reached the front page
    await page.getByRole('link', {name: "Oracle Logo Home"}).click();

    await expect(
    page.getByRole('tab', {name: "Me"})
    ).toBeVisible();

    const testDate = process.env.TESTDATE;
if (!testDate) throw new Error('TESTDATE environment variable is not set');

    //Hire a new employee.
    await page.getByRole('tab', {name: "My Client Groups"}).click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Show more quick actions' }).scrollIntoViewIfNeeded();
    await page.getByRole('link', { name: 'Show more quick actions' }).click();

    //Navigate to the Hire an Employee form
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.getByRole('link',{name: /Hire an Employee/}).click();
    await page.waitForTimeout(TIMEOUTS.MED);
    await page.waitForLoadState('networkidle');
  
    await expect (page.getByRole('heading', {name: "Info to include"})).toBeVisible();

    //Navigate the Hire Employee form
    const continuePage=page.getByRole('button', {name: "Continue"});
    await continuePage.scrollIntoViewIfNeeded();
    await continuePage.click();
    
    //Fill the Proposed Start Date box
    
    const hireEmployeeDate = page.getByRole('combobox', { name: /When is the employee hire date?/i });
    await hireEmployeeDate.fill(process.env.TESTDATE!);
    await page.waitForLoadState('networkidle');
    await hireEmployeeDate.press('Enter');
    await expect(hireEmployeeDate).toHaveValue(process.env.TESTDATE!);

    await page.waitForTimeout(TIMEOUTS.LONG);

    //Fill the Legal Employer box
    const legalEmployer = page.getByRole('combobox', { name: /Legal Employer/i });
    const currentValueLE = await legalEmployer.inputValue();

    if(currentValueLE!==('Flyktninghjelpen (Norwegian Refugee Council)')){
    await legalEmployer.fill('Flyktninghjelpen (Norwegian Refugee Council)');
    await page.waitForLoadState('networkidle');
    await legalEmployer.press('Enter');await page.waitForLoadState('networkidle');
    await expect(legalEmployer).toHaveValue('Flyktninghjelpen (Norwegian Refugee Council)');    };
     
    await page.waitForTimeout(TIMEOUTS.LONG);
    
    //Fill the What's the way to hire an employee? box. This box sometimes autofills
    const wayToAdd = page.getByRole('combobox', { name: /What's the way to hire an employee?/i });
    const currentValueAdd = await wayToAdd.inputValue();

    if(currentValueAdd!==('Hire')){
    await wayToAdd.fill('Hire');await page.waitForTimeout(TIMEOUTS.LONG);
    await wayToAdd.press('ArrowDown');
    await wayToAdd.press('Enter');await page.waitForTimeout(TIMEOUTS.LONG);
    await expect(wayToAdd).toHaveValue('Hire');    };
    
    await page.waitForTimeout(TIMEOUTS.LONG);

    //Fill the Why are you hiring an employee? box
    const whyHireWorker = page.getByRole('combobox', { name: /Why are you hiring an employee?/i });
    const whyCurrent = await whyHireWorker.inputValue();

    if  (whyCurrent!==('Hire to fill vacant position')){
    await whyHireWorker.fill('Hire to fill vacant position');
    await page.waitForTimeout(TIMEOUTS.LONG);
    await whyHireWorker.press('ArrowDown');
    await whyHireWorker.press('Enter');
    await page.waitForTimeout(TIMEOUTS.LONG);
    await expect(whyHireWorker).toHaveValue('Hire to fill vacant position');    };

    //Fill the Business Unit box
    const businessUnit = page.getByRole('combobox', { name: /Business Unit/i });

    await businessUnit.fill('Norway');
    await page.waitForLoadState('networkidle');
    await businessUnit.press('Enter');
    await expect(businessUnit).toHaveValue('Norway');
    await page.waitForLoadState('networkidle');

    //Fill the Position box

    const position = page.getByRole('combobox', { name: /Position/i });
    await position.fill('Donor Service Assistant Norway');
    await position.press('Enter');
    await page.waitForLoadState('networkidle');
    await expect(position).toHaveValue('Donor Service Assistant Norway');
    await page.waitForLoadState('networkidle');

    //Navigate to the Personal Details menu

    await continuePage.scrollIntoViewIfNeeded();
    await continuePage.click();

    
    //Fill the First Name box

    const firstName1 = page.getByRole('textbox', { name: /First Name 1/i });
    await firstName1.fill('Magma');
    await expect(firstName1).toHaveValue('Magma');

    //Fill the Last Name box

    const lastName2 = page.getByRole('textbox', { name: /Last Name 2/i });
    await lastName2.fill('Lava');
    await expect(lastName2).toHaveValue('Lava');

       
    //Navigate to Position Override menu

    await continuePage.scrollIntoViewIfNeeded();
    await continuePage.click();
    await page.waitForLoadState('networkidle');

    //Navigate to Assignment menu
    
    
    await expect (page.getByRole('heading', {name: "Assignment"})).toBeVisible();

    await continuePage.scrollIntoViewIfNeeded();
    await continuePage.click();
    await page.waitForLoadState('networkidle');

    //Submit form
    
    const submitPage=page.getByRole('button', {name: "Submit"});
    await submitPage.scrollIntoViewIfNeeded();
    await submitPage.click();


  });
});