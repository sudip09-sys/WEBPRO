import test from 'node:test';import assert from 'node:assert/strict';import {conversation,addUnique} from './api.mjs';
const message=(id,sender,receiver,time=1)=>({id,sender_id:sender,receiver_id:receiver,message:id,timestamp_ms:time});
test('conversation includes both directions and excludes other users',()=>{const list=[message('a','one','two'),message('b','two','one'),message('c','three','one'),message('d','one','one')];assert.deepEqual(conversation(list,'one','two').map(m=>m.id),['a','b']);});
test('conversation sorts by timestamp',()=>assert.deepEqual(conversation([message('late','a','b',20),message('early','b','a',2)],'a','b').map(m=>m.id),['early','late']));
test('conversation never mutates the stored message list',()=>{const list=[message('late','a','b',20),message('early','b','a',2)];conversation(list,'a','b');assert.equal(list[0].id,'late')});
test('adding a duplicate event does not duplicate the bubble',()=>{const m=message('same','a','b');assert.equal(addUnique([m],{...m}).length,1)});
test('new messages append without modifying the previous array',()=>{const list=[message('first','a','b')],next=message('second','b','a');const result=addUnique(list,next);assert.equal(list.length,1);assert.equal(result.length,2);assert.equal(result[1],next)});
test('empty conversations return an empty array',()=>assert.deepEqual(conversation([],'a','b'),[]));
