import { test,expect } from "@playwright/test";

async function fixture(page,{authenticated=true}={}){
  let paid=false,orders=0,status="pending",selection,submitted=false;
  const user={id:"1",name:"Test Learner",email:"learner@example.test",onboardingCompleted:true};
  const products=[
    {id:"1",name:"React Skill Pass",slug:"react-skill-pass",kind:"skill_pass",description:"Learn React in one complete course.",skills:[{id:"3",name:"React"}],price:{amountMinor:1899,currency:"USD"},savingsMinor:0,includes:{courses:[{id:"10",title:"React foundations"}],assessments:[{id:"20",title:"React final assessment"}],projects:[{id:"30",title:"React dashboard project"}],certificates:[{id:"40",title:"React completion"}]}},
    {id:"2",name:"Python Skill Pass",slug:"python-skill-pass",kind:"skill_pass",description:"Learn Python.",skills:[{id:"4",name:"Python"}],price:{amountMinor:1899,currency:"USD"},savingsMinor:0,includes:{courses:[{id:"11",title:"Python foundations"}],assessments:[],projects:[],certificates:[]}},
    {id:"3",name:"Frontend Career Bundle",slug:"frontend-career-bundle",kind:"career_bundle",description:"A connected frontend path.",skills:[{id:"3",name:"React"}],price:{amountMinor:4999,currency:"USD"},savingsMinor:0,includes:{courses:[{id:"10",title:"React foundations"},{id:"12",title:"JavaScript foundations"}],assessments:[],projects:[],certificates:[]}},
    {id:"4",name:"SkillForge Pro Monthly",slug:"skillforge-pro-monthly",kind:"subscription",accessDurationDays:30,description:"Thirty days of all access.",skills:[],price:{amountMinor:799,currency:"USD"},savingsMinor:0,includes:{courses:[{id:"10",title:"React foundations"},{id:"11",title:"Python foundations"},{id:"12",title:"JavaScript foundations"}],assessments:[{id:"20",title:"React final assessment"}],projects:[{id:"30",title:"React dashboard project"}],certificates:[{id:"40",title:"React completion"}]}}
  ];
  const pkrAmount=product=>product.kind==="career_bundle"?199900:product.kind==="subscription"?64900:99900;
  if(authenticated)await page.addInitScript(()=>sessionStorage.setItem("skillforge_token","test-token"));
  await page.route("**/api/**",async route=>{
    const req=route.request(),path=new URL(req.url()).pathname.replace(/^\/api/,"");
    const headers={"access-control-allow-origin":"*","access-control-allow-headers":"authorization,content-type","access-control-allow-methods":"GET,POST,OPTIONS"};
    if(req.method()==="OPTIONS")return route.fulfill({status:204,headers});
    const reply=(body,status=200)=>route.fulfill({status,headers,contentType:"application/json",body:JSON.stringify(body)});
    if(path==="/auth/me")return reply({user});
    if(path==="/auth/login")return reply({user,token:"test-token"});
    if(path==="/commerce/products")return reply(products.map(p=>({...p,hasAccess:paid&&p.id===selection?.id,manualPrice:{currency:"PKR",amountMinor:pkrAmount(p)}})));
    if(path==="/commerce/quote"){selection=products.find(p=>p.id===String(req.postDataJSON().productIds[0]));return reply({currency:"PKR",items:[],totalMinor:pkrAmount(selection)});}
    if(path==="/commerce/orders"){orders++;expect(req.postDataJSON().productIds).toEqual([selection.id]);return reply({order:{id:"90",totalMinor:pkrAmount(selection)}},201);}
    if(path==="/manual-payments/orders/90")return reply({order:{id:'90',status,currency:'PKR',total_minor:pkrAmount(selection)},methods:[{id:1,name:'Easypaisa',account_title:'Test owner',account_number:'03000000000',instructions:'Test only'}],submissions:submitted?[{id:1,status:paid?'approved':'pending',reference:'TEST1234'}]:[]});
    if(path==="/manual-payments/orders/90/proof"){expect(req.postDataJSON().amountMinor).toBe(pkrAmount(selection));submitted=true;return reply({id:1,status:'pending'},201);}
    if(path==="/payments/orders/90/checkout")return reply({orderId:"90",amountMinor:selection.price.amountMinor,currency:"USD",status},201);
    if(path==="/payments/orders/90/simulate"){paid=req.postDataJSON().type==="payment.paid";status=paid?"paid":"cancelled";return reply({status:paid?"paid":"failed"});}
    if(path==="/payments/orders/90/receipt")return reply({id:"90",status,items:[{productId:selection?.id||"1",name:selection?.name||"React Skill Pass"}]});
    if(path==="/courses")return reply({courses:[{id:"10",skillId:"3",skillName:"React",title:"React foundations",description:"Learn React",difficulty:"beginner",estimatedHours:18,lessonCount:12,isPremium:true,hasAccess:paid,requiredProducts:[{id:"1",name:"React Skill Pass"}]}]});
    if(path==="/assessments")return reply({quizzes:[{id:"20",title:"React final assessment",description:"Check your React skills",version:1,questionCount:12,passPercent:70,maxAttempts:3,isPremium:true,hasAccess:paid,requiredProducts:[{id:"1"}]}]});
    return reply({error:{message:"Fixture endpoint unavailable"}},404);
  });
  return {orders:()=>orders,approve:()=>{paid=true;status="paid";}};
}

