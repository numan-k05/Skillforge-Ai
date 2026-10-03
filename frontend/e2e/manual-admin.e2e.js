import {test,expect} from '@playwright/test';

async function fixture(page,owner=true){
  let approved=false;
  await page.addInitScript(()=>sessionStorage.setItem('skillforge_token','test-token'));
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname.replace(/^\/api/,'');
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    const reply=body=>route.fulfill({headers,contentType:'application/json',body:JSON.stringify(body)});
    if(path==='/auth/me')return reply({user:{id:'1',email:'owner@example.test',name:'Owner',isOwnerAdmin:owner,onboardingCompleted:true}});
    if(path==='/manual-payments/admin/settings')return reply({methods:[{id:1,name:'Easypaisa',account_title:'Test owner',account_number:'03000000000',instructions:'Check account title',enabled:true}],products:[{id:1,name:'React Skill Pass',amount_minor:75000}]});
    if(path==='/manual-payments/admin/submissions')return reply([{id:1,order_id:90,status:approved?'approved':'pending',order_status:approved?'paid':'pending',email:'student@example.test',name:'Student',products:'React Skill Pass',reference:'TEST1234',amount_minor:75000,currency:'PKR',paid_date:'2026-01-01',review_note:'',destination:{name:'Easypaisa',account_number:'03000000000',account_title:'Test owner'}}]);
    if(path==='/manual-payments/admin/submissions/1/review'){expect(request.postDataJSON()).toMatchObject({decision:'approved',verified:true});approved=true;return reply({status:'approved'});}
    if(path==='/admin/overview')return reply({users:2,courses:8});
    if(path==='/admin/users')return reply({users:[]});
    if(path==='/admin/audits')return reply({audits:[]});
    if(path==='/admin/commission-policies'||path==='/referrals/admin/withdrawals')return reply([]);
    if(path==='/commerce/account')return reply({access:[],orders:[]});
    return reply({});
  });
}
test('owner reviews a payment only after confirming actual bank credit',async({page},testInfo)=>{
  await fixture(page);await page.goto('/admin');
  await expect(page.getByRole('heading',{name:'Payment approvals'})).toBeVisible();
  const approve=page.getByRole('button',{name:'Approve and unlock selection'});await expect(approve).toBeDisabled();
  await page.getByText('Payment accounts and PKR prices',{exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Account title',exact:true})).toHaveValue('Test owner');
  await page.getByLabel('I verified the matching transaction and full amount in my bank or Easypaisa account.').check();
  await page.screenshot({path:testInfo.outputPath('owner-payment-review.png'),fullPage:true});
  await approve.click();await expect(page.getByRole('heading',{name:'Order #90 — approved'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('learner cannot open the admin dashboard or see its navigation',async({page})=>{
  await fixture(page,false);await page.goto('/admin');await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/purchases');await expect(page.getByRole('link',{name:'Administration',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Payment approvals'})).toHaveCount(0);
});
