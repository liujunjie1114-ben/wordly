const test=require('node:test');
const assert=require('node:assert/strict');
test('interactive course code requires a reviewed digest and never trusts imported script',async()=>{
 const interactive=require('../assets/writing-interactive.js');
 for(const section of [{id:'unknown',html:'<script>bad()</script>'},{id:'lesson-2026-11-18',html:'<script>bad()</script>'}])await assert.rejects(()=>interactive.documentFor(section,null,'test-session'),/验证|课程/);
});
