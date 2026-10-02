const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const yaml = require('js-yaml');

test('Pages finishes active runs and creates deployment records only for publishing', () => {
  const workflow = yaml.load(fs.readFileSync('.github/workflows/pages.yml', 'utf8'));
  assert.equal(workflow.concurrency.group, 'pages');
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.equal(workflow.jobs.build.environment, undefined);
  assert.equal(workflow.jobs.deploy.needs, 'build');
  assert.equal(workflow.jobs.deploy.environment.name, 'github-pages');
  assert.ok(workflow.jobs.build.steps.some(step => step.uses === 'actions/upload-pages-artifact@v3' && step.with.path === 'out'));
  assert.ok(!workflow.jobs.build.steps.some(step => step.uses?.startsWith('actions/deploy-pages@')));
  assert.ok(workflow.jobs.deploy.steps.some(step => step.id === 'deployment' && step.uses === 'actions/deploy-pages@v4'));
  assert.equal(workflow.permissions.pages, 'write');
  assert.equal(workflow.permissions['id-token'], 'write');
});
