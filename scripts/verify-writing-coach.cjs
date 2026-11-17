// Uses an isolated browser profile; never opens or changes the user's browser data.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const runtime=process.env.WORDLY_PLAYWRIGHT_MODULE;
const {chromium}=runtime?require(runtime):require('playwright');
const base=process.env.WORDLY_COACH_URL||'http://127.0.0.1:43142';
const packFile=process.env.WORDLY_COACH_PACK;
const output=path.resolve(process.env.WORDLY_COACH_OUTPUT||path.join(__dirname,'../tmp/writing-coach-merge'));fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/');await page.locator('[data-page="writing-coach"]').waitFor();
  // These records exist only in this disposable browser context.
  await page.evaluate(async()=>{
   db.logs.push({id:'coach-preservation-log',date:1,title:'旧听写',results:[{en:'example',entered:'exampel',correct:false}]});
   db.mistakes.example={en:'example',zh:'例子',count:2};
   db.speaking.drafts['coach-preservation']={notes:'原有口语草稿'};
   db.reading.writing.completed=[2,4];
   db.knowledge=WordlyStudyCore.normalizeState({entries:[{id:'existing-private-card',title:'原有私人写作记录',kind:'knowledge',categories:['writing'],summary:'原有讲解',sources:[{path:'original.md'}]}],review:{'existing-private-card':{stage:2,due:900,last:800,reviews:3,lapses:1}}});
   db=normalizeDb(db);migrateReview();if(!save())throw Error('Cannot save test fixture');
   await persistRecording({id:'coach-preservation-audio',date:1,part:2,blob:new Blob(['existing recording'],{type:'audio/webm'})});
  });
  const before=await page.evaluate(()=>JSON.parse(JSON.stringify(db)));
  await page.locator('[data-page="writing-coach"]').click();
  if(packFile){await page.locator('[data-coach-file]').setInputFiles(packFile);await page.locator('[data-coach-status]').filter({hasText:'已合并 19'}).waitFor();}
  await page.locator('[data-coach-section]').first().waitFor();
  const after=await page.evaluate(()=>JSON.parse(JSON.stringify(db)));
  assert.equal(after.writingCoach.sections.length,19);assert.equal(after.writingCoach.entryIds.length,49);
  for(const field of ['words','logs','mistakes','daily','reading','review','speaking','studyPlan','wordTasks','memoryTyping'])assert.deepEqual(after[field],before[field],field);
  assert.deepEqual(after.knowledge.entries.find(e=>e.id==='existing-private-card'),before.knowledge.entries[0]);
  assert.deepEqual(after.knowledge.review['existing-private-card'],before.knowledge.review['existing-private-card']);
  for(let i=0;i<19;i++){await page.locator(`[data-coach-section="${i}"]`).click();assert.equal(await page.locator('[data-coach-body] h2').first().textContent(),after.writingCoach.sections[i].title);}
  await page.locator('[data-coach-section="14"]').click();await page.screenshot({path:path.join(output,'desktop.png')});
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-coach-export]').click();const download=await downloadPromise;
  const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.sections.length,19);assert.equal(exported.pack.entries.length,49);
  await page.route('**/personal-writing/**',route=>route.abort());await page.reload();await page.locator('[data-coach-section]').first().waitFor();
  assert.equal(await page.locator('[data-coach-section]').count(),19);
  await page.locator('[data-coach-file]').setInputFiles({name:'coach.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
  await page.getByRole('status').filter({hasText:'已合并 19'}).waitFor();
  const repeated=await page.evaluate(()=>JSON.parse(JSON.stringify(db)));assert.equal(repeated.knowledge.entries.length,after.knowledge.entries.length);
  for(const field of ['words','logs','mistakes','daily','reading','review','speaking','studyPlan','wordTasks','memoryTyping'])assert.deepEqual(repeated[field],before[field],field);
  const snapshot=await page.evaluate(()=>JSON.stringify(db));
  await page.locator('[data-coach-file]').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"sections":[]}')});
  await page.getByRole('status').filter({hasText:'导入未完成'}).waitFor();assert.equal(await page.evaluate(()=>JSON.stringify(db)),snapshot);
  const restored=await page.evaluate(()=>{const backup=JSON.parse(JSON.stringify(db));if(!restoreLearningBackup(backup))throw Error('Restore failed');return db.writingCoach;});assert.deepEqual(restored,after.writingCoach);
  await page.locator('[data-coach-cards]').click();await page.locator('#studyLibraryMount').waitFor();assert.equal(await page.locator('[data-page="knowledge"]').getAttribute('aria-current'),'page');
  await page.locator('[data-page="writing-coach"]').click();await page.locator('[data-coach-section]').first().waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-page="hub-writing"]').click();await page.locator('[data-sd-route="writing-coach"]').click();
  await page.locator('[data-coach-section="14"]').click();
  assert.ok(await page.locator('.wc-layout').evaluate(el=>el.getBoundingClientRect().right<=innerWidth+1));await page.screenshot({path:path.join(output,'mobile.png')});
  // A second empty profile can import the file without the private content endpoint.
  const second=await browser.newContext();const imported=await second.newPage();imported.on('pageerror',e=>errors.push(e.message));
  await imported.route('**/personal-writing/**',route=>route.abort());await imported.goto(base+'/#writing-coach');await imported.locator('[data-coach-file]').waitFor();
  const hostile=structuredClone(exported);hostile.sections[0].html+='<script>window.coachUnsafe=true</script><img src=x onerror="window.coachUnsafe=true"><svg onload="window.coachUnsafe=true"></svg><a href="javascript:alert(1)">unsafe link</a>';
  await imported.locator('[data-coach-file]').setInputFiles({name:'coach.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(hostile))});
  await imported.getByRole('status').filter({hasText:'已合并 19'}).waitFor();assert.equal(await imported.locator('[data-coach-section]').count(),19);
  assert.equal(await imported.locator('[data-coach-body] script,[data-coach-body] img,[data-coach-body] svg,[data-coach-body] [onclick],[data-coach-body] a[href^="javascript:"]').count(),0);assert.equal(await imported.evaluate(()=>window.coachUnsafe),undefined);
  await imported.reload();await imported.locator('[data-coach-section]').first().waitFor();assert.equal(await imported.locator('[data-coach-section]').count(),19);
  const awaySnapshot=await imported.evaluate(()=>JSON.stringify(db));
  await imported.evaluate(()=>{
   const read=File.prototype.text;
   File.prototype.text=async function(){const text=await read.call(this);await new Promise(resolve=>window.releaseCoachRead=resolve);window.coachReadResolved=true;return text;};
  });
  await imported.locator('[data-coach-file]').setInputFiles({name:'delayed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...exported,title:'换页后不应导入的课程'}))});
  await imported.waitForFunction(()=>typeof window.releaseCoachRead==='function');
  await imported.locator('[data-page="hub-writing"]').click();await imported.evaluate(()=>window.releaseCoachRead());
  await imported.waitForFunction(()=>window.coachReadResolved);await imported.evaluate(()=>new Promise(requestAnimationFrame));
  assert.equal(await imported.evaluate(()=>JSON.stringify(db)),awaySnapshot);
  assert.equal(await imported.locator('[data-page="hub-writing"]').getAttribute('aria-current'),'page');
  const denied=await page.request.get(base+'/private-study/test.json');assert.equal(denied.status(),404);
  assert.equal(await page.evaluate(async()=>(await recordingBlob('coach-preservation-audio')).text()),'existing recording');
  assert.equal(await page.evaluate(async()=>(await recordingMetadata()).filter(r=>r.id==='coach-preservation-audio').length),1);
  assert.deepEqual(errors,[]);
  const result={url:base,teachingSections:19,reviewEntries:49,preservedOldLearning:true,preservedIndexedDBRecording:true,repeatImportNoDuplicates:true,reloadWithoutPrivateEndpoint:true,completeBackupRestore:true,fileImportExport:true,invalidImportRollback:true,unsafeHtmlRemoved:true,mobileLayout:true,navigateDuringImport:true,browserErrors:errors};
  fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
