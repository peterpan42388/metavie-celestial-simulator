import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const read=name=>readFileSync(resolve(root,name),'utf8')

test('package metadata and npm lock agree on MIT',()=>{
 const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'))
 assert.equal(pkg.license,'MIT')
 assert.equal(lock.packages[''].license,'MIT')
 assert.equal(lock.packages['node_modules/three'].license,'MIT')
 assert.equal(lock.packages['node_modules/playwright'].license,'Apache-2.0')
})

test('the repository LICENSE is the MIT grant referenced by SPDX',()=>{
 const license=read('LICENSE')
 assert.match(license,/^MIT License\n/)
 assert.match(license,/Copyright \(c\) 2026 Tech Leo/)
 assert.match(license,/Permission is hereby granted, free of charge/)
 assert.match(license,/THE SOFTWARE IS PROVIDED "AS IS"/)
 assert.doesNotMatch(license,/GNU Affero|AGPL/)
})

test('current package, README, notices, source map and asset metadata contain no AGPL claim',()=>{
 const pkg=JSON.parse(read('package.json'))
 assert.equal(pkg.license,'MIT')
 for(const name of ['README.md','THIRD_PARTY_NOTICES.md','SOURCE.md','src/fixtures.js']) {
  assert.doesNotMatch(read(name),/AGPL-3\.0|GNU Affero General Public License/)
 }
 assert.match(read('README.md'),/^# Metavie Celestial Simulator\n\nMIT\./)
 assert.match(read('THIRD_PARTY_NOTICES.md'),/original procedural work in this repository, licensed MIT/)
 assert.match(read('src/fixtures.js'),/id:'procedural-geometry',license:'MIT'/)
})

test('network source text accurately reflects the MIT distribution condition',()=>{
 const readme=read('README.md'),source=read('SOURCE.md')
 assert.doesNotMatch(readme,/network users must receive corresponding source/i)
 assert.match(readme,/MIT does not require source disclosure solely because software is made available over a network/)
 assert.match(source,/MIT does not impose a source-delivery obligation solely because the software is operated over a network/)
 assert.match(source,/Recipients of distributed copies must receive the MIT copyright and permission notice/)
})

test('archived recording provenance remains tied to its historical source commit',()=>{
 const verification=JSON.parse(read('evidence/verification.json'))
 assert.equal(verification.recording_source_commit,'a1bc30a2bf60b15b907b48e3896330cf7ab75617')
 for(const file of ['evidence/landscape/provenance.json','evidence/portrait/provenance.json']) {
  const proof=JSON.parse(read(file))
  assert.equal(proof.environment.source_commit,verification.recording_source_commit)
  assert.equal(proof.assets.find(asset=>asset.id==='procedural-geometry').license,'AGPL-3.0-or-later')
 }
 assert.match(read('THIRD_PARTY_NOTICES.md'),/Historical `evidence\/` provenance records preserve the license value embedded/)
})
