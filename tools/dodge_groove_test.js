#!/usr/bin/env node
// v14.5.20: no periodic pack-groove / steady beat during boss lean-dodge bars; VO + throw cues kept
'use strict';
const fs=require('fs'),path=require('path');
const d=fs.readFileSync(path.join(__dirname,'../js/rooms/delivery.js'),'utf8');
const g=fs.readFileSync(path.join(__dirname,'../js/groove.js'),'utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.error('FAIL',m)}else console.log('ok',m)};

ok(/if\(b\.mode\)\{BB\.groove\.vol=0/.test(d),'dodge bars force groove.vol=0');
ok(/_bus\.gain\.setTargetAtTime\(0/.test(d),'immediate bus fade on dodge enter (clears lookahead)');
ok(/if\(b&&b\.mode&&BB\.groove\)BB\.groove\.vol=0/.test(d),'per-frame reinforce during dodge stretch');
ok(/else BB\.groove\.vol=b\.chant\|\|b\.chantIntro/.test(d),'non-dodge bars still set normal groove vol');

ok(/DODGE_VO=\{L:'dl_left',R:'dl_right',duck:'dl_duck',jump:'dl_jump',freeze:'dl_freeze'\}/.test(d),'dodge VO ids intact');
ok(/b\.vo\)BB\.say\(b\.vo/.test(d),'bar VO still spoken on enter');
ok(/mode&&!b\.vo&&DODGE_VO/.test(d),'mode bars auto-get DODGE_VO');

ok(/kind==='bomb'\)\{S\.whoosh&&S\.whoosh/.test(d),'bomb whoosh kept');
ok(/kind\[0\]==='j'\)\{S\.whoosh&&S\.whoosh/.test(d),'junk whoosh kept');
ok(/mode==='freeze'\)S\.ding&&S\.ding/.test(d),'freeze ding cue kept');
ok(/S\.pop&&S\.pop\(a\)/.test(d),'throw pop kept');

ok(/if\(b\.count\)for\(let q=0;q<4;q\+\+\)S\.tick/.test(d),'ROUND count ticks kept');
const koInit=d.slice(d.indexOf('if(!this.ko)'), d.indexOf('KO_HITS.forEach(([hk,kind]'));
ok(!/mode==='throw'[^;]{0,80}S\.tick/.test(koInit),'no tick metronome scheduled on throw bars');

ok(/if\(this\.vol>=\.01\)this\.beat\(/.test(g),'groove skips beat() while vol muted');

ok(/b\.phase\)\{[^]*?BB\.groove\.start/.test(d),'phase bars still start groove');
ok(/b\.pwr===2\)BB\.groove\.stop/.test(d),'beam still stops groove');
ok(/chant\|\|b\.chantIntro/.test(d),'chant still ducks groove vol');

ok(/throwPath=/.test(d)&&/_throwFG/.test(d),'throw path + FG preserved');
ok(/dynFill=ds=>/.test(d)&&/sum\*\.38/.test(d),'amount fill preserved');
ok(/intro standoff VS split only/.test(d),'no MEGA VS zoom preserved');

if(fails){console.error(fails+' FAIL');process.exit(1)}
console.log('all dodge_groove tests passed');