test("free locks lead to selection, review, confirmed payment and only the selected content",async({page},testInfo)=>{
  const state=await fixture(page);const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/courses");await expect(page.getByText("Locked · paid access")).toBeVisible();await page.getByRole("link",{name:"View unlock options"}).click();
  await expect(page.getByRole("heading",{name:"React Skill Pass",exact:true})).toBeVisible();expect(state.orders()).toBe(0);
  await page.getByRole("link",{name:"Select and review"}).click();
  await expect(page.getByText(/Total:.*999/)).toBeVisible();await expect(page.getByText("React dashboard project",{exact:true})).toBeVisible();expect(state.orders()).toBe(0);
  await page.screenshot({path:testInfo.outputPath("purchase-review.png"),fullPage:true});
  await page.getByRole("button",{name:"Confirm selection and continue"}).click();await expect(page.getByRole("heading",{name:"Pay for your selection"})).toBeVisible();expect(state.orders()).toBe(1);
  await page.getByLabel("Transaction ID / bank reference").fill("TEST1234");await page.getByLabel(/Payment date/).fill("2026-01-01");await page.getByLabel("Amount transferred (PKR)").fill("999");await page.getByLabel(/Payment screenshot/).setInputFiles({name:"proof.png",mimeType:"image/png",buffer:Buffer.from("89504e470d0a1a0a","hex")});await page.getByRole("button",{name:"Submit for owner approval"}).click();await expect(page.getByText("Your proof is awaiting review.",{exact:false})).toBeVisible();await expect(page.getByRole("link",{name:"Start learning",exact:true})).toHaveCount(0);state.approve();await page.getByRole("button",{name:"Refresh payment status"}).click();await expect(page.getByRole("heading",{name:"Payment approved",level:2})).toBeVisible();
  await page.getByRole("link",{name:"Start learning",exact:true}).click();await expect(page.getByRole("link",{name:"React foundations",exact:true})).toBeVisible();await expect(page.getByText("Python foundations")).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});

test("career selection shows its own price and included courses",async({page})=>{
  const state=await fixture(page);await page.goto("/pricing");await page.getByRole("link",{name:"Choose a career",exact:true}).click();await expect(page.getByRole("heading",{name:"Frontend Career Bundle"})).toBeVisible();await expect(page.getByRole("heading",{name:"React Skill Pass",exact:true})).toHaveCount(0);
  await page.getByRole("link",{name:"Select and review"}).click();await expect(page.getByText(/Total:.*1,999/)).toBeVisible();await expect(page.getByText("JavaScript foundations",{exact:true})).toBeVisible();expect(state.orders()).toBe(0);
});

test("monthly card opens a 30-day all-access purchase without changing annual or lifetime",async({page})=>{
  await fixture(page);await page.goto('/pricing');
  const monthly=page.getByRole('article').filter({has:page.getByRole('heading',{name:'SkillForge Pro Monthly'})});
  await expect(monthly.getByText('PKR 649')).toBeVisible();
  await monthly.getByRole('link',{name:'Choose monthly access'}).click();
  await expect(page.getByRole('heading',{name:'SkillForge Pro Monthly'})).toBeVisible();
  await expect(page.getByText(/Total:.*649/)).toBeVisible();
  await expect(page.getByText(/manual 30-day renewal/i)).toBeVisible();
  await page.goto('/pricing');
  await expect(page.getByRole('heading',{name:'SkillForge Pro Annual'})).toBeVisible();
  await expect(page.getByText('$77.99')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Founding All Access'})).toBeVisible();
  await expect(page.getByText('$120.99')).toBeVisible();
});

test("login keeps the chosen product and unpaid order grants no content",async({page})=>{
  await fixture(page,{authenticated:false});await page.goto("/purchase/1/confirm");await expect(page.getByRole("heading",{name:"Welcome back"})).toBeVisible();await page.getByLabel("Email",{exact:true}).fill("learner@example.test");await page.getByLabel("Password",{exact:true}).fill("Password123!");await page.getByRole("button",{name:"Log in",exact:true}).click();
  await expect(page.getByRole("heading",{name:"React Skill Pass",exact:true})).toBeVisible();await page.getByRole("button",{name:"Confirm selection and continue"}).click();await expect(page.getByRole("heading",{name:"Pay for your selection"})).toBeVisible();await expect(page.getByRole("link",{name:"Administration",exact:true})).toHaveCount(0);
  await page.goto("/my-access/1");await expect(page.getByRole("link",{name:"Review this selection"})).toBeVisible();await expect(page.getByRole("link",{name:"React foundations",exact:true})).toHaveCount(0);
});

test("typing a success URL cannot manufacture paid access",async({page})=>{
  await fixture(page);await page.goto("/checkout/90/success");await expect(page.getByRole("heading",{name:"Payment is not confirmed"})).toBeVisible();await expect(page.getByRole("link",{name:"Start React Skill Pass"})).toHaveCount(0);
  await page.goto("/assessments");await expect(page.getByText("Locked · paid access")).toBeVisible();await expect(page.getByRole("link",{name:"Open assessment"})).toHaveCount(0);
});
