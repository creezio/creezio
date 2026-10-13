#!/usr/bin/env node
/** Existing signed cookies and bearer sessions must follow live account state. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { SignJWT } from 'jose';
import { Hono } from 'hono';
import { configureAuth, resetAuthConfigForTests, createSessionToken, verifySessionToken, createHonoAuth, migrateBrandCredentialsToKit } from '../packages/auth/dist/index.js';
import { mountBrandPlatformSurface, sessionFromNodeHeaders } from '../packages/app-runtime/dist/index.js';

process.env.AUTH_SECRET = 'session-state-regression-secret';
delete process.env.AUTH_DISABLED;
const user = { id: 'user-1', username: 'reader', role: 'collaborator', permissions: ['nav.read'] };
const sign = claims => new SignJWT(claims).setProtectedHeader({alg:'HS256'}).setExpirationTime('5m').sign(new TextEncoder().encode(process.env.AUTH_SECRET));

test('JWT validation consults live state every time and fails closed on lookup errors', async () => {
  resetAuthConfigForTests();
  let active = true, calls = 0;
  configureAuth({ cookieName: 'state_session', isSessionActive: async session => {
    calls++; assert.equal(session.sub, user.id); return active;
  }});
  const token = await createSessionToken({user});
  assert.equal((await verifySessionToken(token)).sub, user.id);
  active = false;
  assert.equal(await verifySessionToken(token), null, 'a previously issued token must stop working');
  active = true;
  assert.equal((await verifySessionToken(token)).sub, user.id);
  assert.equal(calls, 3, 'no stale account cache');
  configureAuth({ cookieName: 'state_session' });
  active = false;
  assert.equal(await verifySessionToken(token), null, 'later auth configuration preserves the validator');
  configureAuth({ cookieName: 'state_session', isSessionActive: () => { throw new Error('store unavailable'); } });
  assert.equal(await verifySessionToken(token), null);
  configureAuth({ cookieName: 'state_session', isSessionActive: () => undefined });
  assert.equal(await verifySessionToken(token), null, 'only explicit true authenticates');
  configureAuth({ cookieName: 'state_session', isSessionActive: () => { throw new Error('invalid signature must not reach lookup'); } });
  assert.equal(await verifySessionToken('invalid'), null);
  resetAuthConfigForTests();
});

test('standalone auth without an account adapter retains legacy JWT compatibility', async () => {
  resetAuthConfigForTests();
  configureAuth({ cookieName: 'state_session', ownerPermissions: ['nav.owner'] });
  assert.equal((await verifySessionToken(await createSessionToken({user}))).sub, user.id);
  assert.deepEqual(await verifySessionToken(await sign({email:'legacy@example.test',role:'admin'})), {
    sub:'legacy-owner', email:'legacy@example.test', role:'owner', permissions:['nav.owner'],
  });
  resetAuthConfigForTests();
});

test('platform deactivation revokes cookie, bearer, module and Hono access immediately', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creezio-session-state-'));
  process.env.CREEZIO_CORE_DB_PATH = path.join(dir, 'core.db');
  configureAuth({ cookieName:'state_session', ownerPermissions:['nav.owner'], collaboratorDefaultPermissions:['nav.read'], collaboratorAssignablePermissions:['nav.read'] });
  await migrateBrandCredentialsToKit({username:'owner@state.test',password:'owner-state-test-password',displayName:'Owner'});
  const surface = mountBrandPlatformSurface({brandId:'sessionprobe',coreDbPath:process.env.CREEZIO_CORE_DB_PATH,baseUrl:()=> 'http://localhost',onLog:()=>{}});
  let closed = false;
  const req = (method, url, cookie, body) => surface.app.request(url, {method, headers:{'content-type':'application/json',...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const login = async (email,password) => { const r=await req('POST','/api/v1/auth/login',null,{email,password}); assert.equal(r.status,200); return r.headers.get('set-cookie').split(';')[0]; };
  try {
    const ownerCookie = await login('owner@state.test','owner-state-test-password');
    const created = await req('POST','/api/v1/platform/users',ownerCookie,{username:'state-reader',password:'reader-state-test-password',kind:'human'});
    assert.equal(created.status,201); const id=(await created.json()).user.id;
    const cookie = await login('state-reader','reader-state-test-password');
    const token = cookie.slice(cookie.indexOf('=')+1);
    const hono = new Hono();
    const guard = createHonoAuth({apiKeyPrefix:'test_',verifyApiKey:()=>null,checkRateLimit:()=>({ok:true,remaining:1}),rateLimitPerMinute:1});
    hono.get('/protected',guard.requireSession,c=>c.json({ok:true}));
    const check = async allowed => {
      for(const headers of [{cookie},{authorization:'Bearer '+token}]) {
        const r=await surface.app.request('/api/v1/platform/users',{headers});
        assert.equal(r.status,allowed?200:401,'platform cookie/bearer');
        const session=await sessionFromNodeHeaders(headers);
        assert.equal(session?.sub??null,allowed?id:null,'module session');
      }
      assert.equal((await hono.request('/protected',{headers:{cookie}})).status,allowed?200:401,'Hono middleware');
    };
    await check(true);
    const setActive = async active => {const r=await req('PATCH','/api/v1/platform/users/'+id,ownerCookie,{active});assert.equal(r.status,200)};
    await setActive(false); await check(false);
    await setActive(true); await check(true);
    const target = surface.runtime.store.getUserById(id);
    const owner = surface.runtime.store.getOwner();
    const impersonated = await createSessionToken({user:target,actor:owner});
    assert.equal((await verifySessionToken(impersonated)).actorSub,owner.id);
    await setActive(false); assert.equal(await verifySessionToken(impersonated),null,'inactive impersonation target');
    await setActive(true);
    assert.equal(await verifySessionToken(await createSessionToken({user:target,actor:{...owner,id:'deleted-owner'}})),null,'missing impersonation actor');
    assert.equal(await verifySessionToken(await createSessionToken({user:owner,actor:{...target,role:'owner'}})),null,'actor must still be an owner');
    assert.equal(await verifySessionToken(await createSessionToken({user:{...target,id:'deleted-user'}})),null,'deleted subject');
    assert.equal(await verifySessionToken(await createSessionToken({user:{...target,role:'owner'}})),null,'role in JWT must match current account');
    assert.ok(await verifySessionToken(await sign({email:owner.username,role:'admin'})),'legacy owner mapped to the current owner');
    assert.equal(await verifySessionToken(await sign({email:'absent@state.test',role:'admin'})),null,'unknown legacy owner');
    // A second platform owner used as actor may itself be disabled or demoted.
    surface.runtime.store.db.prepare('UPDATE creezio_platform_users SET role = ? WHERE id = ?').run('owner',id);
    const actorToken = await createSessionToken({user:owner,actor:{...target,role:'owner'}});
    assert.ok(await verifySessionToken(actorToken));
    surface.runtime.store.db.prepare('UPDATE creezio_platform_users SET active = 0 WHERE id = ?').run(id);
    assert.equal(await verifySessionToken(actorToken),null,'inactive actor');
    surface.runtime.store.db.prepare('UPDATE creezio_platform_users SET active = 1 WHERE id = ?').run(id);
    assert.ok(await verifySessionToken(actorToken));
    surface.runtime.store.db.prepare('UPDATE creezio_platform_users SET role = ? WHERE id = ?').run('collaborator',id);
    assert.equal(await verifySessionToken(actorToken),null,'demoted actor');
    surface.close(); closed = true;
    assert.equal(await verifySessionToken(token),null,'unmounted store fails closed');
  } finally {
    if (!closed) surface.close(); resetAuthConfigForTests();
    // The isolated directory is owned by this test only.
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
