import test from 'node:test';
import assert from 'node:assert/strict';
import { mentionToken, insertMention } from '../features/works/mention.ts';
test('suggest members only at the caret after @', () => {
 assert.deepEqual(mentionToken('سلام @رض',8),{ query:'رض',start:5,end:8 });
 assert.equal(mentionToken('email@example.com',17),null);
 assert.equal(mentionToken('سلام @رض بعد',12),null);
 assert.deepEqual(mentionToken('@',1),{query:'',start:0,end:1});
});
test('inserting a member preserves text after the caret',()=>{
 const text='سلام @رض ادامه';const token=mentionToken(text,8);
 assert.equal(insertMention(text,token,'@reza'),'سلام @reza  ادامه');
});
