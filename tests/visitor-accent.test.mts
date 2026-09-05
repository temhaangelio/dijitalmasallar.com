import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accentOptions, isAccentPreference, resolveAccentPreference } from '../src/lib/visitor-accent.ts';
function luminance(hex: string) {
  const values = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return values[0]!*.2126 + values[1]!*.7152 + values[2]!*.0722;
}
function contrast(a: string, b: string) {
  const [low,high] = [luminance(a),luminance(b)].sort((x,y)=>x-y);
  return (high!+.05)/(low!+.05);
}
test('accent preferences reject unknown or corrupt saved values', () => {
  for (const option of accentOptions) assert.equal(isAccentPreference(option.id),true);
  for (const value of [null, undefined, '', 'slate', 'rose', 'purple', 'copper', 'green', 'amber', 'blue', '<script>', {}]) assert.equal(isAccentPreference(value),false);
});
test('every accent meets AA contrast for text and selected controls in both themes', () => {
  for (const option of accentOptions) {
    for (const [a,b] of [[option.light,'#f0f0f0'],['#ffffff',option.light],['#151515',option.dark],[option.dark,'#262626'],[option.dark,'#151515']]) {
      assert.ok(contrast(a!,b!) >= 4.5, `${option.id}: ${a} on ${b}`);
    }
  }
});

test('active header icons remain distinct from their lightly tinted surfaces', () => {
  for (const option of accentOptions) {
    for (const [foreground, canvas] of [[option.light, '#ffffff'], [option.light, '#f0f0f0'], [option.dark, '#151515'], [option.dark, '#262626']]) {
      const mixed = '#' + [1, 3, 5].map(i => Math.round(parseInt(foreground!.slice(i, i + 2), 16) * .08 + parseInt(canvas!.slice(i, i + 2), 16) * .92).toString(16).padStart(2, '0')).join('');
      assert.ok(contrast(foreground!, mixed) >= 3, `${option.id}: header icon on ${mixed}`);
    }
  }
});


test('theme defaults use red in light mode and gold in dark mode while respecting saved choices', () => {
  for (const value of [null, undefined, "auto", "obsolete"]) {
    assert.equal(resolveAccentPreference(value, "light"), "red");
    assert.equal(resolveAccentPreference(value, "dark"), "gold");
  }
  for (const option of accentOptions) {
    assert.equal(resolveAccentPreference(option.id, "light"), option.id);
    assert.equal(resolveAccentPreference(option.id, "dark"), option.id);
  }
});
